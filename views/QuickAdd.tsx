
import React, { useState, useMemo } from 'react';
import { Property, TransactionType } from '../types';
import { dataService } from '../services/mockDataService';
import { supabaseDataService } from '../services/supabaseService';
import { supabase } from '../services/supabaseConfig';
import { currencyService } from '../services/currencyService';
import { ArrowLeft, Check, Loader2, AlertTriangle } from 'lucide-react';

interface QuickAddProps {
  properties: Property[];
  onComplete: () => void;
  onCancel: () => void;
}

export const QuickAdd: React.FC<QuickAddProps> = ({ properties, onComplete, onCancel }) => {
  const [amount, setAmount] = useState<string>('');
  const [type, setType] = useState<TransactionType>('income');
  const [propertyId, setPropertyId] = useState<string>(properties[0]?.id || '');
  const [category, setCategory] = useState<string>('Rent');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = {
    income: ['Rent', 'Deposit', 'Other'],
    expense: ['Maintenance', 'Mortgage', 'Tax', 'Utilities', 'Insurance', 'Repairs']
  };

  const selectedProperty = useMemo(() => properties.find(p => p.id === propertyId), [properties, propertyId]);
  const currencySymbol = useMemo(() => selectedProperty ? currencyService.getSymbol(selectedProperty.currency) : '$', [selectedProperty]);

  const handleNumPad = (val: string) => {
    if (val === 'back') {
      setAmount(prev => prev.slice(0, -1));
    } else if (val === '.') {
      if (!amount.includes('.')) setAmount(prev => prev + val);
    } else {
      setAmount(prev => prev + val);
    }
  };

  const handleSubmit = async () => {
    const val = parseFloat(amount);
    if (!amount || isNaN(val) || val <= 0 || !propertyId) return;

    setIsSaving(true);
    setError(null);

    try {
      const session = await supabase.auth.getSession();
      const service = session.data.session ? supabaseDataService : dataService;

      await service.addTransaction({
        userId: 'user1',
        propertyId,
        amount: val,
        type,
        category,
        date: new Date().toISOString()
      });

      onComplete();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save transaction.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-50 z-[60] flex flex-col animate-slide-up h-[100dvh]">
      <div className="flex-none flex items-center justify-between p-4 bg-white border-b border-gray-100">
        <button onClick={onCancel} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-lg font-bold">New Transaction</h2>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="min-h-full flex flex-col p-4 max-w-md mx-auto">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm flex items-center gap-2 border border-red-200">
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}
          
          <div className="bg-white p-6 rounded-2xl shadow-sm mb-6">
            <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
              <button className={`flex-1 py-3 rounded-lg font-semibold text-sm transition-all ${type === 'income' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500'}`} onClick={() => { setType('income'); setCategory('Rent'); }}>Income</button>
              <button className={`flex-1 py-3 rounded-lg font-semibold text-sm transition-all ${type === 'expense' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500'}`} onClick={() => { setType('expense'); setCategory('Maintenance'); }}>Expense</button>
            </div>

            <div className="text-center mb-8">
              <p className="text-gray-400 text-sm mb-1">Amount</p>
              <div className={`text-5xl font-bold tracking-tight overflow-hidden text-ellipsis whitespace-nowrap ${type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                <span className="text-3xl align-top mr-1">{currencySymbol}</span>
                {amount || '0'}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Property</label>
                <select value={propertyId} onChange={(e) => setPropertyId(e.target.value)} className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 font-medium text-gray-800 outline-none appearance-none">
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.address} ({p.country})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 font-medium text-gray-800 outline-none appearance-none">
                  {categories[type].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="mt-auto pb-4">
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0].map((num) => (
                <button key={num} onClick={() => handleNumPad(num.toString())} className="h-14 rounded-xl bg-white border border-gray-200 text-2xl font-semibold text-gray-700 shadow-sm">{num}</button>
              ))}
              <button onClick={() => handleNumPad('back')} className="h-14 rounded-xl bg-white border border-gray-200 text-gray-700 flex items-center justify-center shadow-sm">⌫</button>
            </div>
            <button onClick={handleSubmit} disabled={!amount || parseFloat(amount) <= 0 || isSaving} className="w-full py-4 bg-brand-600 disabled:bg-gray-300 text-white rounded-xl font-bold text-lg shadow-lg flex items-center justify-center space-x-2 active:scale-98">
              {isSaving ? <Loader2 className="animate-spin" size={24} /> : <Check size={24} />}
              <span>{isSaving ? 'Saving...' : 'Save Transaction'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
