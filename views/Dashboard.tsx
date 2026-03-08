
import React, { useMemo, useState } from 'react';
import { Card } from '../components/Card';
import { Property, Transaction, CurrencyCode, ViewState, Language } from '../types';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Activity, Globe, Settings, Sparkles, Loader2, RefreshCw, Calendar } from 'lucide-react';
import { currencyService } from '../services/currencyService';
import { t } from '../services/translationService';
import { generate as aiGenerate } from '../services/aiApiService';
import { notificationService } from '../services/notificationService';
import { getAiConsent, setAiConsent } from '../services/aiConsent';
import { AiPrivacyGate } from '../components/AiPrivacyGate';

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
  const [showAiGate, setShowAiGate] = useState(false);
  const [performanceCountry, setPerformanceCountry] = useState<string>('All');

  const getCountryCurrency = (country: string, fallback: CurrencyCode): CurrencyCode => {
    const normalized = String(country || '').trim().toLowerCase();
    if (normalized === 'israel' || normalized === 'ישראל') return 'NIS';
    if (normalized === 'usa' || normalized === 'united states' || normalized === 'ארצות הברית' || normalized === 'ארהב') return 'USD';
    if (normalized === 'germany' || normalized === 'גרמניה' || normalized === 'deutschland') return 'EUR';
    if (fallback === 'NIS' || fallback === 'USD' || fallback === 'EUR') return fallback;
    return 'USD';
  };

  const expiringLeases = useMemo(() => notificationService.getExpiringLeases(properties), [properties]);

  const equityByCountry = useMemo(() => {
    const map: Record<string, { currency: CurrencyCode; value: number }> = {};
    properties.forEach((p) => {
      const targetCurrency = getCountryCurrency(p.country, p.currency);
      const marketValueLocal = currencyService.convert(p.marketValue, p.currency, targetCurrency);
      const loanBalanceLocal = currencyService.convert(p.loanBalance || 0, p.currency, targetCurrency);
      const propEquity = marketValueLocal - loanBalanceLocal;
      const myPartnerRecord = p.partners?.find((partner) => partner.hasAccess);
      const myPercentage = myPartnerRecord ? myPartnerRecord.percentage : 100;
      const myEquity = propEquity * (myPercentage / 100);
      if (!map[p.country]) {
        map[p.country] = { currency: targetCurrency, value: 0 };
      }
      map[p.country].value += myEquity;
    });
    return Object.entries(map)
      .map(([country, data]) => ({ country, currency: data.currency, value: data.value }))
      .sort((a, b) => b.value - a.value);
  }, [properties]);

  const monthlyCashFlowByCountry = useMemo(() => {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    const recent = transactions.filter(t => new Date(t.date) >= last30Days);
    const map: Record<string, { currency: CurrencyCode; value: number }> = {};
    recent.forEach((t) => {
      const prop = properties.find(p => p.id === t.propertyId);
      if (!prop) return;
      const targetCurrency = getCountryCurrency(prop.country, prop.currency);
      const convertedAmount = currencyService.convert(t.amount, prop.currency, targetCurrency);
      if (!map[prop.country]) {
        map[prop.country] = { currency: targetCurrency, value: 0 };
      }
      map[prop.country].value += t.type === 'income' ? convertedAmount : -convertedAmount;
    });
    return Object.entries(map)
      .map(([country, data]) => ({ country, currency: data.currency, value: data.value }))
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  }, [transactions, properties]);

  const countryData = useMemo(() => {
    const map: Record<string, { currency: CurrencyCode; value: number }> = {};
    properties.forEach(p => {
      const targetCurrency = getCountryCurrency(p.country, p.currency);
      const val = currencyService.convert(p.marketValue, p.currency, targetCurrency);
      if (!map[p.country]) {
        map[p.country] = { currency: targetCurrency, value: 0 };
      }
      map[p.country].value += val;
    });
    return Object.entries(map)
      .map(([country, data]) => ({ name: country, currency: data.currency, value: data.value }))
      .sort((a, b) => b.value - a.value);
  }, [properties]);

  const allCountries = useMemo(() => {
    return Array.from(new Set(properties.map((p) => p.country).filter(Boolean))).sort();
  }, [properties]);

  const performanceCurrency: CurrencyCode = useMemo(() => {
    if (performanceCountry !== 'All') {
      const sample = properties.find((p) => p.country === performanceCountry);
      if (sample) return getCountryCurrency(sample.country, sample.currency);
    }
    return globalCurrency;
  }, [performanceCountry, properties, globalCurrency]);

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
        if (!prop) return;
        if (performanceCountry !== 'All' && prop.country !== performanceCountry) return;
        const targetCurrency =
          performanceCountry === 'All'
            ? performanceCurrency
            : getCountryCurrency(prop.country, prop.currency);
        const convertedAmount = currencyService.convert(t.amount, prop.currency, targetCurrency);
        if (t.type === 'income') {
          months[mIdx].income += convertedAmount;
        } else {
          months[mIdx].expense += convertedAmount;
        }
      }
    });

    return months;
  }, [transactions, properties, performanceCountry, lang, performanceCurrency]);

  const totalMyEquity = useMemo(() => {
    return equityByCountry.reduce(
      (sum, row) => sum + currencyService.convert(row.value, row.currency, globalCurrency),
      0
    );
  }, [equityByCountry, globalCurrency]);

  const monthlyCashFlow = useMemo(() => {
    return monthlyCashFlowByCountry.reduce(
      (sum, row) => sum + currencyService.convert(row.value, row.currency, globalCurrency),
      0
    );
  }, [monthlyCashFlowByCountry, globalCurrency]);

  const handleGenerateInsight = async () => {
    if (properties.length === 0 || isAnalyzing) return;
    if (!getAiConsent()) {
      setShowAiGate(true);
      return;
    }
    doGenerateInsight();
  };

  const doGenerateInsight = async () => {
    if (properties.length === 0 || isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const prompt = `Quick tactical summary (max 2 sentences) of this RE portfolio: ${properties.length} properties, ${currencyService.format(totalMyEquity, globalCurrency)} equity, ${currencyService.format(monthlyCashFlow, globalCurrency)} monthly cashflow. Focus on health and next steps. Language: ${lang === 'he' ? 'Hebrew' : 'English'}.`;
      const result = await aiGenerate({ prompt, lang });
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
      {showAiGate && (
        <AiPrivacyGate
          lang={lang}
          onAccept={() => {
            setAiConsent();
            setShowAiGate(false);
            doGenerateInsight();
          }}
          onCancel={() => setShowAiGate(false)}
        />
      )}
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('dashboard', lang)}</h1>
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Investor Pro v2</p>
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={globalCurrency}
            onChange={(e) => setGlobalCurrency(e.target.value as CurrencyCode)}
            className="h-9 rounded-xl glass border border-white px-2 text-[10px] font-black text-gray-600 uppercase tracking-widest shadow-sm outline-none"
            aria-label="Global currency"
          >
            <option value="NIS">₪ NIS</option>
            <option value="USD">$ USD</option>
            <option value="EUR">€ EUR</option>
          </select>
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
          <span className="text-xs font-bold tracking-tight">{t('total_equity', lang)} by Country</span>
        </div>
        <div className="space-y-1 mb-6">
          {equityByCountry.map((row) => (
            <div key={row.country} className="flex items-center justify-between text-sm">
              <span className="font-bold opacity-90">{row.country}</span>
              <span className="font-black">{currencyService.format(row.value, row.currency)}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
          <div>
            <p className="text-[9px] text-brand-100 uppercase font-black opacity-70 tracking-wider mb-1">{t('monthly_cash_flow', lang)} by Country</p>
            <div className="space-y-1">
              {monthlyCashFlowByCountry.slice(0, 2).map((row) => (
                <div key={row.country} className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold">{row.country}</span>
                  <span className="text-[10px] font-bold">
                    {currencyService.format(Math.abs(row.value), row.currency)}
                  </span>
                  {row.value >= 0 ? <ArrowUpRight size={12} className="text-green-300" /> : <ArrowDownRight size={12} className="text-red-300" />}
                </div>
              ))}
            </div>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-brand-100 uppercase font-black opacity-70 tracking-wider mb-1">{t('properties', lang)}</p>
            <span className="font-bold text-xl">{properties.length}</span>
          </div>
        </div>
      </Card>

      {/* Deal Analysis entry point */}
      <Card className="p-4 flex items-center justify-between border-dashed border-brand-200 bg-brand-50/40">
        <div>
          <p className="text-[10px] text-brand-600 uppercase font-black tracking-widest mb-1">
            New Deal
          </p>
          <p className="text-xs text-gray-700">
            Analyze a new investment opportunity and see NOI, Cap Rate and Cash-on-Cash.
          </p>
        </div>
        <button
          onClick={() => setView(ViewState.DEALS)}
          className="px-3 py-2 rounded-full bg-brand-600 text-white text-[11px] font-bold flex items-center gap-1 shadow-md active:scale-95"
        >
          <Sparkles size={14} /> <span>Analyze</span>
        </button>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Regions Card with Details */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col">
           <div className="flex items-center gap-2 mb-3 w-full">
             <Globe size={14} className="text-blue-500" />
             <h3 className="font-black text-[9px] text-gray-400 uppercase tracking-widest">{t('regions', lang)}</h3>
           </div>
           <div className="space-y-1 max-h-[140px] overflow-y-auto no-scrollbar mt-2">
             {countryData.map((item, i) => (
               <div key={item.name} className="flex items-center justify-between gap-1">
                 <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-[8px] font-bold text-gray-600 truncate">{item.name}</span>
                 </div>
                 <span className="text-[8px] font-black text-gray-400 shrink-0">{currencyService.format(item.value, item.currency)}</span>
               </div>
             ))}
           </div>
        </div>

        {/* Performance Chart */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col min-h-[140px]">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
            <Activity size={14} className="text-brand-500" />
            <h3 className="font-black text-[9px] text-gray-400 uppercase tracking-widest">{t('performance', lang)}</h3>
            </div>
            <select
              value={performanceCountry}
              onChange={(e) => setPerformanceCountry(e.target.value)}
              className="text-[9px] border border-gray-200 rounded-md px-1 py-0.5 text-gray-500 font-bold"
            >
              <option value="All">All</option>
              {allCountries.map((country) => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 w-full mt-1">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={performanceData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 'bold', fill: '#9ca3af' }} />
                 <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
                    formatter={(val: number) => currencyService.format(val, performanceCurrency)}
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
