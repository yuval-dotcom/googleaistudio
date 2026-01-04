import React, { useState, useEffect } from 'react';
import { Property, PropertyType, CurrencyCode, Partner, MortgageMix } from '../types';
import { ArrowLeft, Check, Plus, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { dataService } from '../services/mockDataService';
// Import the active service dynamically in App, but here we receive onSave. 
// We need to ensure we catch errors from the parent/service execution.
// Note: We use the global dataService abstraction or pass a saver, but for this architecture
// the view calls the service directly. We will import supabaseDataService to be safe if isDemo is false,
// but App.tsx handles the toggle. To keep it simple, we assume the prop or global service context.
// Ideally, App should pass the service, but we will wrap the execution logic safely.
import { supabaseDataService } from '../services/supabaseService';
import { supabase } from '../services/supabaseConfig';

interface PropertyEditorProps {
  property?: Property | null; // null = Add Mode, object = Edit Mode
  onSave: () => void;
  onCancel: () => void;
}

export const PropertyEditor: React.FC<PropertyEditorProps> = ({ property, onSave, onCancel }) => {
  // Form State
  const [address, setAddress] = useState('');
  const [country, setCountry] = useState('USA');
  const [type, setType] = useState<PropertyType>('Residential');
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  
  const [purchasePrice, setPurchasePrice] = useState('');
  const [purchasePriceNIS, setPurchasePriceNIS] = useState('');
  const [marketValue, setMarketValue] = useState('');
  
  // Tax
  const [incomeTaxRate, setIncomeTaxRate] = useState('25');
  const [propertyTaxRate, setPropertyTaxRate] = useState('1.0');

  // Mortgage
  const [bankName, setBankName] = useState('');
  const [loanBalance, setLoanBalance] = useState('');
  const [monthlyMortgage, setMonthlyMortgage] = useState('');
  const [mortgageInterestRate, setMortgageInterestRate] = useState('');
  
  const [mix, setMix] = useState<MortgageMix>({ fixedPercent: 100, variablePercent: 0, primePercent: 0 });

  // Partners
  const [partners, setPartners] = useState<Partner[]>([]);

  // Validation State
  const [errors, setErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Synchronization Effect: Resets state when the passed `property` prop changes
  useEffect(() => {
    if (property) {
      setAddress(property.address);
      setCountry(property.country);
      setType(property.type);
      setCurrency(property.currency);
      setPurchasePrice(property.purchasePrice.toString());
      setPurchasePriceNIS(property.purchasePriceNIS?.toString() || '');
      setMarketValue(property.marketValue.toString());
      setIncomeTaxRate(property.incomeTaxRate.toString());
      setPropertyTaxRate(property.propertyTaxRate.toString());
      setBankName(property.bankName || '');
      setLoanBalance(property.loanBalance?.toString() || '');
      setMonthlyMortgage(property.monthlyMortgage?.toString() || '');
      setMortgageInterestRate(property.mortgageInterestRate?.toString() || '');
      setMix(property.mortgageMix || { fixedPercent: 100, variablePercent: 0, primePercent: 0 });
      setPartners(property.partners || []);
    } else {
      // Reset to defaults for Add Mode
      setAddress('');
      setCountry('USA');
      setType('Residential');
      setCurrency('USD');
      setPurchasePrice('');
      setPurchasePriceNIS('');
      setMarketValue('');
      setIncomeTaxRate('25');
      setPropertyTaxRate('1.0');
      setBankName('');
      setLoanBalance('');
      setMonthlyMortgage('');
      setMortgageInterestRate('');
      setMix({ fixedPercent: 100, variablePercent: 0, primePercent: 0 });
      setPartners([]);
    }
    setErrors([]); // Clear errors on view change
  }, [property]);

  const safeParseFloat = (val: string): number => {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
  };

  const handleSave = async () => {
    const newErrors: string[] = [];

    // 1. Required Fields Validation
    if (!address.trim()) newErrors.push("Address is required.");
    if (!purchasePrice || safeParseFloat(purchasePrice) <= 0) newErrors.push("Valid Purchase Price is required.");
    if (!marketValue || safeParseFloat(marketValue) <= 0) newErrors.push("Valid Market Value is required.");

    // 2. Logic Validation: Mortgage Mix
    const totalMix = safeParseFloat(mix.fixedPercent.toString()) + 
                     safeParseFloat(mix.variablePercent.toString()) + 
                     safeParseFloat(mix.primePercent.toString());
    
    // Allow slight tolerance for slider floating point issues, but strictly should be 100
    if (Math.abs(totalMix - 100) > 0.1) {
      newErrors.push(`Mortgage Mix must equal 100% (Current: ${totalMix}%)`);
    }

    // 3. Logic Validation: Partners
    if (partners.length > 0) {
      const totalPartners = partners.reduce((sum, p) => sum + safeParseFloat(p.percentage.toString()), 0);
      if (Math.abs(totalPartners - 100) > 0.1) {
        newErrors.push(`Partner shares must equal 100% (Current: ${totalPartners}%)`);
      }
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSaving(true);
    setErrors([]);

    // Construct Payload (Strictly Typed)
    const payload: Omit<Property, 'id'> = {
      userId: 'user1', // Placeholder, service overrides this
      address,
      country,
      type,
      currency,
      purchasePrice: safeParseFloat(purchasePrice),
      purchasePriceNIS: purchasePriceNIS ? safeParseFloat(purchasePriceNIS) : undefined,
      marketValue: safeParseFloat(marketValue),
      incomeTaxRate: safeParseFloat(incomeTaxRate),
      propertyTaxRate: safeParseFloat(propertyTaxRate),
      bankName,
      loanBalance: safeParseFloat(loanBalance),
      monthlyMortgage: safeParseFloat(monthlyMortgage),
      mortgageInterestRate: safeParseFloat(mortgageInterestRate),
      mortgageMix: mix,
      partners: partners.length > 0 ? partners : undefined
    };

    try {
      // Determine which service to use
      // In a real app we'd pass the service as a prop, but here we fallback to supabase directly
      // if we aren't in demo mode. 
      const session = await supabase.auth.getSession();
      const service = session.data.session ? supabaseDataService : dataService;

      if (property && property.id) {
        // Update
        await service.updateProperty({ ...payload, id: property.id });
      } else {
        // Create
        await service.addProperty(payload);
      }
      onSave();
    } catch (err: any) {
      console.error(err);
      setErrors([err.message || "Failed to save to database."]);
    } finally {
      setIsSaving(false);
    }
  };

  const updatePartner = (index: number, field: keyof Partner, value: any) => {
    const newPartners = [...partners];
    newPartners[index] = { ...newPartners[index], [field]: value };
    setPartners(newPartners);
  };

  const addPartner = () => {
    setPartners([...partners, { uid: `new-${Date.now()}`, name: 'New Partner', percentage: 0, hasAccess: false }]);
  };

  const removePartner = (index: number) => {
    setPartners(partners.filter((_, i) => i !== index));
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 pb-32 animate-fade-in">
      {/* Header */}
      <div className="bg-white p-4 border-b border-gray-200 sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={onCancel} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-bold text-lg">{property ? 'Edit Property' : 'Add Property'}</h1>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-1 bg-brand-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-sm active:scale-95 disabled:opacity-50"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          <span>{isSaving ? 'Saving...' : 'Save'}</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Error Banner */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 animate-slide-up">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-red-500 shrink-0" size={20} />
              <div>
                <h3 className="text-red-800 font-bold text-sm">Error Saving Data:</h3>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  {errors.map((err, idx) => (
                    <li key={idx} className="text-xs text-red-600 break-words">{err}</li>
                  ))}
                </ul>
                {errors[0].includes('permission') && (
                  <p className="text-[10px] text-red-500 mt-2">Hint: Check Supabase RLS policies.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* General Info */}
        <section className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <h3 className="font-bold text-gray-800 border-b pb-2">General Info</h3>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Address</label>
            <input 
              value={address} onChange={e => setAddress(e.target.value)}
              className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none"
              placeholder="123 Main St"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Country</label>
              <select 
                value={country} onChange={e => setCountry(e.target.value)}
                className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 outline-none"
              >
                <option value="USA">USA 🇺🇸</option>
                <option value="UK">UK 🇬🇧</option>
                <option value="Israel">Israel 🇮🇱</option>
                <option value="Germany">Germany 🇩🇪</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Type</label>
              <select 
                value={type} onChange={e => setType(e.target.value as PropertyType)}
                className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 outline-none"
              >
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Shop">Shop</option>
                <option value="Logistics">Logistics</option>
              </select>
            </div>
          </div>
        </section>

        {/* Valuation */}
        <section className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <h3 className="font-bold text-gray-800 border-b pb-2">Valuation</h3>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Currency</label>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              {(['USD', 'EUR', 'NIS'] as CurrencyCode[]).map(c => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${currency === c ? 'bg-white shadow-sm text-brand-600' : 'text-gray-500'}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Purchase ({currency})</label>
              <input 
                type="number" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)}
                className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Market Value</label>
              <input 
                type="number" value={marketValue} onChange={e => setMarketValue(e.target.value)}
                className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 outline-none"
              />
            </div>
          </div>
          
          {currency !== 'NIS' && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
              <label className="block text-xs font-bold text-blue-800 uppercase mb-1">Cost in NIS (Historical)</label>
              <input 
                type="number" value={purchasePriceNIS} onChange={e => setPurchasePriceNIS(e.target.value)}
                placeholder="Amount paid in Shekels"
                className="w-full p-2 bg-white rounded border border-blue-200 outline-none text-sm"
              />
              <p className="text-[10px] text-blue-600 mt-1">Used to calculate real gain/loss adjusted for forex.</p>
            </div>
          )}
        </section>

        {/* Mortgage */}
        <section className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <h3 className="font-bold text-gray-800 border-b pb-2">Mortgage</h3>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Bank Name</label>
            <input 
              value={bankName} onChange={e => setBankName(e.target.value)}
              className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 outline-none"
              placeholder="e.g. Chase, Leumi"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
             <div className="col-span-1">
               <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Balance</label>
               <input 
                 type="number" value={loanBalance} onChange={e => setLoanBalance(e.target.value)}
                 className="w-full p-2 bg-gray-50 rounded-lg border border-gray-200 outline-none text-sm"
               />
             </div>
             <div className="col-span-1">
               <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Monthly</label>
               <input 
                 type="number" value={monthlyMortgage} onChange={e => setMonthlyMortgage(e.target.value)}
                 className="w-full p-2 bg-gray-50 rounded-lg border border-gray-200 outline-none text-sm"
               />
             </div>
             <div className="col-span-1">
               <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Rate %</label>
               <input 
                 type="number" value={mortgageInterestRate} onChange={e => setMortgageInterestRate(e.target.value)}
                 className="w-full p-2 bg-gray-50 rounded-lg border border-gray-200 outline-none text-sm"
               />
             </div>
          </div>
          
          {/* Mortgage Mix */}
          <div className="pt-2">
             <div className="flex justify-between items-end mb-2">
                <p className="text-xs font-bold text-gray-400 uppercase">Mortgage Mix (%)</p>
                <span className={`text-xs font-bold ${
                  Math.abs(mix.fixedPercent + mix.variablePercent + mix.primePercent - 100) > 0.1 ? 'text-red-500' : 'text-green-600'
                }`}>
                  Total: {mix.fixedPercent + mix.variablePercent + mix.primePercent}%
                </span>
             </div>
             <div className="space-y-2">
               <div className="flex items-center gap-2">
                 <span className="w-16 text-xs text-gray-600">Fixed</span>
                 <input 
                   type="range" min="0" max="100" value={mix.fixedPercent}
                   onChange={e => setMix({...mix, fixedPercent: parseInt(e.target.value)})}
                   className="flex-1 accent-brand-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                 />
                 <span className="w-8 text-xs font-bold">{mix.fixedPercent}%</span>
               </div>
               <div className="flex items-center gap-2">
                 <span className="w-16 text-xs text-gray-600">Variable</span>
                 <input 
                   type="range" min="0" max="100" value={mix.variablePercent}
                   onChange={e => setMix({...mix, variablePercent: parseInt(e.target.value)})}
                   className="flex-1 accent-yellow-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                 />
                 <span className="w-8 text-xs font-bold">{mix.variablePercent}%</span>
               </div>
               <div className="flex items-center gap-2">
                 <span className="w-16 text-xs text-gray-600">Prime</span>
                 <input 
                   type="range" min="0" max="100" value={mix.primePercent}
                   onChange={e => setMix({...mix, primePercent: parseInt(e.target.value)})}
                   className="flex-1 accent-blue-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                 />
                 <span className="w-8 text-xs font-bold">{mix.primePercent}%</span>
               </div>
             </div>
          </div>
        </section>

        {/* Partners */}
        <section className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
           <div className="flex justify-between items-center border-b pb-2">
             <h3 className="font-bold text-gray-800">Partners</h3>
             <button onClick={addPartner} className="text-brand-600 text-xs font-bold flex items-center gap-1">
               <Plus size={14} /> Add
             </button>
           </div>
           
           {partners.length === 0 && <p className="text-gray-400 text-sm italic">No partners defined.</p>}
           
           {partners.length > 0 && (
              <div className="flex justify-between text-xs font-bold text-gray-400 mb-2">
                 <span>List</span>
                 <span className={Math.abs(partners.reduce((s,p) => s + p.percentage, 0) - 100) > 0.1 ? 'text-red-500' : 'text-green-600'}>
                    Total: {partners.reduce((s,p) => s + p.percentage, 0)}%
                 </span>
              </div>
           )}

           {partners.map((p, idx) => (
             <div key={idx} className="flex gap-2 items-center bg-gray-50 p-2 rounded-lg">
                <input 
                  value={p.name}
                  onChange={(e) => updatePartner(idx, 'name', e.target.value)}
                  className="flex-1 p-2 bg-white rounded border border-gray-200 text-sm outline-none"
                  placeholder="Name"
                />
                <div className="w-20 relative">
                  <input 
                    type="number"
                    value={p.percentage}
                    onChange={(e) => updatePartner(idx, 'percentage', parseFloat(e.target.value))}
                    className="w-full p-2 bg-white rounded border border-gray-200 text-sm outline-none pr-6"
                  />
                  <span className="absolute right-2 top-2 text-gray-400 text-xs">%</span>
                </div>
                <button onClick={() => removePartner(idx)} className="text-red-400 p-2">
                   <Trash2 size={16} />
                </button>
             </div>
           ))}
        </section>
        
        {/* Tax Rules */}
         <section className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <h3 className="font-bold text-gray-800 border-b pb-2">Tax Rules</h3>
          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Income Tax %</label>
               <input 
                 type="number" value={incomeTaxRate} onChange={e => setIncomeTaxRate(e.target.value)}
                 className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 outline-none"
               />
             </div>
             <div>
               <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Prop Tax %</label>
               <input 
                 type="number" value={propertyTaxRate} onChange={e => setPropertyTaxRate(e.target.value)}
                 className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 outline-none"
               />
             </div>
          </div>
        </section>

      </div>
    </div>
  );
};