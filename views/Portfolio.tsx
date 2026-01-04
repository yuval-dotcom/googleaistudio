
import React, { useState } from 'react';
import { Card } from '../components/Card';
import { Property, Transaction, CurrencyCode, PropertyType, Language, ViewState } from '../types';
import { Building2, Plus, ArrowRight, Home, MapPin, Layers } from 'lucide-react';
import { currencyService } from '../services/currencyService';
import { t } from '../services/translationService';

interface PortfolioProps {
  properties: Property[];
  transactions: Transaction[];
  onRefresh: () => void;
  globalCurrency: CurrencyCode;
  onSelectProperty: (p: Property) => void;
  lang: Language;
  onAddProperty?: () => void;
}

export const Portfolio: React.FC<PortfolioProps> = ({ properties, transactions, onRefresh, globalCurrency, onSelectProperty, lang, onAddProperty }) => {
  const [filterType, setFilterType] = useState<PropertyType | 'All'>('All');

  const filteredProperties = filterType === 'All' 
    ? properties 
    : properties.filter(p => p.type === filterType);

  // FIX: Explicitly set return type to string and return "0.0" instead of 0 to satisfy type requirements in the UI and parseFloat.
  const calculateCapRate = (property: Property): string => {
    const propTxs = transactions.filter(t => t.propertyId === property.id);
    const income = propTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = propTxs.filter(t => t.type === 'expense' && t.category !== 'Mortgage').reduce((sum, t) => sum + t.amount, 0);
    const netIncome = income - expense;
    if (property.marketValue === 0) return "0.0";
    const capRate = ((netIncome * 12) / property.marketValue) * 100; 
    return Math.max(0, capRate).toFixed(1);
  };

  const getFlag = (country: string) => {
    const flags: Record<string, string> = { 'USA': '🇺🇸', 'UK': '🇬🇧', 'Israel': '🇮🇱', 'Canada': '🇨🇦', 'Germany': '🇩🇪' };
    return flags[country] || '🏳️';
  };

  return (
    <div className="pb-32 animate-fade-in relative p-4 bg-gray-50 min-h-full">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('portfolio', lang)}</h1>
          <p className="text-xs text-gray-500 font-medium">{properties.length} Active Assets</p>
        </div>
        <button 
          onClick={onAddProperty}
          className="bg-brand-600 text-white px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-1.5 shadow-lg shadow-brand-500/30 active:scale-95 transition-all"
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>{t('add_property', lang)}</span>
        </button>
      </header>

      {/* Filter Bar */}
      <div className="flex overflow-x-auto space-x-2 gap-2 mb-6 no-scrollbar pb-2">
         {['All', 'Residential', 'Commercial', 'Shop'].map(type => (
           <button
             key={type}
             onClick={() => setFilterType(type as any)}
             className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${filterType === type ? 'bg-gray-900 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200'}`}
           >
             {type === 'All' ? t('filter_all', lang) : type}
           </button>
         ))}
      </div>

      {/* Property List */}
      <div className="space-y-4">
        {filteredProperties.map(property => {
          const myPartner = property.partners?.find(p => p.uid === 'user1');
          const mySharePct = myPartner ? myPartner.percentage : 100;
          const roi = calculateCapRate(property);

          return (
          <Card key={property.id} className="relative overflow-hidden group border-gray-100" onClick={() => onSelectProperty(property)}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-brand-600 group-hover:bg-brand-50 transition-colors">
                  <Home size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm leading-tight mb-0.5">{property.address}</h3>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold uppercase tracking-wide">
                    <span>{getFlag(property.country)} {property.country}</span>
                    <span className="text-gray-300">•</span>
                    <span>{property.type}</span>
                  </div>
                </div>
              </div>
              <div className={`px-2 py-1 rounded-lg text-[10px] font-black tracking-tighter border ${
                parseFloat(roi) > 5 ? 'bg-green-50 text-green-700 border-green-100' : 'bg-amber-50 text-amber-700 border-amber-100'
              }`}>
                {roi}% ROI
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="bg-gray-50/80 p-3 rounded-xl border border-gray-100">
                <p className="text-[10px] text-gray-400 uppercase font-bold mb-0.5">{t('total_value', lang)}</p>
                <p className="font-bold text-gray-900 text-sm">{currencyService.format(property.marketValue, property.currency)}</p>
              </div>
              <div className="bg-brand-50/50 p-3 rounded-xl border border-brand-100">
                <p className="text-[10px] text-brand-600 uppercase font-bold mb-0.5">{t('my_share', lang)} ({mySharePct}%)</p>
                <p className="font-bold text-brand-700 text-sm">
                  {currencyService.format(property.marketValue * (mySharePct / 100), property.currency)}
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
               <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <Layers size={10} />
                  </div>
                  <span className="text-[10px] font-bold text-gray-400">Yield Strategy: {property.type}</span>
               </div>
               <ArrowRight size={16} className="text-gray-300 group-hover:text-brand-600 group-hover:translate-x-1 transition-all" />
            </div>
          </Card>
        )})}
        
        {filteredProperties.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <Building2 className="mx-auto text-gray-200 mb-2" size={48} />
            <p className="text-sm text-gray-400 font-medium">No properties in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
};
