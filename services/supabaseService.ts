
import { supabase } from './supabaseConfig';
import { Property, Transaction, PropertyDocument, Company } from '../types';

class SupabaseService {
  
  public async getUserId(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      throw new Error("Authentication required for private data access.");
    }
    return session.user.id;
  }

  private toPropertyDB(p: Partial<Property>, userId: string) {
    const dbObj: any = {
      user_id: userId,
      address: p.address,
      country: p.country,
      type: p.type,
      currency: p.currency,
      purchase_price: p.purchasePrice,
      purchase_price_nis: p.purchasePriceNIS,
      market_value: p.marketValue,
      income_tax_rate: p.incomeTaxRate,
      property_tax_rate: p.propertyTaxRate,
      monthly_mortgage: p.monthlyMortgage,
      mortgage_interest_rate: p.mortgageInterestRate,
      loan_balance: p.loanBalance,
      bank_name: p.bankName,
      mortgage_mix: p.mortgageMix,
      partners: p.partners,
      lease: p.lease,
      holding_company: p.holdingCompany,
      units: p.units || [],
      documents: p.documents || []
    };

    Object.keys(dbObj).forEach(key => dbObj[key] === undefined && delete dbObj[key]);
    return dbObj;
  }

  private fromPropertyDB(row: any): Property {
    return {
      id: row.id,
      userId: row.user_id,
      address: row.address,
      country: row.country,
      type: row.type,
      currency: row.currency,
      purchasePrice: Number(row.purchase_price || 0),
      purchasePriceNIS: row.purchase_price_nis ? Number(row.purchase_price_nis) : undefined,
      marketValue: Number(row.market_value || 0),
      incomeTaxRate: Number(row.income_tax_rate || 0),
      propertyTaxRate: Number(row.property_tax_rate || 0),
      monthlyMortgage: row.monthly_mortgage ? Number(row.monthly_mortgage) : undefined,
      mortgageInterestRate: row.mortgage_interest_rate ? Number(row.mortgage_interest_rate) : undefined,
      loanBalance: row.loan_balance ? Number(row.loan_balance) : undefined,
      bankName: row.bank_name,
      mortgageMix: row.mortgage_mix,
      partners: row.partners,
      lease: row.lease,
      holdingCompany: row.holding_company,
      units: row.units || [],
      documents: row.documents || []
    };
  }

  private toTransactionDB(t: Partial<Transaction>, userId: string) {
    return {
      user_id: userId,
      property_id: t.propertyId,
      date: t.date,
      amount: t.amount,
      type: t.type,
      category: t.category,
      receipt_url: t.receiptUrl,
      notes: t.notes
    };
  }

  private fromTransactionDB(row: any): Transaction {
    return {
      id: row.id,
      userId: row.user_id,
      propertyId: row.property_id,
      date: row.date,
      amount: Number(row.amount),
      type: row.type,
      category: row.category,
      receiptUrl: row.receipt_url,
      notes: row.notes
    };
  }

  async getProperties(): Promise<Property[]> {
    try {
      const userId = await this.getUserId();
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', userId); 
      if (error) throw error;
      return (data || []).map(this.fromPropertyDB);
    } catch (e) {
      console.error("Supabase getProperties failed:", e);
      return [];
    }
  }

  async addProperty(property: Omit<Property, 'id'>): Promise<Property> {
    const userId = await this.getUserId();
    const payload = this.toPropertyDB(property, userId);
    const { data, error } = await supabase
      .from('properties')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return this.fromPropertyDB(data);
  }

  async updateProperty(property: Property): Promise<Property> {
    const userId = await this.getUserId();
    const payload = this.toPropertyDB(property, userId);
    const { data, error } = await supabase
      .from('properties')
      .update(payload)
      .eq('id', property.id)
      .eq('user_id', userId) 
      .select()
      .single();
    if (error) throw error;
    return this.fromPropertyDB(data);
  }

  async getCompanies(): Promise<Company[]> {
    try {
      const userId = await this.getUserId();
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        name: row.name,
        userOwnership: Number(row.user_ownership)
      }));
    } catch (e) {
      console.error("Supabase getCompanies failed:", e);
      return [];
    }
  }

  async saveCompany(company: Partial<Company>): Promise<Company> {
    const userId = await this.getUserId();
    const payload = {
      user_id: userId,
      name: company.name,
      user_ownership: company.userOwnership
    };

    if (company.id && company.id.length > 20) { // Check if it looks like a UUID
      const { data, error } = await supabase
        .from('companies')
        .update(payload)
        .eq('id', company.id)
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      return { id: data.id, name: data.name, userOwnership: Number(data.user_ownership) };
    } else {
      const { data, error } = await supabase
        .from('companies')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return { id: data.id, name: data.name, userOwnership: Number(data.user_ownership) };
    }
  }

  async deleteCompany(id: string): Promise<void> {
    const userId = await this.getUserId();
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  }

  async getSignedUrl(path: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('property-docs')
      .createSignedUrl(path, 3600);
    
    if (error) {
      console.error("Signed URL error:", error);
      throw error;
    }
    return data.signedUrl;
  }

  async uploadFile(file: File, propertyId: string): Promise<PropertyDocument> {
    const userId = await this.getUserId();
    const fileExt = file.name.split('.').pop();
    const cleanFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${userId}/${propertyId}/${cleanFileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('property-docs')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });
      
    if (uploadError) {
      if ((uploadError as any).message?.includes('Bucket not found')) {
        throw new Error("BUCKET NOT FOUND: Please ensure 'property-docs' exists in Supabase Storage and you have run the SETUP_SQL.");
      }
      throw uploadError;
    }
    
    return {
      id: Math.random().toString(36).substring(2),
      name: file.name,
      url: '', 
      path: filePath,
      type: file.type.startsWith('image/') ? 'image' : 'pdf',
      uploadedAt: new Date().toISOString()
    };
  }

  async deleteStorageFile(doc: PropertyDocument): Promise<boolean> {
    if (!doc || !doc.path) return true;
    const { error } = await supabase.storage.from('property-docs').remove([doc.path]);
    return !error;
  }

  async getTransactions(): Promise<Transaction[]> {
    try {
      const userId = await this.getUserId();
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });
      if (error) throw error;
      return (data || []).map(this.fromTransactionDB);
    } catch (e) {
      return [];
    }
  }

  async addTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
    const userId = await this.getUserId();
    const payload = this.toTransactionDB(transaction, userId);
    const { data, error } = await supabase
      .from('transactions')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return this.fromTransactionDB(data);
  }

  async deleteTransaction(id: string): Promise<void> {
    const userId = await this.getUserId();
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId); 
    if (error) throw error;
  }
}

export const supabaseDataService = new SupabaseService();
