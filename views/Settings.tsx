
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, RotateCcw, LogOut, RefreshCw, Check, AlertTriangle, Loader2, ExternalLink, ShieldCheck, Database, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { currencyService } from '../services/currencyService';
import { CurrencyCode } from '../types';
import { SETUP_SQL } from '../services/supabaseConfig';

interface SettingsProps {
  onBack: () => void;
  onSave: () => void;
  onLogout: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onBack, onSave, onLogout }) => {
  const [rates, setRates] = useState<Record<CurrencyCode, number>>({ NIS: 1, USD: 0, EUR: 0 });
  
  // API State - Default to the provided key
  const [apiKey, setApiKey] = useState('570ec01f22a0486e89a0673bb26f3ecc');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [syncMsg, setSyncMsg] = useState('');
  
  // SQL Viewer
  const [showSql, setShowSql] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setRates(currencyService.getRates());
    const storedKey = localStorage.getItem('currency_api_key');
    if (storedKey) setApiKey(storedKey);
  }, []);

  const handleChange = (code: CurrencyCode, value: string) => {
    const num = parseFloat(value);
    setRates(prev => ({ ...prev, [code]: isNaN(num) ? 0 : num }));
  };

  const handleSave = () => {
    currencyService.setRate('USD', rates['USD']);
    currencyService.setRate('EUR', rates['EUR']);
    localStorage.setItem('currency_api_key', apiKey);
    onSave(); // Triggers app refresh
  };

  const handleReset = () => {
    currencyService.resetRates();
    setRates(currencyService.getRates());
    setSyncStatus('idle');
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncStatus('idle');
    setSyncMsg('');

    try {
      await currencyService.fetchLiveRates(apiKey);
      setRates(currencyService.getRates()); // Update UI
      setSyncStatus('success');
      setSyncMsg('Rates updated successfully.');
      
      // Auto-save key if it worked (or fallback worked)
      localStorage.setItem('currency_api_key', apiKey);
      
    } catch (err: any) {
      setSyncStatus('error');
      setSyncMsg(err.message || 'Failed to fetch rates.');
    } finally {
      setIsSyncing(false);
    }
  };

  const copySql = () => {
    navigator.clipboard.writeText(SETUP_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 animate-fade-in">
      {/* Header */}
      <div className="bg-white p-4 border-b border-gray-200 sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-bold text-lg">Settings</h1>
        </div>
      </div>

      <div className="p-4 space-y-6 overflow-y-auto">
        
        {/* Exchange Rates Section */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Exchange Rates (Base: NIS)</h3>
          
          {/* Manual Input */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">1 USD ($) = ? NIS</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500">₪</span>
                <input 
                  type="number" 
                  step="0.01"
                  value={rates['USD']}
                  onChange={e => handleChange('USD', e.target.value)}
                  className="w-full p-3 pl-8 bg-gray-50 rounded-lg border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">1 EUR (€) = ? NIS</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500">₪</span>
                <input 
                  type="number" 
                  step="0.01"
                  value={rates['EUR']}
                  onChange={e => handleChange('EUR', e.target.value)}
                  className="w-full p-3 pl-8 bg-gray-50 rounded-lg border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* API Sync */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
             <div className="flex justify-between items-center mb-2">
               <label className="text-xs font-bold text-gray-500 uppercase">Live Sync</label>
               <div className="flex items-center gap-1">
                 <ShieldCheck size={10} className="text-green-600" />
                 <span className="text-[10px] text-green-600 font-bold">Auto-Fallback Enabled</span>
               </div>
             </div>
             
             <div className="flex gap-2">
               <input 
                 type="text" 
                 value={apiKey}
                 onChange={e => setApiKey(e.target.value)}
                 placeholder="API Key (Optional)"
                 className="flex-1 p-2 bg-white border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-brand-500 outline-none"
               />
               <button 
                 onClick={handleSync}
                 disabled={isSyncing}
                 className="px-3 py-2 bg-brand-600 text-white rounded-lg shadow-sm active:scale-95 disabled:opacity-50"
               >
                 {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
               </button>
             </div>
             
             {syncStatus === 'success' && (
               <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                 <Check size={12} /> {syncMsg}
               </p>
             )}
             
             {syncStatus === 'error' && (
               <div className="text-xs text-red-500 mt-2 flex items-start gap-1 p-2 bg-red-50 rounded border border-red-100">
                 <AlertTriangle size={12} className="shrink-0 mt-0.5" /> 
                 <span className="break-all">{syncMsg}</span>
               </div>
             )}

             <p className="text-[10px] text-gray-400 mt-3 leading-tight">
               Uses CurrencyFreaks if key is valid. Automatically falls back to free open APIs if key fails.
             </p>
          </div>
        </section>

        {/* Database Config Section */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <button 
            onClick={() => setShowSql(!showSql)}
            className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2 text-gray-800">
              <Database size={18} className="text-brand-600" />
              <span className="font-bold text-sm">Database Setup</span>
            </div>
            {showSql ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          
          {showSql && (
            <div className="p-4 bg-gray-900 border-t border-gray-200">
               <p className="text-gray-400 text-xs mb-3">
                 Run this script in your Supabase SQL Editor to fix connection or permission issues.
               </p>
               <div className="relative bg-black rounded border border-gray-700 p-3 mb-3">
                 <pre className="text-[10px] text-green-400 font-mono overflow-x-auto whitespace-pre-wrap h-40 scrollbar-thin scrollbar-thumb-gray-600">
                   {SETUP_SQL}
                 </pre>
                 <button 
                   onClick={copySql}
                   className="absolute top-2 right-2 p-1.5 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
                   title="Copy SQL"
                 >
                   {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                 </button>
               </div>
               <a 
                 href="https://supabase.com/dashboard/project/_/sql" 
                 target="_blank" 
                 rel="noreferrer"
                 className="flex items-center justify-center gap-2 w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-xs font-bold transition-colors"
               >
                 <ExternalLink size={14} /> Open Supabase SQL Editor
               </a>
            </div>
          )}
        </section>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button 
            onClick={handleSave}
            className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold shadow-lg shadow-brand-500/30 flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <Save size={20} />
            <span>Save Settings</span>
          </button>

          <button 
            onClick={handleReset}
            className="w-full py-3 bg-white text-gray-600 border border-gray-200 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <RotateCcw size={18} />
            <span>Reset to Defaults</span>
          </button>

          <div className="h-px bg-gray-200 my-2"></div>

          <button 
            onClick={onLogout}
            className="w-full py-3 bg-red-50 text-red-600 border border-red-200 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <LogOut size={18} />
            <span>Log Out</span>
          </button>
        </div>

      </div>
    </div>
  );
};
