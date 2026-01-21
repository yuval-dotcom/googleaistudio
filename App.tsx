
import React, { useState, useEffect, useCallback } from 'react';
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
import { BottomNav } from './components/BottomNav';
import { supabaseDataService } from './services/supabaseService';
import { dataService as mockDataService } from './services/mockDataService';
import { supabase } from './services/supabaseConfig';
import { getDir } from './services/translationService';
import { Loader2, Database, RefreshCcw } from 'lucide-react';
import { SETUP_SQL } from './services/supabaseConfig';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.LOGIN);
  const [user, setUser] = useState<any | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [globalCurrency, setGlobalCurrency] = useState<CurrencyCode>('NIS');
  const [lang, setLang] = useState<Language>('en'); 
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);

  const activeService = isDemo ? mockDataService : supabaseDataService;

  const refreshData = useCallback(async () => {
    if (!user && !isDemo) return;
    setLoading(true);
    setDbError(null);
    try {
      const [props, txs, comps] = await Promise.all([
        activeService.getProperties(),
        activeService.getTransactions(),
        activeService.getCompanies()
      ]);
      setProperties(props);
      setTransactions(txs);
      setCompanies(comps);
    } catch (err: any) {
      console.error("Data refresh failed:", err);
      if (!isDemo && err.code === '42P01') setDbError('MISSING_TABLES');
    } finally {
      setLoading(false);
    }
  }, [user, isDemo, activeService]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        setView(ViewState.HOME);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        setIsDemo(false);
        if (view === ViewState.LOGIN) setView(ViewState.HOME);
      } else if (!isDemo) {
        setView(ViewState.LOGIN);
      }
    });
    return () => subscription.unsubscribe();
  }, [isDemo]);

  useEffect(() => {
    if (user || isDemo) refreshData();
  }, [user, isDemo, refreshData]);

  const handleLogout = async () => {
    if (isDemo) {
      setIsDemo(false);
      setUser(null);
      setView(ViewState.LOGIN);
    } else {
      await supabase.auth.signOut();
      setUser(null);
      setView(ViewState.LOGIN);
    }
  };

  const renderView = () => {
    if (dbError === 'MISSING_TABLES') return <DatabaseSetupError onRetry={refreshData} />;
    
    if (!user && !isDemo) {
      return <Login onDemoLogin={() => { setIsDemo(true); setUser({id:'demo'}); setView(ViewState.HOME); }} />;
    }

    switch (view) {
      case ViewState.LOGIN:
        return <Login onDemoLogin={() => { setIsDemo(true); setUser({id:'demo'}); setView(ViewState.HOME); }} />;
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
          onUpdate={(p) => { setProperties(prev => prev.map(item => item.id === p.id ? p : item)); setSelectedProperty(p); }}
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
          onComplete={() => { refreshData(); setView(ViewState.HOME); }} 
          onCancel={() => setView(ViewState.HOME)} 
        />;
      case ViewState.CHAT:
        return <ChatAssistant lang={lang} properties={properties} transactions={transactions} />;
      case ViewState.TAX_REPORT:
        return <TaxReport properties={properties} transactions={transactions} globalCurrency={globalCurrency} lang={lang} />;
      case ViewState.SETTINGS:
        return <Settings onBack={() => setView(ViewState.HOME)} onLogout={handleLogout} onSave={refreshData} lang={lang} service={activeService} />;
      default:
        return <Login onDemoLogin={() => { setIsDemo(true); setUser({id:'demo'}); setView(ViewState.HOME); }} />;
    }
  };

  return (
    <div dir={getDir(lang)} className="h-screen w-full max-w-md mx-auto bg-gray-50 shadow-2xl overflow-hidden relative flex flex-col font-sans">
      <main className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
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

const DatabaseSetupError = ({ onRetry }: { onRetry: () => void }) => {
  const [copied, setCopied] = useState(false);
  return (
    <div className="h-full flex flex-col items-center justify-center p-6 text-center">
      <Database size={48} className="text-brand-600 mb-4" />
      <h2 className="text-xl font-bold mb-2">Setup Required</h2>
      <p className="text-xs text-gray-500 mb-4">The companies table or other schemas are missing. Please run the following SQL in your Supabase SQL Editor.</p>
      <pre className="w-full bg-gray-900 text-green-400 p-4 rounded-lg text-[10px] text-left overflow-auto h-40 mb-4">{SETUP_SQL}</pre>
      <button onClick={() => { navigator.clipboard.writeText(SETUP_SQL); setCopied(true); }} className="text-brand-600 text-xs font-bold mb-6">{copied ? 'Copied!' : 'Copy SQL'}</button>
      <button onClick={onRetry} className="bg-brand-600 text-white px-8 py-3 rounded-full font-bold shadow-lg flex items-center gap-2">
        <RefreshCcw size={18} /> Retry Connection
      </button>
    </div>
  );
};

export default App;
