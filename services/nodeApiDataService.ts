/**
 * Data service that talks to the Node API (/api/assets, /api/transactions) with the auth token.
 * Maps API responses to the frontend Property / Transaction shapes.
 */

import type { Property, Transaction, Company, DealWithMetrics } from '../types';
import { getToken } from './nodeAuthService';

const API = '';

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

/** Map API Asset to frontend Property */
function mapAssetToProperty(a: any): Property {
  const loans = a.loans || [];
  const totalLoanBalance = loans.reduce((s: number, l: any) => s + (l.currentBalance ?? 0), 0);
  const totalMonthlyPayment = loans.reduce((s: number, l: any) => s + (l.monthlyPayment ?? 0), 0);
  const ownerships = a.ownerships || [];
  const primaryOwnerName = ownerships[0]?.entityName || '';
  const partners = ownerships.map((o: any) => ({
    uid: o.id,
    name: o.entityName || '',
    percentage: Math.round((o.percentage ?? 0) * 100),
    hasAccess: true,
  }));
  const units = (a.units || []).map((u: any) => {
    const contract = (u.contracts || [])[0];
    return {
      id: u.id,
      name: u.description || '',
      size: u.sizeSqm,
      lease: contract ? {
        tenantName: contract.tenantName || '',
        monthlyRent: contract.monthlyRent ?? 0,
        expirationDate: contract.endDate || '',
      } : undefined,
    };
  });
  return {
    id: a.id,
    userId: a.userId || '',
    address: a.name || '',
    country: a.country || 'Israel',
    type: a.type || 'Commercial',
    currency: 'NIS',
    purchasePrice: a.purchasePrice ?? 0,
    marketValue: a.currentValue ?? 0,
    incomeTaxRate: 0,
    propertyTaxRate: 0,
    holdingCompany: primaryOwnerName || undefined,
    partners: partners.length > 0 ? partners : undefined,
    monthlyMortgage: totalMonthlyPayment || undefined,
    loanBalance: totalLoanBalance || undefined,
    units,
    documents: [],
  };
}

/** Map API Transaction to frontend Transaction */
function mapTx(t: any): Transaction {
  const rawType = String(t.type || '').toUpperCase();
  const mappedType = rawType === 'INCOME' || rawType === 'INCOME ' || rawType === 'Income' ? 'income' : 'expense';
  return {
    id: t.id,
    userId: '',
    propertyId: t.assetId,
    date: t.date,
    amount: t.amount,
    type: mappedType,
    category: t.type,
    notes: t.description,
  };
}

export const nodeApiDataService = {
  async getProperties(): Promise<Property[]> {
    const res = await fetch(API + '/api/assets', { headers: authHeaders() });
    if (!res.ok) throw new Error(res.status === 401 ? 'Unauthorized' : await res.text());
    const data = await res.json();
    return (data || []).map(mapAssetToProperty);
  },

  async getTransactions(): Promise<Transaction[]> {
    const res = await fetch(API + '/api/transactions', { headers: authHeaders() });
    if (!res.ok) throw new Error(res.status === 401 ? 'Unauthorized' : await res.text());
    const data = await res.json();
    return (data || []).map(mapTx);
  },

  async getCompanies(): Promise<Company[]> {
    return [];
  },

  async uploadFile(file: File, _propertyId?: string): Promise<{ id: string; name: string; url: string; path: string; type: string; uploadedAt: string }> {
    const form = new FormData();
    form.append('file', file);
    const token = getToken();
    const headers: HeadersInit = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(API + '/api/upload', {
      method: 'POST',
      headers,
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || res.statusText);
    return {
      id: data.id,
      name: data.name,
      url: data.url?.startsWith('http') ? data.url : (typeof window !== 'undefined' ? window.location.origin + data.url : data.url),
      path: data.path || data.url,
      type: data.type || 'pdf',
      uploadedAt: data.uploadedAt,
    };
  },

  async addTransaction(payload: {
    propertyId: string;
    amount: number;
    type: 'income' | 'expense';
    category?: string;
    date?: string;
    notes?: string;
  }): Promise<Transaction> {
    const res = await fetch(API + '/api/transactions', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        assetId: payload.propertyId,
        amount: payload.amount,
        // Backend normalizes to Prisma enum (INCOME / EXPENSE)
        type: payload.type === 'income' ? 'INCOME' : 'EXPENSE',
        date: payload.date || new Date().toISOString(),
        description: payload.notes || payload.category,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || res.statusText);
    return mapTx(data);
  },

  async getAsset(assetId: string): Promise<Property> {
    const res = await fetch(API + `/api/assets/${assetId}`, { headers: authHeaders() });
    if (!res.ok) throw new Error(res.status === 401 ? 'Unauthorized' : await res.text());
    const data = await res.json();
    return mapAssetToProperty(data);
  },

  async addUnit(assetId: string, payload: { description: string; sizeSqm?: number; status?: string }): Promise<void> {
    const res = await fetch(API + `/api/assets/${assetId}/units`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || res.statusText);
  },

  async addOwnership(assetId: string, payload: { entityName: string; percentage: number }): Promise<void> {
    const pct = payload.percentage > 1 ? payload.percentage / 100 : payload.percentage;
    const res = await fetch(API + `/api/assets/${assetId}/ownerships`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ entityName: payload.entityName, percentage: pct }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || res.statusText);
  },

  async addLoan(assetId: string, payload: {
    originalAmount: number;
    currentBalance: number;
    monthlyPayment: number;
    principalPayment: number;
    interestPayment: number;
  }): Promise<void> {
    const res = await fetch(API + `/api/assets/${assetId}/loans`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || res.statusText);
  },

  async updateProperty(property: Property): Promise<void> {
    const res = await fetch(API + `/api/assets/${property.id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({
        name: property.address,
        type: property.type,
        country: property.country,
        purchasePrice: property.purchasePrice,
        currentValue: property.marketValue,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || res.statusText);
  },

  async deleteProperty(propertyId: string): Promise<void> {
    const res = await fetch(API + `/api/assets/${propertyId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || res.statusText);
    }
  },

  async getDeals(): Promise<DealWithMetrics[]> {
    const res = await fetch(API + '/api/deals', { headers: authHeaders() });
    if (!res.ok) throw new Error(res.status === 401 ? 'Unauthorized' : await res.text());
    const data = await res.json();
    return data || [];
  },

  async createDeal(payload: {
    name: string;
    assetType: string;
    purchasePrice: number;
    equityAmount: number;
    loanAmount?: number;
    interestRate?: number;
    holdYears?: number;
    expectedRent?: number;
    expectedOccupancy?: number;
    operatingExpenses?: number;
    location?: string;
  }): Promise<DealWithMetrics> {
    const res = await fetch(API + '/api/deals', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || res.statusText);
    return data;
  },
};
