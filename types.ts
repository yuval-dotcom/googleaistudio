
export type CurrencyCode = 'NIS' | 'USD' | 'EUR';
export type Language = 'en' | 'he';

export type PropertyType = 'Residential' | 'Commercial' | 'Logistics' | 'Shop';

export interface Company {
  id: string;
  name: string;
  userOwnership: number; // Percentage the user owns of this company (0-100)
}

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

export interface PropertyUnit {
  id: string;
  name: string; // e.g., "Unit A", "Floor 1"
  size?: number; // sq meters
  lease?: Lease;
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
  path?: string; 
  type: 'image' | 'pdf' | 'other';
  uploadedAt: string;
}

export interface Property {
  id: string;
  userId: string;
  address: string;
  country: string;
  type: PropertyType;
  currency: CurrencyCode;
  purchasePrice: number;
  purchasePriceNIS?: number;
  marketValue: number;
  incomeTaxRate: number;
  propertyTaxRate: number;
  
  // Ownership Entity
  holdingCompany?: string; // Links to Company Name or ID

  // Mortgage Details
  monthlyMortgage?: number;
  mortgageInterestRate?: number;
  loanBalance?: number;
  bankName?: string;
  mortgageMix?: MortgageMix;

  // Partnership & Legal
  partners?: Partner[];
  lease?: Lease; // Main lease (for non-split properties)
  units?: PropertyUnit[]; // For split commercial properties
  documents?: PropertyDocument[];

  capitalGainsRule?: string; 
}

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  userId: string;
  propertyId: string;
  date: string;
  amount: number;
  type: TransactionType;
  category: string;
  receiptUrl?: string;
  notes?: string;
}

export enum ViewState {
  LOGIN = 'login',
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
