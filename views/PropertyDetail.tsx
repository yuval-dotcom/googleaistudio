
import React, { useState, useRef, useEffect } from 'react';
import { Property, Language, Transaction, PropertyDocument, PropertyUnit } from '../types';
import { currencyService } from '../services/currencyService';
import { ArrowLeft, ArrowUpRight, ArrowDownRight, FileText, Loader2, ExternalLink, Trash2, X, Upload, Pencil, AlertCircle, Layers, User, CreditCard, History, Users, Plus } from 'lucide-react';
import { t } from '../services/translationService';
import { Card } from '../components/Card';

interface PropertyDetailProps {
  property: Property;
  onBack: () => void;
  lang: Language;
  onEdit?: () => void;
  onUpdate?: (updatedProperty: Property) => void; 
  service: any;
}

type Tab = 'overview' | 'financials' | 'partners' | 'docs' | 'transactions';

export const PropertyDetail: React.FC<PropertyDetailProps> = ({ property, onBack, lang, onEdit, onUpdate, service }) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isUploading, setIsUploading] = useState(false);
  const [localProperty, setLocalProperty] = useState<Property>(property);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTxs, setIsLoadingTxs] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [docError, setDocError] = useState<string | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [loadingUrls, setLoadingUrls] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { 
    setLocalProperty(property); 
    if (activeTab === 'transactions') {
      fetchTransactions();
    }
    if (activeTab === 'docs') {
      refreshSignedUrls();
    }
  }, [property, activeTab]);

  const refreshSignedUrls = async () => {
    const docs = localProperty.documents || [];
    if (docs.length === 0) return;

    docs.forEach(async (doc) => {
      if (!doc.path || signedUrls[doc.id]) return;
      
      setLoadingUrls(prev => ({ ...prev, [doc.id]: true }));
      try {
        const url = await service.getSignedUrl(doc.path);
        setSignedUrls(prev => ({ ...prev, [doc.id]: url }));
      } catch (e) {
        console.error(`Failed to sign URL for ${doc.name}`, e);
      } finally {
        setLoadingUrls(prev => ({ ...prev, [doc.id]: false }));
      }
    });
  };

  const fetchTransactions = async () => {
    setIsLoadingTxs(true);
    try {
      const all = await service.getTransactions();
      const filtered = all.filter((tx: Transaction) => tx.propertyId === property.id);
      setTransactions(filtered);
    } catch (e) {
      console.error("Failed to fetch transactions", e);
    } finally {
      setIsLoadingTxs(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setDocError(null);
    try {
      const newDoc = await service.uploadFile(file, property.id);
      
      // Immediately get a signed URL for the new file
      if (newDoc.path) {
        const url = await service.getSignedUrl(newDoc.path);
        setSignedUrls(prev => ({ ...prev, [newDoc.id]: url }));
      }

      const updatedDocs = [...(localProperty.documents || []), newDoc];
      const updatedProperty = { ...localProperty, documents: updatedDocs };
      
      await service.updateProperty(updatedProperty);
      setLocalProperty(updatedProperty);
      if (onUpdate) onUpdate(updatedProperty);
    } catch (err: any) {
      setDocError(err.message || "Upload failed. Ensure the bucket is created in Supabase.");
    } finally {
      setIsUploading(false);
    }
  };

  const deleteDoc = async (doc: PropertyDocument) => {
    setDeletingId(doc.id);
    try {
      await service.deleteStorageFile(doc);
      const updatedDocs = (localProperty.documents || []).filter(d => d.id !== doc.id);
      const updatedProperty = { ...localProperty, documents: updatedDocs };
      await service.updateProperty(updatedProperty);
      setLocalProperty(updatedProperty);
      if (onUpdate) onUpdate(updatedProperty);
    } catch (e) {
      console.error("Delete failed", e);
    } finally {
      setDeletingId(null);
    }
  };

  const totalMonthlyRent = localProperty.units && localProperty.units.length > 0
    ? localProperty.units.reduce((sum, u) => sum + (u.lease?.monthlyRent || 0), 0)
    : (localProperty.lease?.monthlyRent || 0);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800">{localProperty.units && localProperty.units.length > 0 ? 'Sub-Units & Tenants' : 'Lease Info'}</h3>
                <div className="text-right">
                   <p className="font-bold text-brand-600 leading-none">{currencyService.format(totalMonthlyRent, localProperty.currency)}</p>
                   <p className="text-[9px] text-gray-400 uppercase font-black">Total Rent</p>
                </div>
              </div>

              {localProperty.units && localProperty.units.length > 0 ? (
                <div className="space-y-3">
                  {localProperty.units.map((unit) => (
                    <div key={unit.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex justify-between items-center">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-brand-600 shadow-sm border border-gray-100">
                             <Layers size={16} />
                          </div>
                          <div>
                             <p className="text-xs font-bold text-gray-900">{unit.name}</p>
                             <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                <User size={10} /> {unit.lease?.tenantName || 'Vacant'}
                             </div>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-xs font-bold text-gray-800">{currencyService.format(unit.lease?.monthlyRent || 0, localProperty.currency)}</p>
                          <p className="text-[9px] text-gray-400">{unit.lease ? new Date(unit.lease.expirationDate).toLocaleDateString() : '-'}</p>
                       </div>
                    </div>
                  ))}
                </div>
              ) : localProperty.lease ? (
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                   <div>
                     <p className="text-sm font-semibold">{localProperty.lease.tenantName}</p>
                     <p className="text-xs text-gray-500">Expires: {new Date(localProperty.lease.expirationDate).toLocaleDateString()}</p>
                   </div>
                   <div className="text-right">
                     <p className="text-sm font-bold text-gray-800">{currencyService.format(localProperty.lease.monthlyRent, localProperty.currency)}</p>
                     <p className="text-[10px] text-gray-400">Monthly</p>
                   </div>
                </div>
              ) : (
                <p className="text-gray-400 text-sm italic">No lease active</p>
              )}
            </div>

            <Card className="p-4">
              <h3 className="font-bold text-gray-800 mb-2">{t('address', lang)}</h3>
              <p className="text-gray-600 text-sm">{localProperty.address}, {localProperty.country}</p>
              <div className="mt-2 inline-block px-2 py-1 bg-gray-100 rounded text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                {localProperty.type}
              </div>
            </Card>
          </div>
        );

      case 'financials':
        return (
          <div className="space-y-4 animate-fade-in">
            <Card className="bg-brand-600 text-white border-none">
              <p className="text-[10px] font-black uppercase opacity-70 mb-1">Estimated ROI (Cap Rate)</p>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-black">
                  {localProperty.marketValue > 0 ? ((totalMonthlyRent * 12 / localProperty.marketValue) * 100).toFixed(1) : '0.0'}%
                </span>
                <ArrowUpRight size={20} className="mb-1" />
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Monthly Mortgage</p>
                <p className="text-lg font-bold text-red-600">{currencyService.format(localProperty.monthlyMortgage || 0, localProperty.currency)}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Loan Balance</p>
                <p className="text-lg font-bold text-gray-800">{currencyService.format(localProperty.loanBalance || 0, localProperty.currency)}</p>
              </div>
            </div>
          </div>
        );

      case 'partners':
        return (
          <div className="space-y-4 animate-fade-in">
             <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Users size={16} /> Ownership Structure</h3>
                <div className="space-y-3">
                  {(localProperty.partners || [{uid: 'me', name: 'Me (Sole Owner)', percentage: 100, hasAccess: true}]).map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border border-gray-200 text-gray-400">
                             <User size={16} />
                          </div>
                          <span className="text-sm font-bold text-gray-700">{p.name}</span>
                       </div>
                       <span className="text-sm font-black text-brand-600">{p.percentage}%</span>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        );

      case 'docs':
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="flex justify-between items-center mb-2">
               <h3 className="font-bold text-gray-800 flex items-center gap-2"><FileText size={18} /> Documents</h3>
               <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="text-xs font-bold text-brand-600 flex items-center gap-1 bg-brand-50 px-3 py-1.5 rounded-full active:scale-95 transition-all"
               >
                 {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                 <span>Upload</span>
               </button>
               <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
            </div>

            {docError && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs flex items-center gap-2 border border-red-100">
                <AlertCircle size={14} /> <span>{docError}</span>
              </div>
            )}

            <div className="space-y-3">
              {(localProperty.documents || []).length === 0 ? (
                <div className="text-center py-10 opacity-30">
                  <FileText size={48} className="mx-auto mb-2" />
                  <p className="text-xs font-bold uppercase tracking-widest">No documents yet</p>
                </div>
              ) : (
                localProperty.documents?.map(doc => {
                  const isLinkLoading = loadingUrls[doc.id];
                  const docUrl = signedUrls[doc.id] || doc.url;

                  return (
                    <div key={doc.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                          <FileText size={20} />
                        </div>
                        <div className="max-w-[150px]">
                          <p className="text-xs font-bold text-gray-900 truncate">{doc.name}</p>
                          <p className="text-[10px] text-gray-400">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isLinkLoading ? (
                          <div className="p-2"><Loader2 size={16} className="animate-spin text-gray-300" /></div>
                        ) : (
                          <a 
                            href={docUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className={`p-2 rounded-lg transition-colors ${docUrl ? 'text-gray-400 hover:text-brand-600 hover:bg-brand-50' : 'text-gray-200 cursor-not-allowed'}`}
                          >
                            <ExternalLink size={16} />
                          </a>
                        )}
                        <button 
                          onClick={() => deleteDoc(doc)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          {deletingId === doc.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 flex gap-2">
               <AlertCircle size={14} className="text-blue-500 shrink-0 mt-0.5" />
               <p className="text-[10px] text-blue-600 leading-tight">Your documents are stored in a private secure bucket. View links expire after 1 hour for your safety.</p>
            </div>
          </div>
        );

      case 'transactions':
        return (
          <div className="space-y-4 animate-fade-in">
             <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-gray-800 flex items-center gap-2"><History size={18} /> Property Ledger</h3>
                <span className="text-[10px] font-black text-gray-400 uppercase">{transactions.length} items</span>
             </div>

             {isLoadingTxs ? (
               <div className="flex justify-center py-10"><Loader2 className="animate-spin text-brand-600" /></div>
             ) : transactions.length === 0 ? (
               <div className="text-center py-10 opacity-30">
                 <CreditCard size={48} className="mx-auto mb-2" />
                 <p className="text-xs font-bold uppercase tracking-widest">No transactions recorded</p>
               </div>
             ) : (
               <div className="space-y-2">
                 {transactions.map(tx => (
                   <div key={tx.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
                      <div className="flex items-center gap-3">
                         <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.type === 'income' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                            {tx.type === 'income' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                         </div>
                         <div>
                            <p className="text-xs font-bold text-gray-900">{tx.category}</p>
                            <p className="text-[9px] text-gray-400">{new Date(tx.date).toLocaleDateString()}</p>
                         </div>
                      </div>
                      <span className={`text-sm font-black ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.type === 'income' ? '+' : '-'}{currencyService.format(tx.amount, localProperty.currency)}
                      </span>
                   </div>
                 ))}
               </div>
             )}
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 pb-32">
       <div className="bg-white p-4 border-b border-gray-200 sticky top-0 z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full"><ArrowLeft size={20} /></button>
            <div>
              <h1 className="font-bold text-lg leading-none truncate max-w-[200px]">{localProperty.address}</h1>
              <span className="text-xs text-gray-500">{localProperty.country}</span>
            </div>
          </div>
          <button onClick={onEdit} className="p-2 text-brand-600 hover:bg-brand-50 rounded-full"><Pencil size={20} /></button>
       </div>
       <div className="flex bg-white border-b border-gray-200 sticky top-[60px] z-20 overflow-x-auto no-scrollbar shadow-sm">
          {[
            {key: 'overview', label: t('overview', lang)}, 
            {key: 'financials', label: t('financials', lang)}, 
            {key: 'partners', label: t('partners', lang)}, 
            {key: 'docs', label: t('docs', lang)}, 
            {key: 'transactions', label: t('transactions', lang)}
          ].map(tab => (
            <button 
              key={tab.key} 
              onClick={() => setActiveTab(tab.key as Tab)} 
              className={`flex-1 min-w-[80px] py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${
                activeTab === tab.key 
                  ? 'border-brand-600 text-brand-600 bg-brand-50/30' 
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
       </div>
       <div className="p-4 flex-1 overflow-y-auto no-scrollbar">
         {renderContent()}
       </div>
    </div>
  );
};
