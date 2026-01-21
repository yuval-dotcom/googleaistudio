
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Property, Transaction, CurrencyCode, Language } from './types';
import { supabaseDataService } from './services/supabaseService';
import { dataService as mockDataService } from './services/mockDataService';

interface AppContextType {
  properties: Property[];
  transactions: Transaction[];
  globalCurrency: CurrencyCode;
  lang: Language;
  loading: boolean;
  error: string | null;
  setGlobalCurrency: (c: CurrencyCode) => void;
  setLang: (l: Language) => void;
  refreshData: () => Promise<void>;
  updatePropertyLocally: (p: Property) => void;
  isDemo: boolean;
  setIsDemo: (val: boolean) => void;
  dataService: any;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [globalCurrency, setGlobalCurrency] = useState<CurrencyCode>('NIS');
  // Changed default language to 'en'
  const [lang, setLang] = useState<Language>('en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  const dataService = isDemo ? mockDataService : supabaseDataService;

  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [props, txs] = await Promise.all([
        dataService.getProperties(),
        dataService.getTransactions()
      ]);
      setProperties(props);
      setTransactions(txs);
    } catch (err: any) {
      console.error("Data fetch error:", err);
      if (!isDemo && err.code === '42P01') {
        setError("MISSING_TABLES");
      } else {
        setError("Connection error. Please check your network.");
      }
    } finally {
      setLoading(false);
    }
  }, [isDemo, dataService]);

  const updatePropertyLocally = (updated: Property) => {
    setProperties(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  return (
    <AppContext.Provider value={{
      properties, transactions, globalCurrency, lang, loading, error,
      setGlobalCurrency, setLang, refreshData, updatePropertyLocally,
      isDemo, setIsDemo,
      dataService
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
