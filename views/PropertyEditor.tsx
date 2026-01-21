
import React, { useState, useEffect } from 'react';
import { Property, PropertyType, CurrencyCode, Partner, MortgageMix, PropertyUnit, Lease, Language, Company } from '../types';
import { ArrowLeft, Check, Plus, Trash2, AlertTriangle, Loader2, Layers, Landmark, Users, Briefcase } from 'lucide-react';
import { t } from '../services/translationService';

interface PropertyEditorProps {
  property?: Property | null;
  onSave: () => void;
  onCancel: () => void;
  lang: Language; 
  service: any;
}

export const PropertyEditor: React.FC<PropertyEditorProps> = ({ property, onSave, onCancel, lang, service }) => {
  const [address, setAddress] = useState('');
  const [country, setCountry] = useState('USA');
  const [type, setType] = useState<PropertyType>('Residential');
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [marketValue, setMarketValue] = useState('');
  const [incomeTaxRate, setIncomeTaxRate] = useState('25');
  const [propertyTaxRate, setPropertyTaxRate] = useState('1.0');
  const [holdingCompany, setHoldingCompany] = useState('');
  
  const [availableCompanies, setAvailableCompanies] = useState<Company[]>([]);
  
  const [bankName, setBankName] = useState('');
  const [loanBalance, setLoanBalance] = useState('');
  const [monthlyMortgage, setMonthlyMortgage] = useState('');
  const [mortgageInterestRate, setMortgageInterestRate] = useState('');
  const [mix, setMix] = useState<MortgageMix>({ fixedPercent: 100, variablePercent: 0, primePercent: 0 });
  
  const [myPercentage, setMyPercentage] = useState<number>(100);
  const [partners, setPartners] = useState<Partner[]>([]);
  
  const [units, setUnits] = useState<PropertyUnit[]>([]);
  const [isSplit, setIsSplit] = useState(false);
  const [lease, setLease] = useState<Lease>({ tenantName: '', monthlyRent: 0, expirationDate: new Date().toISOString() });

  const [errors, setErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    service.getCompanies().then(setAvailableCompanies);

    if (property) {
      setAddress(property.address);
      setCountry(property.country);
      setType(property.type);
      setCurrency(property.currency);
      setPurchasePrice(property.purchasePrice.toString());
      setMarketValue(property.marketValue.toString());
      setIncomeTaxRate(property.incomeTaxRate.toString());
      setPropertyTaxRate(property.propertyTaxRate.toString());
      setHoldingCompany(property.holdingCompany || '');
      setBankName(property.bankName || '');
      setLoanBalance(property.loanBalance?.toString() || '');
      setMonthlyMortgage(property.monthlyMortgage?.toString() || '');
      setMortgageInterestRate(property.mortgageInterestRate?.toString() || '');
      setMix(property.mortgageMix || { fixedPercent: 100, variablePercent: 0, primePercent: 0 });
      
      const me = property.partners?.find(p => p.hasAccess);
      if (me) {
        setMyPercentage(me.percentage);
        setPartners(property.partners?.filter(p => !p.hasAccess) || []);
      } else {
        setMyPercentage(100);
        setPartners([]);
      }

      setUnits(property.units || []);
      setIsSplit(!!property.units && property.units.length > 0);
      if (property.lease) setLease(property.lease);
    }
  }, [property, service]);

  const handleCompanyChange = (companyName: string) => {
    setHoldingCompany(companyName);
    const selected = availableCompanies.find(c => c.name === companyName);
    if (selected) {
      setMyPercentage(selected.userOwnership);
    }
  };

  const addPartner = () => {
    setPartners([...partners, { uid: Math.random().toString(), name: '', percentage: 0, hasAccess: false }]);
  };

  const removePartner = (idx: number) => {
    setPartners(partners.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    const newErrors: string[] = [];
    if (!address.trim()) newErrors.push("Address is required.");
    
    const partnerTotal = partners.reduce((sum, p) => sum + (p.percentage || 0), 0);
    const grandTotal = myPercentage + partnerTotal;
    
    if (grandTotal > 100) {
      newErrors.push(`Total ownership cannot exceed 100% (Currently: ${grandTotal}%)`);
    }
    
    if (newErrors.length > 0) { setErrors(newErrors); return; }

    setIsSaving(true);
    
    const finalPartners: Partner[] = [
      { uid: 'me', name: 'Me', percentage: myPercentage, hasAccess: true },
      ...partners
    ];

    const payload: Omit<Property, 'id'> = {
      userId: 'user1',
      address, country, type, currency,
      purchasePrice: parseFloat(purchasePrice) || 0,
      marketValue: parseFloat(marketValue) || 0,
      incomeTaxRate: parseFloat(incomeTaxRate) || 0,
      propertyTaxRate: parseFloat(propertyTaxRate) || 0,
      holdingCompany,
      bankName,
      loanBalance: parseFloat(loanBalance) || 0,
      monthlyMortgage: parseFloat(monthlyMortgage) || 0,
      mortgageInterestRate: parseFloat(mortgageInterestRate) || 0,
      mortgageMix: mix,
      partners: finalPartners,
      units: isSplit ? units : undefined,
      lease: isSplit ? undefined : (lease.tenantName ? lease : undefined),
      documents: property?.documents || []
    };

    try {
      if (property?.id) await service.updateProperty({ ...payload, id: property.id });
      else await service.addProperty(payload);
      onSave();
    } catch (err: any) {
      setErrors([err.message || "Failed to save."]);
    } finally { setIsSaving(false); }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 pb-32">
      <div className="bg-white p-4 border-b border-gray-200 sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={onCancel} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full"><ArrowLeft size={20} /></button>
          <h1 className="font-bold text-lg">{property ? t('edit_property', lang) : t('add_property', lang)}</h1>
        </div>
        <button onClick={handleSave} disabled={isSaving} className="bg-brand-600 text-white px-6 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-sm active:scale-95 disabled:opacity-50">
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          <span>{t('save', lang)}</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3"><AlertTriangle className="text-red-500 shrink-0" size={20} /><div className="text-xs text-red-600 font-bold">{errors.join(', ')}</div></div>
        )}

        {/* BASIC INFO */}
        <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <h3 className="font-black text-[10px] text-gray-400 uppercase tracking-widest border-b pb-2">General Info</h3>
          <div className="space-y-3">
            <input value={address} onChange={e => setAddress(e.target.value)} className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm font-medium" placeholder={t('address', lang)} />
            
            <div className="flex flex-col gap-2">
               <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{t('holding_company', lang)}</label>
               <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
                  <Briefcase size={16} className="text-gray-400 ml-2" />
                  {availableCompanies.length > 0 ? (
                    <select 
                      value={holdingCompany} 
                      onChange={e => handleCompanyChange(e.target.value)}
                      className="w-full p-2 bg-transparent outline-none text-sm font-medium appearance-none"
                    >
                      <option value="">Personal Ownership (None)</option>
                      {availableCompanies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  ) : (
                    <input 
                      value={holdingCompany} 
                      onChange={e => setHoldingCompany(e.target.value)} 
                      className="bg-transparent text-sm w-full p-2 outline-none font-medium" 
                      placeholder="Enter Holding Company Name" 
                    />
                  )}
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <select value={country} onChange={e => setCountry(e.target.value)} className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm font-medium"><option value="USA">USA</option><option value="Israel">Israel</option><option value="UK">UK</option></select>
              <select value={type} onChange={e => setType(e.target.value as PropertyType)} className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm font-medium">
                <option value="Residential">Residential</option><option value="Commercial">Commercial</option><option value="Shop">Shop</option>
              </select>
            </div>
          </div>
        </section>

        {/* OWNERSHIP & PARTNERS */}
        <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="font-black text-[10px] text-gray-400 uppercase tracking-widest flex items-center gap-2"><Users size={14} /> {t('partners', lang)}</h3>
            <button onClick={addPartner} className="text-brand-600 text-[10px] font-black uppercase tracking-widest bg-brand-50 px-2 py-1 rounded-md">+ Add Partner</button>
          </div>
          
          <div className="space-y-3">
             {/* My Share */}
             <div className="flex items-center gap-3 p-3 bg-brand-50 rounded-lg border border-brand-100">
                <div className="w-8 h-8 bg-brand-600 text-white rounded-lg flex items-center justify-center font-black text-xs">ME</div>
                <div className="flex-1">
                   <p className="text-[10px] font-black text-brand-700 uppercase tracking-widest">My Effective Share</p>
                   {holdingCompany && <p className="text-[8px] text-brand-400 font-bold">Via {holdingCompany}</p>}
                </div>
                <div className="relative w-24">
                  <input 
                    type="number" 
                    value={myPercentage} 
                    onChange={e => setMyPercentage(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white p-2 rounded-md border border-brand-200 text-sm font-black text-center"
                  />
                  <span className="absolute right-2 top-2 text-[10px] font-black text-brand-300">%</span>
                </div>
             </div>

             {/* Partner list */}
             {partners.map((p, idx) => (
                <div key={idx} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <input 
                    placeholder="Partner Name" 
                    value={p.name} 
                    onChange={e => setPartners(partners.map((item, i) => i === idx ? {...item, name: e.target.value} : item))}
                    className="flex-1 bg-white p-2 rounded-md border border-gray-200 text-xs font-medium"
                  />
                  <div className="relative w-20">
                    <input 
                      type="number" 
                      value={p.percentage || ''} 
                      onChange={e => setPartners(partners.map((item, i) => i === idx ? {...item, percentage: parseFloat(e.target.value) || 0} : item))}
                      className="w-full bg-white p-2 rounded-md border border-gray-200 text-xs font-bold text-center"
                    />
                    <span className="absolute right-2 top-2 text-[10px] text-gray-300 font-bold">%</span>
                  </div>
                  <button onClick={() => removePartner(idx)} className="text-red-400 p-1 active:scale-90 transition-transform"><Trash2 size={14} /></button>
                </div>
              ))}
          </div>
        </section>

        {/* FINANCIALS */}
        <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <h3 className="font-black text-[10px] text-gray-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2"><Landmark size={14} /> {t('financials', lang)}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] font-black text-gray-400 uppercase mb-1 block">Purchase Price</label>
              <input type="number" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm font-bold" />
            </div>
            <div>
              <label className="text-[9px] font-black text-gray-400 uppercase mb-1 block">Current Value</label>
              <input type="number" value={marketValue} onChange={e => setMarketValue(e.target.value)} className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm font-bold" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
             <div>
               <label className="text-[9px] font-black text-gray-400 uppercase mb-1 block">{t('bank_name', lang)}</label>
               <input value={bankName} onChange={e => setBankName(e.target.value)} className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm font-medium" placeholder="Bank Name" />
             </div>
             <div>
               <label className="text-[9px] font-black text-gray-400 uppercase mb-1 block">{t('loan_balance', lang)}</label>
               <input type="number" value={loanBalance} onChange={e => setLoanBalance(e.target.value)} className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm font-bold" />
             </div>
          </div>
        </section>

        {/* LEASE / UNITS */}
        <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-black text-[10px] text-gray-400 uppercase tracking-widest flex items-center gap-2"><Layers size={14} /> {t('lease_info', lang)}</h3>
              {type !== 'Residential' && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-[9px] font-black text-brand-600 uppercase tracking-widest">Multi-Unit?</span>
                  <input type="checkbox" checked={isSplit} onChange={e => setIsSplit(e.target.checked)} className="w-4 h-4 accent-brand-600" />
                </label>
              )}
            </div>
            {!isSplit ? (
              <div className="space-y-3">
                 <input value={lease.tenantName} onChange={e => setLease({...lease, tenantName: e.target.value})} placeholder={t('tenant', lang)} className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm font-medium" />
                 <div className="grid grid-cols-2 gap-4">
                    <input type="number" value={lease.monthlyRent || ''} onChange={e => setLease({...lease, monthlyRent: parseFloat(e.target.value) || 0})} placeholder={t('monthly_rent', lang)} className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm font-bold" />
                    <input type="date" value={lease.expirationDate.split('T')[0]} onChange={e => setLease({...lease, expirationDate: new Date(e.target.value).toISOString()})} className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs font-bold" />
                 </div>
              </div>
            ) : (
              <div className="space-y-4">
                {units.map((unit, idx) => (
                  <div key={unit.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3 shadow-sm">
                     <div className="flex justify-between items-center">
                        <input value={unit.name} onChange={e => setUnits(units.map(u => u.id === unit.id ? {...u, name: e.target.value} : u))} className="bg-transparent font-black text-xs outline-none text-gray-800" placeholder="Unit Name" />
                        <button onClick={() => setUnits(units.filter(u => u.id !== unit.id))} className="text-red-400 p-1 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                        <input value={unit.lease?.tenantName || ''} onChange={e => setUnits(units.map(u => u.id === unit.id ? {...u, lease: {...u.lease!, tenantName: e.target.value}} : u))} placeholder="Tenant" className="p-2.5 bg-white rounded-md border border-gray-200 text-[10px] font-medium" />
                        <input type="number" value={unit.lease?.monthlyRent || ''} onChange={e => setUnits(units.map(u => u.id === unit.id ? {...u, lease: {...u.lease!, monthlyRent: parseFloat(e.target.value) || 0}} : u))} placeholder="Rent" className="p-2.5 bg-white rounded-md border border-gray-200 text-[10px] font-bold" />
                     </div>
                  </div>
                ))}
                <button onClick={() => setUnits([...units, {id: Date.now().toString(), name: `Unit ${units.length + 1}`, lease: {tenantName: '', monthlyRent: 0, expirationDate: new Date().toISOString()}}])} className="w-full py-4 border-2 border-dashed border-gray-200 rounded-xl text-[10px] font-black text-gray-400 uppercase tracking-widest hover:border-brand-200 hover:text-brand-500 transition-colors">+ Add New Unit</button>
              </div>
            )}
        </section>
      </div>
    </div>
  );
};
