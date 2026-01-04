
import { Property, Transaction, PropertyDocument } from '../types';

// Initial Mock Data
const INITIAL_PROPERTIES: Property[] = [
  {
    id: 'p1',
    userId: 'user1',
    address: '123 Main St',
    country: 'USA',
    type: 'Residential',
    currency: 'USD',
    purchasePrice: 250000,
    purchasePriceNIS: 850000, 
    marketValue: 320000,
    incomeTaxRate: 25,
    propertyTaxRate: 1.2,
    monthlyMortgage: 1200,
    mortgageInterestRate: 4.5,
    loanBalance: 200000,
    bankName: 'Chase Bank',
    mortgageMix: { fixedPercent: 60, variablePercent: 40, primePercent: 0 },
    partners: [
      { uid: 'user1', name: 'Me', percentage: 50, hasAccess: true },
      { uid: 'p2', name: 'John Doe', percentage: 50, hasAccess: true }
    ],
    lease: {
      expirationDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45).toISOString(),
      tenantName: 'Alice Smith',
      monthlyRent: 2000
    },
    documents: []
  },
  {
    id: 'p2',
    userId: 'user1',
    address: '45 High St',
    country: 'UK',
    type: 'Shop',
    currency: 'EUR', 
    purchasePrice: 180000,
    purchasePriceNIS: 700000, 
    marketValue: 210000,
    incomeTaxRate: 40,
    propertyTaxRate: 0,
    monthlyMortgage: 850,
    mortgageInterestRate: 3.8,
    loanBalance: 140000,
    bankName: 'HSBC',
    mortgageMix: { fixedPercent: 100, variablePercent: 0, primePercent: 0 },
    partners: [
      { uid: 'user1', name: 'Me', percentage: 100, hasAccess: true }
    ],
    lease: {
      expirationDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 200).toISOString(),
      tenantName: 'Bob Jones',
      monthlyRent: 1400
    },
    documents: []
  },
  {
    id: 'p3',
    userId: 'user1',
    address: '77 Rothschild Blvd',
    country: 'Israel',
    type: 'Commercial',
    currency: 'NIS',
    purchasePrice: 1500000,
    purchasePriceNIS: 1500000,
    marketValue: 1950000,
    incomeTaxRate: 30,
    propertyTaxRate: 2.5,
    monthlyMortgage: 6500,
    mortgageInterestRate: 5.0,
    loanBalance: 1200000,
    bankName: 'Leumi',
    mortgageMix: { fixedPercent: 33, variablePercent: 33, primePercent: 34 },
    partners: [
      { uid: 'user1', name: 'Me', percentage: 25, hasAccess: true },
      { uid: 'inv1', name: 'Inv Group A', percentage: 75, hasAccess: false }
    ],
    lease: {
      expirationDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
      tenantName: 'Tech Startup Ltd',
      monthlyRent: 9000
    },
    documents: []
  }
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 't1', userId: 'user1', propertyId: 'p1', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), amount: 2000, type: 'income', category: 'Rent' },
  { id: 't2', userId: 'user1', propertyId: 'p1', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), amount: 150, type: 'expense', category: 'Maintenance' },
  { id: 't3', userId: 'user1', propertyId: 'p2', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), amount: 1400, type: 'income', category: 'Rent' },
  { id: 't4', userId: 'user1', propertyId: 'p3', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(), amount: 9000, type: 'income', category: 'Rent' },
  { id: 't5', userId: 'user1', propertyId: 'p3', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(), amount: 3500, type: 'expense', category: 'Mortgage' },
  { id: 't6', userId: 'user1', propertyId: 'p1', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(), amount: 2000, type: 'income', category: 'Rent' },
];

class DataService {
  private properties: Property[] = INITIAL_PROPERTIES;
  private transactions: Transaction[] = INITIAL_TRANSACTIONS;

  getProperties(): Promise<Property[]> {
    return Promise.resolve([...this.properties]);
  }

  addProperty(property: Omit<Property, 'id'>): Promise<Property> {
    const newProp = { ...property, id: Math.random().toString(36).substr(2, 9) };
    this.properties.push(newProp);
    return Promise.resolve(newProp);
  }

  updateProperty(property: Property): Promise<Property> {
    const index = this.properties.findIndex(p => p.id === property.id);
    if (index !== -1) {
      this.properties[index] = property;
      return Promise.resolve(property);
    }
    return Promise.reject(new Error("Property not found"));
  }

  getTransactions(): Promise<Transaction[]> {
    return Promise.resolve([...this.transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }

  addTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
    const newTx = { ...transaction, id: Math.random().toString(36).substr(2, 9) };
    this.transactions.push(newTx);
    return Promise.resolve(newTx);
  }

  deleteTransaction(id: string): Promise<void> {
    this.transactions = this.transactions.filter(t => t.id !== id);
    return Promise.resolve();
  }

  uploadFile(file: File, propertyId: string): Promise<PropertyDocument> {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                id: Math.random().toString(36).substr(2, 9),
                name: file.name,
                url: URL.createObjectURL(file),
                path: 'mock/path/' + file.name,
                type: file.type.startsWith('image/') ? 'image' : 'pdf',
                uploadedAt: new Date().toISOString()
            });
        }, 1000);
    });
  }

  deleteStorageFile(doc: PropertyDocument): Promise<boolean> {
    return new Promise((resolve) => setTimeout(() => resolve(true), 500));
  }
}

export const dataService = new DataService();
