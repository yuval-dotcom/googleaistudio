/**
 * Data service that talks to the Node API (/api/assets, /api/transactions) with the auth token.
 * Maps API responses to the frontend Property / Transaction shapes.
 */

import type { Property, Transaction, Company } from '../types';
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
    partners: [],
    units: (a.units || []).map((u: any) => ({
      id: u.id,
      name: u.description || '',
      size: u.sizeSqm,
    })),
    documents: [],
  };
}

/** Map API Transaction to frontend Transaction */
function mapTx(t: any): Transaction {
  return {
    id: t.id,
    userId: '',
    propertyId: t.assetId,
    date: t.date,
    amount: t.amount,
    type: t.type === 'Income' ? 'income' : 'expense',
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

  // Optional: add more methods (addProperty, etc.) when the frontend needs them
};
