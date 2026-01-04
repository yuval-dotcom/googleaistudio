
import React, { useMemo, useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Property, Transaction, CurrencyCode, ViewState, Language } from '../types';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell } from 'recharts';
import { ArrowUpRight, ArrowDownRight, TrendingUp, RefreshCw, Activity, Globe, AlertTriangle, Settings, Database, Sparkles, Loader2 } from 'lucide-react';
import { currencyService } from '../services/currencyService';
import { t } from '../services/translationService';
import { GoogleGenAI } from "@google/genai";

interface DashboardProps {
  properties: Property[];
  transactions: Transaction[];
  globalCurrency: CurrencyCode;
  setGlobalCurrency: (c: CurrencyCode) => void;
  setView?: (view: ViewState) => void;
  lang: Language;
  setLang: (l: Language) => void;
  onSeedData?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ properties, transactions, globalCurrency, setGlobalCurrency, setView, lang, setLang, onSeedData }) => {
  const [mounted, setMounted] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // --- Calculations ---
  
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

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

  // AI Insight Generation
  useEffect(() => {
    if (properties.length > 0 && !aiInsight && !isAnalyzing) {
      generateInsight();
    }
  }, [properties]);

  const generateInsight = async () => {
    setIsAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        Analyze this RE portfolio briefly:
        - Properties: ${properties.length}
        - Total Equity (My Share): ${currencyService.format(totalMyEquity, globalCurrency)}
        - Monthly Cash Flow: ${currencyService.format(monthlyCashFlow, globalCurrency)}
        - Geographic mix: ${countryData.map(c => c.name).join(', ')}
        
        Provide a 1-sentence tactical "Pulse" insight for the investor in ${lang === 'he' ? 'Hebrew' : 'English'}.
        Focus on risk, diversification, or performance. Be extremely concise.
      `;

      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      setAiInsight(result.text || null);
    } catch (err) {
      console.error("AI Analysis failed", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const chartData = useMemo(() => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthKey = d.toLocaleString('default', { month: 'short' });
      const txs = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === d.getMonth() && tDate.getFullYear() === d.getFullYear();
      });
      let inc = 0; let exp = 0;
      txs.forEach(t => {
        const prop = properties.find(p => p.id === t.propertyId);
        const txCurrency = prop ? prop.currency : 'USD';
        const amount = currencyService.convert(t.amount, txCurrency, globalCurrency);
        if (t.type === 'income') inc += amount; else exp += amount;
      });
      data.push({ name: monthKey, Income: inc, Expense: exp });
    }
    return data;
  }, [transactions, properties, globalCurrency]);

  const toggleCurrency = () => {
    if (globalCurrency === 'NIS') setGlobalCurrency('USD');
    else if (globalCurrency === 'USD') setGlobalCurrency('EUR');
    else setGlobalCurrency('NIS');
  };

  return (
    <div className="space-y-6 pb-32 animate-fade-in">
      <header className="flex justify-between items-center p-4 pb-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('dashboard', lang)}</h1>
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Portfolio Hub</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setLang(lang === 'en' ? 'he' : 'en')} className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-xs shadow-sm active:scale-90 transition-transform">
             {lang === 'en' ? '🇮🇱' : '🇺🇸'}
          </button>
          <button onClick={toggleCurrency} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-100 rounded-full shadow-sm text-xs font-bold text-brand-600 active:scale-95 transition-all">
            <RefreshCw size={12} className={isAnalyzing ? 'animate-spin' : ''} />
            <span>{globalCurrency}</span>
          </button>
          <button onClick={() => setView && setView(ViewState.SETTINGS)} className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-400 shadow-sm active:rotate-45 transition-transform">
            <Settings size={18} />
          </button>
        </div>
      </header>
      
      {/* AI Pulse Insight */}
      {properties.length > 0 && (
        <div className="px-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-brand-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
              <Sparkles className="text-brand-500" size={48} />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest">AI Portfolio Pulse</span>
            </div>
            {isAnalyzing ? (
              <div className="flex items-center gap-2 py-1">
                <Loader2 size={14} className="animate-spin text-brand-500" />
                <span className="text-xs text-gray-400 italic">Analyzing market conditions...</span>
              </div>
            ) : (
              <p className="text-sm text-gray-700 font-medium leading-relaxed pr-8">
                {aiInsight || "Add more property data for a deeper smart analysis."}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="px-4">
        <Card className="bg-gradient-to-br from-brand-600 to-brand-800 text-white border-none shadow-brand-500/30 shadow-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-10 -translate-y-10" />
          <div className="flex items-center gap-2 opacity-80 mb-1">
            <TrendingUp size={18} />
            <span className="text-sm font-semibold">{t('total_equity', lang)}</span>
          </div>
          <h2 className="text-4xl font-bold tracking-tight mb-6">
            {currencyService.format(totalMyEquity, globalCurrency)}
          </h2>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
            <div>
              <p className="text-[10px] text-brand-100 uppercase font-bold mb-1 opacity-80">{t('monthly_cash_flow', lang)}</p>
              <div className="flex items-center gap-1">
                {monthlyCashFlow >= 0 ? <ArrowUpRight size={18} className="text-green-300" /> : <ArrowDownRight size={18} className="text-red-300" />}
                <span className="font-bold text-xl leading-none">
                  {currencyService.format(Math.abs(monthlyCashFlow), globalCurrency)}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-brand-100 uppercase font-bold mb-1 opacity-80">{t('properties', lang)}</p>
              <span className="font-bold text-2xl leading-none">{properties.length}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Allocation & Trends Section */}
      <div className="px-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Allocation Donut */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
           <div className="flex items-center gap-2 mb-4">
             <Globe size={16} className="text-blue-500" />
             <h3 className="font-bold text-gray-800 text-sm">Asset Allocation</h3>
           </div>
           <div className="h-40 relative">
             <ResponsiveContainer width="100%" height="100%">
               <RePieChart>
                 <Pie data={countryData} innerRadius={35} outerRadius={55} paddingAngle={5} dataKey="value">
                   {countryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                 </Pie>
                 <Tooltip formatter={(v: number) => currencyService.format(v, globalCurrency)} />
               </RePieChart>
             </ResponsiveContainer>
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
               <span className="text-[10px] text-gray-400 font-bold uppercase">Regions</span>
               <span className="text-xs font-bold text-gray-700">{countryData.length}</span>
             </div>
           </div>
           <div className="flex flex-wrap justify-center gap-3 mt-2">
              {countryData.map((c, i) => (
                <div key={i} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-[10px] text-gray-500 font-bold">{c.name}</span>
                </div>
              ))}
           </div>
        </div>

        {/* Financial Trends Bar */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
             <Activity size={16} className="text-brand-500" />
             <h3 className="font-bold text-gray-800 text-sm">{t('financial_overview', lang)}</h3>
          </div>
          <div className="h-40 w-full min-w-0">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} dy={10} />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => currencyService.format(value, globalCurrency)}
                  />
                  <Bar dataKey="Income" fill="#10B981" radius={[4, 4, 0, 0]} barSize={8} />
                  <Bar dataKey="Expense" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={8} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="px-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-gray-800 text-sm">{t('recent_activity', lang)}</h3>
          <button className="text-brand-600 text-[10px] font-bold uppercase tracking-wider">{t('view_all', lang)}</button>
        </div>
        <div className="space-y-3">
          {transactions.slice(0, 4).map(t => {
             const prop = properties.find(p => p.id === t.propertyId);
             const currency = prop ? prop.currency : 'USD';
             const displayAmount = currencyService.format(currencyService.convert(t.amount, currency, globalCurrency), globalCurrency);
             return (
              <Card key={t.id} className="flex justify-between items-center p-3 border-gray-50">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${t.type === 'income' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {t.type === 'income' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-xs">{t.category}</p>
                    <p className="text-[10px] text-gray-400 font-medium">{new Date(t.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`text-sm font-bold ${t.type === 'income' ? 'text-green-600' : 'text-gray-900'}`}>
                  {t.type === 'income' ? '+' : '-'}{displayAmount}
                </span>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
