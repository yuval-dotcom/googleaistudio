
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, LogOut, RefreshCw, Loader2, User, Building2, Plus, Trash2 } from 'lucide-react';
import { currencyService } from '../services/currencyService';
import { CurrencyCode, Language, Company } from '../types';
import { t } from '../services/translationService';

interface SettingsProps {
  onBack: () => void;
  onSave: () => void;
  onLogout: () => void;
  lang: Language;
  service: any;
}

export const Settings: React.FC<SettingsProps> = ({ onBack, onSave, onLogout, lang, service }) => {
  const [rates, setRates] = useState<Record<CurrencyCode, number>>({ NIS: 1, USD: 0, EUR: 0 });
  const [apiKey, setApiKey] = useState('570ec01f22a0486e89a0673bb26f3ecc');
  const [isSyncing, setIsSyncing] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyOwnership, setNewCompanyOwnership] = useState('100');
  const [isSavingCompany, setIsSavingCompany] = useState(false);

  useEffect(() => {
    setRates(currencyService.getRates());
    const storedKey = localStorage.getItem('currency_api_key');
    if (storedKey) setApiKey(storedKey);
    
    service.getCompanies().then(setCompanies);
  }, [service]);

  const handleChange = (code: CurrencyCode, value: string) => {
    const num = parseFloat(value);
    setRates(prev => ({ ...prev, [code]: isNaN(num) ? 0 : num }));
  };

  const handleAddCompany = async () => {
    if (!newCompanyName.trim()) return;
    setIsSavingCompany(true);
    try {
      const company = await service.saveCompany({
        name: newCompanyName.trim(),
        userOwnership: parseFloat(newCompanyOwnership) || 0
      });
      setCompanies([...companies, company]);
      setNewCompanyName('');
      setNewCompanyOwnership('100');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingCompany(false);
    }
  };

  const handleDeleteCompany = async (id: string) => {
    try {
      await service.deleteCompany(id);
      setCompanies(companies.filter(c => c.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = () => {
    currencyService.setRate('USD', rates['USD']);
    currencyService.setRate('EUR', rates['EUR']);
    localStorage.setItem('currency_api_key', apiKey);
    onSave(); 
    onBack(); 
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await currencyService.fetchLiveRates(apiKey);
      setRates(currencyService.getRates());
      localStorage.setItem('currency_api_key', apiKey);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 pb-32 animate-fade-in">
      <div className="bg-white p-4 border-b border-gray-200 sticky top-0 z-10 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-bold text-lg">{t('settings', lang)}</h1>
        </div>
        <button onClick={() => setConfirmLogout(true)} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors">
          <LogOut size={20} />
        </button>
      </div>

      <div className="p-4 space-y-6 overflow-y-auto no-scrollbar">
        
        {/* Company Management */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-brand-50">
           <div className="flex items-center gap-2 mb-4 text-brand-600">
             <Building2 size={18} />
             <h3 className="font-black text-[10px] uppercase tracking-widest">Company Management</h3>
           </div>
           
           <div className="space-y-3 mb-6">
             {companies.length === 0 && (
               <p className="text-[10px] text-gray-400 font-bold text-center py-4 bg-gray-50 rounded-xl">No companies added</p>
             )}
             {companies.map(c => (
               <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                 <div>
                   <p className="text-xs font-bold text-gray-900">{c.name}</p>
                   <p className="text-[9px] text-brand-600 font-black uppercase">My Ownership: {c.userOwnership}%</p>
                 </div>
                 <button onClick={() => handleDeleteCompany(c.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={14} />
                 </button>
               </div>
             ))}
           </div>

           <div className="bg-brand-50/50 p-4 rounded-xl border border-brand-100 space-y-3">
             <input 
               type="text" 
               placeholder="Company Name" 
               value={newCompanyName} 
               onChange={e => setNewCompanyName(e.target.value)}
               className="w-full p-2.5 bg-white border border-brand-200 rounded-lg text-xs font-bold"
             />
             <div className="flex gap-2">
               <div className="flex-1 relative">
                  <input 
                    type="number" 
                    placeholder="Your % Share" 
                    value={newCompanyOwnership} 
                    onChange={e => setNewCompanyOwnership(e.target.value)}
                    className="w-full p-2.5 bg-white border border-brand-200 rounded-lg text-xs font-bold"
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] font-black text-brand-300">%</span>
               </div>
               <button 
                onClick={handleAddCompany} 
                disabled={isSavingCompany}
                className="bg-brand-600 text-white px-4 rounded-lg shadow-sm active:scale-95 transition-transform disabled:opacity-50"
               >
                 {isSavingCompany ? <Loader2 size={16} className="animate-spin" /> : <Plus size={18} />}
               </button>
             </div>
           </div>
        </section>

        {/* Account Section */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-red-50">
          <div className="flex items-center gap-2 mb-4 text-red-600">
            <User size={18} />
            <h3 className="font-black text-[10px] uppercase tracking-widest">{t('account', lang)}</h3>
          </div>
          <button onClick={onLogout} className="w-full py-4 border-2 border-red-100 text-red-600 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-red-50 transition-all">
            <LogOut size={20} />
            <span className="text-sm uppercase tracking-wider">{t('logout', lang)}</span>
          </button>
        </section>

        {/* Exchange Rates */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-black text-[10px] text-gray-400 uppercase tracking-widest mb-4 border-b pb-2">{t('exchange_rates', lang)}</h3>
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">1 USD = NIS</label>
              <input type="number" step="0.01" value={rates['USD']} onChange={e => handleChange('USD', e.target.value)} className="w-full p-2.5 bg-gray-50 rounded-xl border border-gray-200 font-bold text-sm" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">1 EUR = NIS</label>
              <input type="number" step="0.01" value={rates['EUR']} onChange={e => handleChange('EUR', e.target.value)} className="w-full p-2.5 bg-gray-50 rounded-xl border border-gray-200 font-bold text-sm" />
            </div>
          </div>
          <div className="bg-brand-50/50 p-4 rounded-xl border border-brand-100 flex gap-2">
             <input type="text" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="Currency API Key" className="flex-1 p-2 bg-white border border-brand-200 rounded-lg text-[10px] font-mono" />
             <button onClick={handleSync} disabled={isSyncing} className="px-3 py-2 bg-brand-600 text-white rounded-lg shadow-sm">
               {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
             </button>
          </div>
        </section>

        <div className="pt-2 flex flex-col gap-3">
          <button onClick={handleSave} className="w-full py-4 bg-brand-600 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2">
            <Save size={18} />
            <span>Save All Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
