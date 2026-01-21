
import React, { useMemo, useState } from 'react';
import { Card } from '../components/Card';
import { Property, Transaction, CurrencyCode, ViewState, Language } from '../types';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell } from 'recharts';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Activity, Globe, Settings, Sparkles, Loader2, RefreshCw, Calendar } from 'lucide-react';
import { currencyService } from '../services/currencyService';
import { t } from '../services/translationService';
import { GoogleGenAI } from "@google/genai";
import { notificationService } from '../services/notificationService';

interface DashboardProps {
  properties: Property[];
  transactions: Transaction[];
  globalCurrency: CurrencyCode;
  setGlobalCurrency: (c: CurrencyCode) => void;
  lang: Language;
  setLang: (l: Language) => void;
  setView: (v: ViewState) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ properties, transactions, globalCurrency, setGlobalCurrency, lang, setLang, setView }) => {
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const expiringLeases = useMemo(() => notificationService.getExpiringLeases(properties), [properties]);

  const totalMyEquity = useMemo(() => properties.reduce((sum, p) => {
    const marketValueGlobal = currencyService.convert(p.marketValue, p.currency, globalCurrency);
    const loanBalanceGlobal = currencyService.convert(p.loanBalance || 0, p.currency, globalCurrency);
    const propEquity = marketValueGlobal - loanBalanceGlobal;
    const myPartnerRecord = p.partners?.find(partner => partner.hasAccess);
    const myPercentage = myPartnerRecord ? myPartnerRecord.percentage : 100; 
    return sum + (propEquity * (myPercentage / 100));
  }, 0), [properties, globalCurrency]);
  
  const monthlyCashFlow = useMemo(() => {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    const recent = transactions.filter(t => new Date(t.date) >= last30Days);
    return recent.reduce((acc, t) => {
      const prop = properties.find(p => p.id === t.propertyId);
      const txCurrency = prop ? prop.currency : 'USD'; 
      const convertedAmount = currencyService.convert(t.amount, txCurrency, globalCurrency);
      return t.type === 'income' ? acc + convertedAmount : acc - convertedAmount;
    }, 0);
  }, [transactions, properties, globalCurrency]);

  const countryData = useMemo(() => {
    const map: Record<string, number> = {};
    properties.forEach(p => {
      const val = currencyService.convert(p.marketValue, p.currency, globalCurrency);
      map[p.country] = (map[p.country] || 0) + val;
    });
    return Object.keys(map).map(name => ({ name, value: map[name] }));
  }, [properties, globalCurrency]);

  const performanceData = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        name: d.toLocaleString(lang === 'he' ? 'he-IL' : 'en-US', { month: 'short' }),
        month: d.getMonth(),
        year: d.getFullYear(),
        income: 0,
        expense: 0
      });
    }

    transactions.forEach(t => {
      const txDate = new Date(t.date);
      const mIdx = months.findIndex(m => m.month === txDate.getMonth() && m.year === txDate.getFullYear());
      if (mIdx !== -1) {
        const prop = properties.find(p => p.id === t.propertyId);
        const txCurrency = prop ? prop.currency : 'USD';
        const convertedAmount = currencyService.convert(t.amount, txCurrency, globalCurrency);
        if (t.type === 'income') {
          months[mIdx].income += convertedAmount;
        } else {
          months[mIdx].expense += convertedAmount;
        }
      }
    });

    return months;
  }, [transactions, properties, globalCurrency, lang]);

  const handleGenerateInsight = async () => {
    if (properties.length === 0 || isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Quick tactical summary (max 2 sentences) of this RE portfolio: ${properties.length} properties, ${totalMyEquity} equity, ${monthlyCashFlow} monthly cashflow. Focus on health and next steps. Language: ${lang === 'he' ? 'Hebrew' : 'English'}.`;
      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      setAiInsight(result.text || null);
    } catch (e) { 
      console.error(e); 
      setAiInsight(lang === 'he' ? 'שגיאה בניתוח הנתונים.' : 'Error analyzing data.');
    } finally { 
      setIsAnalyzing(false); 
    }
  };

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-5 pb-32 animate-fade-in p-4">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('dashboard', lang)}</h1>
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Investor Pro v2</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setLang(lang === 'en' ? 'he' : 'en')} className="w-9 h-9 rounded-xl glass border border-white flex items-center justify-center shadow-sm text-sm">
             {lang === 'en' ? '🇮🇱' : '🇺🇸'}
          </button>
          <button onClick={() => setView(ViewState.SETTINGS)} className="w-9 h-9 rounded-xl glass border border-white flex items-center justify-center text-gray-400 shadow-sm">
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* Lease Expiry Alerts (Read-only) */}
      {expiringLeases.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1 px-1">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <h3 className="text-[10px] font-black text-red-600 uppercase tracking-widest">Upcoming Lease Expiries</h3>
          </div>
          <div className="space-y-2">
            {expiringLeases.map((lease, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-4 shadow-sm border border-red-100 flex items-center justify-between group animate-slide-up">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 truncate max-w-[200px]">{lease.address}</h4>
                    <p className="text-[10px] text-red-500 font-bold">
                      {lease.unitName ? `${lease.unitName} • ` : ''}Ends in {lease.daysRemaining} days
                    </p>
                  </div>
                </div>
                <div className="text-right">
                   <p className="text-[9px] text-gray-400 uppercase font-black">Expiry</p>
                   <p className="text-[10px] font-bold text-gray-600">{new Date(lease.expiryDate).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Insight Section */}
      <div className="relative">
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 overflow-hidden transition-all duration-300">
          {!aiInsight && !isAnalyzing ? (
            <button onClick={handleGenerateInsight} className="w-full flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600 group-hover:scale-110 transition-transform">
                  <Sparkles size={16} />
                </div>
                <span className="text-xs font-bold text-gray-600 tracking-tight">{t('analyze_with_ai', lang)}</span>
              </div>
              <ArrowUpRight size={16} className="text-gray-300 group-hover:text-brand-500 transition-colors" />
            </button>
          ) : isAnalyzing ? (
            <div className="flex items-center gap-3 py-1">
              <Loader2 size={16} className="animate-spin text-brand-500" />
              <span className="text-xs text-brand-600 font-bold animate-pulse">{t('analyzing', lang)}</span>
            </div>
          ) : (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={12} className="text-brand-500" />
                  <span className="text-[10px] font-black text-brand-600 uppercase tracking-widest">{t('ai_analyst', lang)}</span>
                </div>
                <button onClick={handleGenerateInsight} className="p-1 hover:bg-gray-100 rounded-md transition-colors text-gray-400">
                  <RefreshCw size={12} />
                </button>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed font-medium">{aiInsight}</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Equity Card */}
      <Card className="bg-gradient-to-br from-brand-600 to-brand-800 text-white border-none shadow-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-10 -translate-y-10" />
        <div className="flex items-center gap-2 opacity-80 mb-1">
          <TrendingUp size={16} />
          <span className="text-xs font-bold tracking-tight">{t('total_equity', lang)}</span>
        </div>
        <h2 className="text-4xl font-bold tracking-tighter mb-6">{currencyService.format(totalMyEquity, globalCurrency)}</h2>
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
          <div>
            <p className="text-[9px] text-brand-100 uppercase font-black opacity-70 tracking-wider mb-1">{t('monthly_cash_flow', lang)}</p>
            <div className="flex items-center gap-1">
              <span className="font-bold text-lg">{currencyService.format(Math.abs(monthlyCashFlow), globalCurrency)}</span>
              {monthlyCashFlow >= 0 ? <ArrowUpRight size={14} className="text-green-300" /> : <ArrowDownRight size={14} className="text-red-300" />}
            </div>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-brand-100 uppercase font-black opacity-70 tracking-wider mb-1">{t('properties', lang)}</p>
            <span className="font-bold text-xl">{properties.length}</span>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Regions Card with Details */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col">
           <div className="flex items-center gap-2 mb-3 w-full">
             <Globe size={14} className="text-blue-500" />
             <h3 className="font-black text-[9px] text-gray-400 uppercase tracking-widest">{t('regions', lang)}</h3>
           </div>
           <div className="h-24 w-full mb-3">
             <ResponsiveContainer width="100%" height="100%">
               <RePieChart>
                 <Pie 
                   data={countryData} 
                   innerRadius={20} 
                   outerRadius={38} 
                   paddingAngle={5} 
                   dataKey="value"
                 >
                   {countryData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                 </Pie>
                 <Tooltip 
                    formatter={(val: number) => currencyService.format(val, globalCurrency)}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                 />
               </RePieChart>
             </ResponsiveContainer>
           </div>
           <div className="space-y-1 max-h-[60px] overflow-y-auto no-scrollbar">
             {countryData.map((item, i) => (
               <div key={item.name} className="flex items-center justify-between gap-1">
                 <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-[8px] font-bold text-gray-600 truncate">{item.name}</span>
                 </div>
                 <span className="text-[8px] font-black text-gray-400 shrink-0">{currencyService.format(item.value, globalCurrency)}</span>
               </div>
             ))}
           </div>
        </div>

        {/* Performance Chart */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col min-h-[140px]">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={14} className="text-brand-500" />
            <h3 className="font-black text-[9px] text-gray-400 uppercase tracking-widest">{t('performance', lang)}</h3>
          </div>
          <div className="flex-1 w-full mt-1">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={performanceData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 'bold', fill: '#9ca3af' }} />
                 <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
                    formatter={(val: number) => currencyService.format(val, globalCurrency)}
                 />
                 <Bar dataKey="income" fill="#10b981" radius={[2, 2, 0, 0]} barSize={6} />
                 <Bar dataKey="expense" fill="#ef4444" radius={[2, 2, 0, 0]} barSize={6} />
               </BarChart>
             </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-3 mt-1 pb-1">
             <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                <span className="text-[8px] font-black uppercase text-gray-400">Inc</span>
             </div>
             <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span className="text-[8px] font-black uppercase text-gray-400">Exp</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
