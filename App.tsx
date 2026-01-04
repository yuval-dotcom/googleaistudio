
import React, { useState, useEffect } from 'react';
import { Dashboard } from './views/Dashboard';
import { Portfolio } from './views/Portfolio';
import { QuickAdd } from './views/QuickAdd';
import { TaxReport } from './views/TaxReport';
import { TestRunner } from './views/TestRunner';
import { ChatAssistant } from './views/ChatAssistant';
import { PropertyDetail } from './views/PropertyDetail';
import { PropertyEditor } from './views/PropertyEditor'; 
import { Settings } from './views/Settings';
import { Login } from './views/Login'; 
import { BottomNav } from './components/BottomNav';
import { ViewState, Property, Transaction, CurrencyCode, Language } from './types';

// Services
import { supabaseDataService } from './services/supabaseService';
import { supabase, SETUP_SQL } from './services/supabaseConfig';
import { dataService as mockDataService } from './services/mockDataService';
import { getDir } from './services/translationService';
import { AlertCircle, RefreshCcw, Database, Copy, Check } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<any | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.LOGIN);
  const [properties, setProperties] = useState<Property[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); 
  const [globalCurrency, setGlobalCurrency] = useState<CurrencyCode>('NIS');
  const [lang, setLang] = useState<Language>('en'); 
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [ratesVersion, setRatesVersion] = useState(0); 
  const [copied, setCopied] = useState(false);

  // Select the active data service based on mode
  const dataService = isDemo ? mockDataService : supabaseDataService;

  // Auth Listener
  useEffect(() => {
    if (isDemo) return;

    // Check active session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) setCurrentView(ViewState.HOME);
      else setCurrentView(ViewState.LOGIN);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setCurrentView(ViewState.HOME);
      } else {
        setCurrentView(ViewState.LOGIN);
        // Clear data on logout for security
        setProperties([]);
        setTransactions([]);
      }
    });

    return () => subscription.unsubscribe();
  }, [isDemo]);

  // Demo Login Handler
  const handleDemoLogin = () => {
    setIsDemo(true);
    // Fake user object for demo purposes
    setUser({ id: 'user1', email: 'demo@example.com' });
    setCurrentView(ViewState.HOME);
    setLoading(false);
  };

  // Logout Handler
  const handleLogout = async () => {
    if (isDemo) {
      setIsDemo(false);
      setUser(null);
      setProperties([]);
      setTransactions([]);
      setCurrentView(ViewState.LOGIN);
    } else {
      await supabase.auth.signOut();
      // The onAuthStateChange listener in useEffect handles the UI update
    }
  };

  // Data Fetcher
  const fetchData = async () => {
    if (!user) return; 

    setLoading(true);
    setError(null);
    try {
      const props = await dataService.getProperties();
      const txs = await dataService.getTransactions();
      setProperties(props);
      setTransactions(txs);
    } catch (err: any) {
      console.error("Failed to fetch data:", err);
      // If fails in non-demo mode
      if (!isDemo) {
         if (err.message && (err.message.includes('relation "properties" does not exist') || err.code === '42P01')) {
           setError("MISSING_TABLES");
         } else {
           setError("Unable to load cloud data. Check your Supabase connection.");
         }
      } else {
         setError("Failed to load demo data.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch when User changes (Login)
  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, isDemo]);

  const handleQuickAddComplete = () => {
    fetchData();
    setCurrentView(ViewState.HOME);
  };

  const handleSelectProperty = (p: Property) => {
    setSelectedProperty(p);
    setCurrentView(ViewState.PROPERTY_DETAIL);
  };

  const handleSaveProperty = () => {
    fetchData(); 
    if (selectedProperty) {
      setCurrentView(ViewState.PORTFOLIO);
      setSelectedProperty(null); 
    } else {
      setCurrentView(ViewState.PORTFOLIO);
    }
  };
  
  // New handler to keep app state in sync when PropertyDetail modifies data (e.g. docs)
  const handlePropertyUpdate = (updated: Property) => {
    setSelectedProperty(updated);
    setProperties(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const handleSaveSettings = () => {
    setRatesVersion(v => v + 1); 
    setCurrentView(ViewState.HOME);
  };

  // Seeding
  const handleSeedData = async () => {
     if (isDemo) return;
     setLoading(true);
     // Load mocks from mockDataService manually to pass to seed
     const mockProps = await mockDataService.getProperties();
     const mockTxs = await mockDataService.getTransactions();
     await (dataService as any).seedDatabase(mockProps, mockTxs);
     fetchData();
  };

  const copySql = () => {
    navigator.clipboard.writeText(SETUP_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderView = () => {
    switch (currentView) {
      case ViewState.LOGIN:
        return <Login onDemoLogin={handleDemoLogin} />;
      case ViewState.HOME:
        return (
          <Dashboard 
            key={ratesVersion} 
            properties={properties} 
            transactions={transactions} 
            globalCurrency={globalCurrency}
            setGlobalCurrency={setGlobalCurrency}
            setView={setCurrentView}
            lang={lang}
            setLang={setLang}
            onSeedData={properties.length === 0 && !isDemo ? handleSeedData : undefined}
          />
        );
      case ViewState.PORTFOLIO:
        return (
          <Portfolio 
            key={ratesVersion} 
            properties={properties} 
            transactions={transactions} 
            onRefresh={fetchData} 
            globalCurrency={globalCurrency}
            onSelectProperty={handleSelectProperty}
            lang={lang}
            onAddProperty={() => { setSelectedProperty(null); setCurrentView(ViewState.PROPERTY_EDIT); }}
          />
        );
      case ViewState.PROPERTY_DETAIL:
        return selectedProperty ? (
          <PropertyDetail 
             property={selectedProperty} 
             onBack={() => setCurrentView(ViewState.PORTFOLIO)}
             lang={lang}
             onEdit={() => setCurrentView(ViewState.PROPERTY_EDIT)}
             onUpdate={handlePropertyUpdate}
             service={dataService} // Pass active service (Mock or Supabase)
          />
        ) : <Portfolio properties={properties} transactions={transactions} onRefresh={fetchData} globalCurrency={globalCurrency} onSelectProperty={handleSelectProperty} lang={lang} />;
      case ViewState.PROPERTY_EDIT:
        return (
          <PropertyEditor 
            property={selectedProperty} 
            onSave={handleSaveProperty}
            onCancel={() => selectedProperty ? setCurrentView(ViewState.PROPERTY_DETAIL) : setCurrentView(ViewState.PORTFOLIO)}
          />
        );
      case ViewState.CHAT:
        return <ChatAssistant lang={lang} properties={properties} transactions={transactions} />;
      case ViewState.TAX_REPORT:
        return (
          <TaxReport 
            key={ratesVersion}
            properties={properties} 
            transactions={transactions} 
            globalCurrency={globalCurrency}
            lang={lang}
          />
        );
      case ViewState.TEST_RUNNER:
        return (
          <TestRunner onBack={() => setCurrentView(ViewState.HOME)} />
        );
      case ViewState.SETTINGS:
        return (
          <Settings 
            onBack={() => setCurrentView(ViewState.HOME)} 
            onSave={handleSaveSettings} 
            onLogout={handleLogout}
          />
        );
      default:
        return <Dashboard properties={properties} transactions={transactions} globalCurrency={globalCurrency} setGlobalCurrency={setGlobalCurrency} lang={lang} setLang={setLang} />;
    }
  };

  // Error State UI
  if (error && currentView !== ViewState.LOGIN) {
    if (error === 'MISSING_TABLES') {
       return (
        <div className="h-[100dvh] flex flex-col items-center justify-center bg-gray-50 p-6">
          <div className="bg-brand-50 p-4 rounded-full mb-4">
            <Database size={48} className="text-brand-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Supabase Setup Required</h2>
          <p className="text-gray-500 mb-4 text-sm text-center">
             Your database is connected but missing tables. Run this SQL script in your Supabase Dashboard.
          </p>
          
          <div className="w-full max-w-lg bg-gray-900 rounded-lg overflow-hidden border border-gray-800 mb-6 shadow-xl">
             <div className="flex justify-between items-center px-4 py-2 bg-gray-800 border-b border-gray-700">
               <span className="text-xs text-gray-400 font-mono">setup.sql</span>
               <button onClick={copySql} className="text-xs font-bold text-brand-400 hover:text-white flex items-center gap-1">
                 {copied ? <Check size={12}/> : <Copy size={12}/>}
                 {copied ? 'Copied' : 'Copy SQL'}
               </button>
             </div>
             <pre className="p-4 text-[10px] text-green-400 font-mono overflow-auto h-48 scrollbar-thin scrollbar-thumb-gray-700">
               {SETUP_SQL}
             </pre>
          </div>

          <div className="flex gap-3">
            <a 
              href="https://supabase.com/dashboard/project/_/sql" 
              target="_blank" 
              rel="noreferrer"
              className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-full font-bold text-sm shadow-sm hover:bg-gray-50 transition-colors"
            >
              Open SQL Editor
            </a>
            <button 
              onClick={fetchData}
              className="bg-brand-600 text-white px-6 py-3 rounded-full font-bold text-sm shadow-lg shadow-brand-500/30 flex items-center gap-2 active:scale-95 transition-transform"
            >
              <RefreshCcw size={16} />
              <span>I Ran It, Retry</span>
            </button>
          </div>
        </div>
       );
    }
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <div className="bg-red-50 p-4 rounded-full mb-4">
          <AlertCircle size={48} className="text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Connection Error</h2>
        <p className="text-gray-500 mb-6">{error}</p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button 
            onClick={fetchData}
            className="bg-brand-600 text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-brand-500/30 flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <RefreshCcw size={18} />
            <span>Retry</span>
          </button>
          {!isDemo && (
             <button 
               onClick={handleDemoLogin}
               className="text-brand-600 font-bold text-sm py-2"
             >
               Switch to Demo Mode
             </button>
          )}
        </div>
      </div>
    );
  }

  // Loading spinner (but not during Login view interaction)
  if (loading && currentView !== ViewState.LOGIN) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div 
      dir={getDir(lang)} 
      className="h-[100dvh] w-full max-w-md mx-auto bg-gray-50 shadow-2xl overflow-hidden relative font-sans text-gray-900 flex flex-col"
    >
      <main className="flex-1 overflow-y-auto scroll-smooth no-scrollbar">
        {renderView()}
      </main>

      {currentView === ViewState.QUICK_ADD && (
        <QuickAdd 
          properties={properties} 
          onComplete={handleQuickAddComplete}
          onCancel={() => setCurrentView(ViewState.HOME)} 
        />
      )}

      {currentView !== ViewState.QUICK_ADD && 
       currentView !== ViewState.TEST_RUNNER && 
       currentView !== ViewState.PROPERTY_DETAIL && 
       currentView !== ViewState.PROPERTY_EDIT && 
       currentView !== ViewState.SETTINGS && 
       currentView !== ViewState.LOGIN && ( // Hide nav on Login
        <BottomNav currentView={currentView} setView={setCurrentView} lang={lang} />
      )}
      
      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default App;
