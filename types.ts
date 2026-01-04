
export type CurrencyCode = 'NIS' | 'USD' | 'EUR';
export type Language = 'en' | 'he';

export type PropertyType = 'Residential' | 'Commercial' | 'Logistics' | 'Shop';

export interface Partner {
  uid: string;
  name: string;
  percentage: number; // 0-100
  hasAccess: boolean;
}

export interface Lease {
  expirationDate: string; // ISO
  tenantName: string;
  monthlyRent: number;
}

export interface MortgageMix {
  fixedPercent: number;
  variablePercent: number;
  primePercent: number;
}

export interface PropertyDocument {
  id: string;
  name: string;
  url: string;
  path?: string; // NEW: Explicit storage path to ensure reliable deletion
  type: 'image' | 'pdf' | 'other';
  uploadedAt: string;
}

export interface Property {
  id: string;
  userId: string; // Owner/Creator
  address: string;
  country: string; // e.g., "USA", "UK"
  type: PropertyType; // NEW
  currency: CurrencyCode; // The native currency of the property
  purchasePrice: number; // In native currency
  purchasePriceNIS?: number; // The amount paid in NIS at the time of purchase (Cost Basis)
  marketValue: number;
  incomeTaxRate: number; // percentage
  propertyTaxRate: number; // percentage
  
  // Mortgage Details
  monthlyMortgage?: number; // Total monthly payment (P&I)
  mortgageInterestRate?: number; // Annual interest rate percentage
  loanBalance?: number; // Outstanding principal
  bankName?: string; // NEW
  mortgageMix?: MortgageMix; // NEW

  // Partnership & Legal
  partners?: Partner[]; // NEW
  lease?: Lease; // NEW
  documents?: PropertyDocument[]; // NEW - Uploaded files

  // Legacy fields kept for compatibility if needed
  capitalGainsRule?: string; 
}

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  userId: string;
  propertyId: string;
  date: string; // ISO string
  amount: number;
  type: TransactionType;
  category: string; // e.g., "Rent", "Maintenance", "Mortgage"
  receiptUrl?: string; // NEW
  notes?: string; // NEW
}

export interface PortfolioMetrics {
  totalValue: number;
  monthlyCashFlow: number;
  totalIncomeLast6Months: number;
  totalExpenseLast6Months: number;
}

export interface TaxLiability {
  propertyId: string;
  address: string;
  country: string;
  netOperatingIncome: number;
  estimatedTax: number;
}

export enum ViewState {
  LOGIN = 'login', // NEW
  HOME = 'home',
  PORTFOLIO = 'portfolio',
  QUICK_ADD = 'quick_add',
  TAX_REPORT = 'tax_report',
  TEST_RUNNER = 'test_runner',
  CHAT = 'chat', 
  PROPERTY_DETAIL = 'property_detail',
  PROPERTY_EDIT = 'property_edit',
  SETTINGS = 'settings'
}
