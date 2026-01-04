
import { supabase } from './supabaseConfig';
import { Property, Transaction, PropertyDocument } from '../types';

class SupabaseService {
  
  public async getUserId(): Promise<string | undefined> {
    const { data } = await supabase.auth.getSession();
    return data.session?.user.id;
  }

  // --- Mappers (CamelCase <-> snake_case) ---

  private toPropertyDB(p: Partial<Property>, userId: string) {
    return {
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
      mortgage_mix: p.mortgageMix, // JSONB
      partners: p.partners,        // JSONB
      lease: p.lease,              // JSONB
      documents: p.documents       // JSONB
    };
  }

  private fromPropertyDB(row: any): Property {
    return {
      id: row.id,
      userId: row.user_id,
      address: row.address,
      country: row.country,
      type: row.type,
      currency: row.currency,
      purchasePrice: Number(row.purchase_price),
      purchasePriceNIS: row.purchase_price_nis ? Number(row.purchase_price_nis) : undefined,
      marketValue: Number(row.market_value),
      incomeTaxRate: Number(row.income_tax_rate),
      propertyTaxRate: Number(row.property_tax_rate),
      monthlyMortgage: row.monthly_mortgage ? Number(row.monthly_mortgage) : undefined,
      mortgageInterestRate: row.mortgage_interest_rate ? Number(row.mortgage_interest_rate) : undefined,
      loanBalance: row.loan_balance ? Number(row.loan_balance) : undefined,
      bankName: row.bank_name,
      mortgageMix: row.mortgage_mix,
      partners: row.partners,
      lease: row.lease,
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

  // --- Properties ---

  async getProperties(): Promise<Property[]> {
    const userId = await this.getUserId();
    if (!userId) return [];
    
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data.map(this.fromPropertyDB);
  }

  async addProperty(property: Omit<Property, 'id'>): Promise<Property> {
    const userId = await this.getUserId();
    if (!userId) throw new Error("User not authenticated");

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
    if (!userId) throw new Error("User not authenticated");

    const payload = this.toPropertyDB(property, userId);
    
    const { data, error } = await supabase
      .from('properties')
      .update(payload)
      .eq('id', property.id)
      .select()
      .single();

    if (error) throw error;
    return this.fromPropertyDB(data);
  }

  async uploadFile(file: File, propertyId: string): Promise<PropertyDocument> {
    const userId = await this.getUserId();
    if (!userId) throw new Error("User not authenticated");

    const fileExt = file.name.split('.').pop();
    const cleanName = file.name.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${Date.now()}-${cleanName}.${fileExt}`;
    const filePath = `${userId}/${propertyId}/${fileName}`;

    const { data, error: uploadError } = await supabase.storage
      .from('property-docs')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const finalPath = data?.path || filePath;

    const { data: urlData } = supabase.storage
      .from('property-docs')
      .getPublicUrl(finalPath);

    return {
      id: Math.random().toString(36).substring(2),
      name: file.name,
      url: urlData.publicUrl,
      path: finalPath,
      type: file.type.startsWith('image/') ? 'image' : 'pdf',
      uploadedAt: new Date().toISOString()
    };
  }

  async deleteStorageFile(doc: PropertyDocument): Promise<boolean> {
    if (!doc) return false;
    if (doc.url && doc.url.startsWith('blob:')) return true;

    const BUCKET = 'property-docs';
    let pathToDelete = doc.path;

    if (!pathToDelete && doc.url) {
      try {
        const urlObj = new URL(doc.url);
        const parts = urlObj.pathname.split(`/${BUCKET}/`);
        if (parts.length > 1) {
          pathToDelete = decodeURIComponent(parts[1]);
        }
      } catch (e) {
        console.warn("[Supabase] Failed to resolve path from URL");
      }
    }

    if (!pathToDelete) return true;

    const { error } = await supabase.storage
      .from(BUCKET)
      .remove([pathToDelete]);

    if (error) {
      console.error("[Supabase] Removal Failed:", error.message);
      return false;
    }
    return true;
  }

  // --- Transactions ---

  async getTransactions(): Promise<Transaction[]> {
    const userId = await this.getUserId();
    if (!userId) return [];

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data.map(this.fromTransactionDB);
  }

  async addTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
    const userId = await this.getUserId();
    if (!userId) throw new Error("User not authenticated");

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
    if (!userId) throw new Error("User not authenticated");

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async seedDatabase(mockProps: Property[], mockTxs: Transaction[]) {
    const userId = await this.getUserId();
    if (!userId) return;

    const idMap: Record<string, string> = {};

    for (const p of mockProps) {
       const payload = this.toPropertyDB(p, userId);
       const { data } = await supabase.from('properties').insert(payload).select().single();
       if (data) idMap[p.id] = data.id;
    }

    for (const t of mockTxs) {
      if (idMap[t.propertyId]) {
         const payload = this.toTransactionDB({ ...t, propertyId: idMap[t.propertyId] }, userId);
         await supabase.from('transactions').insert(payload);
      }
    }
  }
}

export const supabaseDataService = new SupabaseService();
