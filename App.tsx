
import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Property, Transaction, CurrencyCode, ViewState, Language, Company } from './types';
import { Dashboard } from './views/Dashboard';
import { Portfolio } from './views/Portfolio';
import { TaxReport } from './views/TaxReport';
import { ChatAssistant } from './views/ChatAssistant';
import { Settings } from './views/Settings';
import { Login } from './views/Login';
import { QuickAdd } from './views/QuickAdd';
import { PropertyDetail } from './views/PropertyDetail';
import { PropertyEditor } from './views/PropertyEditor';
import { DealsAnalysis } from './views/DealsAnalysis';
import { BottomNav } from './components/BottomNav';
import { dataService as mockDataService } from './services/mockDataService';
import { nodeApiDataService } from './services/nodeApiDataService';
import { getMe, clearToken, setToken } from './services/nodeAuthService';
import { getDir } from './services/translationService';
import { Loader2, Database, RefreshCcw } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.LOGIN);
  const [user, setUser] = useState<any | null>(null);
  const [globalCurrency, setGlobalCurrency] = useState<CurrencyCode>('NIS');
  const [lang, setLang] = useState<Language>('en'); 
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);

  const activeService = isDemo ? mockDataService : nodeApiDataService;
  const queryClient = useQueryClient();

  const {
    data: properties = [],
    error: propertiesError,
    isError: isPropertiesError,
    isFetching: isPropertiesFetching,
  } = useQuery({
    queryKey: ['properties', { isDemo, userId: user?.id }],
    queryFn: () => activeService.getProperties(),
    enabled: !!user || isDemo,
  });

  const {
    data: transactions = [],
    error: transactionsError,
    isError: isTransactionsError,
    isFetching: isTransactionsFetching,
  } = useQuery({
    queryKey: ['transactions', { isDemo, userId: user?.id }],
    queryFn: () => activeService.getTransactions(),
    enabled: !!user || isDemo,
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('global_currency');
      if (saved === 'NIS' || saved === 'USD' || saved === 'EUR') {
        setGlobalCurrency(saved);
      }
    } catch (e) {
      console.error('Failed to load global currency', e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('global_currency', globalCurrency);
    } catch (e) {
      console.error('Failed to persist global currency', e);
    }
  }, [globalCurrency]);

  useEffect(() => {
    if (!isPropertiesError || !propertiesError) return;
    console.error('Properties fetch error:', propertiesError);
    const err = propertiesError as any;
    if (!isDemo && err && err.code === '42P01') {
      setDbError('MISSING_TABLES');
    }
  }, [isPropertiesError, propertiesError, isDemo]);

  useEffect(() => {
    if (!isTransactionsError || !transactionsError) return;
    console.error('Transactions fetch error:', transactionsError);
  }, [isTransactionsError, transactionsError]);

  const isRefreshing = isPropertiesFetching || isTransactionsFetching;

  const refreshData = useCallback(async () => {
    if (!user && !isDemo) return;
    setDbError(null);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['properties'] }),
        queryClient.invalidateQueries({ queryKey: ['transactions'] }),
      ]);
    } catch (err: any) {
      console.error('Data refresh failed:', err);
    }
  }, [user, isDemo, queryClient]);

  useEffect(() => {
    getMe().then((me) => {
      if (me) {
        setUser({ ...me, source: 'node' });
        setView(ViewState.HOME);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (user || isDemo) refreshData();
  }, [user, isDemo, refreshData]);

  const handleLogout = async () => {
    if (isDemo) {
      setIsDemo(false);
      setUser(null);
      setView(ViewState.LOGIN);
    } else {
      clearToken();
      setUser(null);
      setView(ViewState.LOGIN);
    }
  };

  const renderView = () => {
    if (dbError === 'MISSING_TABLES') return <DatabaseSetupError onRetry={refreshData} />;
    
    if (!user && !isDemo) {
      return (
        <Login
          onDemoLogin={() => { setIsDemo(true); setUser({ id: 'demo' }); setView(ViewState.HOME); }}
          onNodeLogin={(nodeUser, token) => {
            setToken(token);
            setUser({ ...nodeUser, source: 'node' });
            setView(ViewState.HOME);
          }}
        />
      );
    }

    switch (view) {
      case ViewState.LOGIN:
        return (
          <Login
            onDemoLogin={() => { setIsDemo(true); setUser({ id: 'demo' }); setView(ViewState.HOME); }}
            onNodeLogin={(nodeUser, token) => {
              setToken(token);
              setUser({ ...nodeUser, source: 'node' });
              setView(ViewState.HOME);
            }}
          />
        );
      case ViewState.HOME:
        return <Dashboard 
          properties={properties} 
          transactions={transactions} 
          globalCurrency={globalCurrency} 
          setGlobalCurrency={setGlobalCurrency}
          lang={lang}
          setLang={setLang}
          setView={setView}
        />;
      case ViewState.PORTFOLIO:
        return <Portfolio 
          properties={properties} 
          transactions={transactions} 
          globalCurrency={globalCurrency}
          lang={lang}
          onRefresh={refreshData}
          onSelectProperty={(p) => { setSelectedProperty(p); setView(ViewState.PROPERTY_DETAIL); }}
          onAddProperty={() => { setEditingProperty(null); setView(ViewState.PROPERTY_EDIT); }}
        />;
      case ViewState.PROPERTY_DETAIL:
        return selectedProperty ? <PropertyDetail 
          property={selectedProperty} 
          onBack={() => setView(ViewState.PORTFOLIO)} 
          lang={lang} 
          service={activeService}
          onEdit={() => { setEditingProperty(selectedProperty); setView(ViewState.PROPERTY_EDIT); }}
          onUpdate={(p) => {
            queryClient.setQueryData<Property[] | undefined>(
              ['properties', { isDemo, userId: user?.id }],
              (prev = []) =>
                prev.map((item) => (item.id === p.id ? (p as Property) : item)),
            );
            setSelectedProperty(p);
          }}
        /> : null;
      case ViewState.PROPERTY_EDIT:
        return <PropertyEditor 
          property={editingProperty} 
          onSave={() => { refreshData(); setView(ViewState.PORTFOLIO); }} 
          onCancel={() => setView(ViewState.PORTFOLIO)} 
          lang={lang}
          service={activeService}
        />;
      case ViewState.QUICK_ADD:
        return <QuickAdd
          properties={properties}
          service={activeService}
          onComplete={() => { refreshData(); setView(ViewState.HOME); }}
          onCancel={() => setView(ViewState.HOME)}
        />;
      case ViewState.CHAT:
        return <ChatAssistant lang={lang} properties={properties} transactions={transactions} />;
      case ViewState.TAX_REPORT:
        return <TaxReport properties={properties} transactions={transactions} globalCurrency={globalCurrency} lang={lang} />;
      case ViewState.SETTINGS:
        return (
          <Settings
            onBack={() => setView(ViewState.HOME)}
            onLogout={handleLogout}
            onSave={refreshData}
            lang={lang}
            service={activeService}
            showServerLinks={user?.source === 'node'}
            assetsCount={properties.length}
          />
        );
      case ViewState.DEALS:
        return (
          <DealsAnalysis
            lang={lang}
            globalCurrency={globalCurrency}
            onBack={() => setView(ViewState.HOME)}
            service={activeService}
          />
        );
      default:
        return (
          <Login
            onDemoLogin={() => { setIsDemo(true); setUser({ id: 'demo' }); setView(ViewState.HOME); }}
            onNodeLogin={(nodeUser, token) => {
              setToken(token);
              setUser({ ...nodeUser, source: 'node' });
              setView(ViewState.HOME);
            }}
          />
        );
    }
  };

  return (
    <div dir={getDir(lang)} className="h-[100dvh] w-full max-w-md mx-auto bg-gray-50 shadow-2xl overflow-hidden relative flex flex-col font-sans">
      <main className="flex-1 overflow-y-auto no-scrollbar scroll-smooth pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center bg-brand-600 text-white">
            <Loader2 className="animate-spin mb-4" size={32} />
            <p className="text-xs font-black uppercase tracking-widest animate-pulse">Investor Pro</p>
          </div>
        ) : renderView()}
      </main>
      {(user || isDemo) && view !== ViewState.QUICK_ADD && view !== ViewState.PROPERTY_EDIT && view !== ViewState.LOGIN && (
        <BottomNav view={view} setView={setView} lang={lang} />
      )}
    </div>
  );
};

const DatabaseSetupError = ({ onRetry }: { onRetry: () => void }) => (
  <div className="h-full flex flex-col items-center justify-center p-6 text-center">
    <Database size={48} className="text-brand-600 mb-4" />
    <h2 className="text-xl font-bold mb-2">Setup Required</h2>
    <p className="text-xs text-gray-500 mb-4">The database schema may be missing. Run <code className="bg-gray-200 px-1 rounded">npx prisma migrate deploy</code> on the server, then retry.</p>
    <button onClick={onRetry} className="bg-brand-600 text-white px-8 py-3 rounded-full font-bold shadow-lg flex items-center gap-2">
      <RefreshCcw size={18} /> Retry Connection
    </button>
  </div>
);

export default App;
