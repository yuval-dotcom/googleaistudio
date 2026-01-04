
import React, { useState, useRef, useEffect } from 'react';
import { Property, Language, Transaction, PropertyDocument } from '../types';
import { currencyService } from '../services/currencyService';
import { ArrowLeft, ArrowUpRight, ArrowDownRight, FileText, Loader2, ExternalLink, Trash2, X, Upload, Pencil, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { t } from '../services/translationService';

interface PropertyDetailProps {
  property: Property;
  onBack: () => void;
  lang: Language;
  onEdit?: () => void;
  onUpdate?: (updatedProperty: Property) => void; 
  service: any; // Dynamic service (Supabase or Mock)
}

type Tab = 'overview' | 'financials' | 'partners' | 'docs' | 'transactions';

export const PropertyDetail: React.FC<PropertyDetailProps> = ({ property, onBack, lang, onEdit, onUpdate, service }) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isUploading, setIsUploading] = useState(false);
  const [localProperty, setLocalProperty] = useState<Property>(property);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTxs, setIsLoadingTxs] = useState(false);
  
  // States for deletions
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  const [docError, setDocError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalProperty(property);
  }, [property]);

  useEffect(() => {
    if (activeTab === 'transactions') {
      loadTransactions();
    }
  }, [activeTab]);

  const loadTransactions = async () => {
    setIsLoadingTxs(true);
    try {
      const allTxs = await service.getTransactions();
      const filtered = allTxs.filter((tx: Transaction) => tx.propertyId === localProperty.id);
      setTransactions(filtered);
    } catch (err) {
      console.error("Failed to load txs", err);
    } finally {
      setIsLoadingTxs(false);
    }
  };

  const mixData = property.mortgageMix ? [
    { name: t('fixed', lang), value: property.mortgageMix.fixedPercent, color: '#10B981' }, 
    { name: t('variable', lang), value: property.mortgageMix.variablePercent, color: '#F59E0B' }, 
    { name: t('prime', lang), value: property.mortgageMix.primePercent, color: '#3B82F6' },
  ].filter(d => d.value > 0) : [];

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setDocError(null);
    try {
      const newDoc = await service.uploadFile(file, localProperty.id);
      const updatedDocs = [...(localProperty.documents || []), newDoc];
      const updatedProperty = { ...localProperty, documents: updatedDocs };
      
      await service.updateProperty(updatedProperty);
      
      setLocalProperty(updatedProperty);
      if (onUpdate) onUpdate(updatedProperty);

    } catch (err: any) {
      console.error("[PropertyDetail] Upload Failed:", err);
      setDocError("Upload failed: " + (err.message || "Unknown error"));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteDoc = async (doc: PropertyDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault(); 
    
    if (confirmDeleteId !== doc.id) {
      setConfirmDeleteId(doc.id);
      setDocError(null);
      setTimeout(() => setConfirmDeleteId(current => current === doc.id ? null : current), 3000);
      return;
    }

    setDeletingId(doc.id);
    setConfirmDeleteId(null);

    const originalDocs = localProperty.documents || [];
    const updatedDocs = originalDocs.filter(d => d.id !== doc.id);
    const updatedProperty = { ...localProperty, documents: updatedDocs };

    try {
      await service.deleteStorageFile(doc);
      await service.updateProperty(updatedProperty);
      setLocalProperty(updatedProperty);
      if (onUpdate) onUpdate(updatedProperty);
    } catch (err: any) {
      console.error("[PropertyDetail] Delete Failed:", err);
      setDocError("Delete Error: " + (err.message || "Check storage permissions."));
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteTx = async (txId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDeleteId !== txId) {
      setConfirmDeleteId(txId);
      setTimeout(() => setConfirmDeleteId(current => current === txId ? null : current), 3000);
      return;
    }

    setDeletingId(txId);
    setConfirmDeleteId(null);

    try {
      await service.deleteTransaction(txId);
      setTransactions(prev => prev.filter(t => t.id !== txId));
    } catch (err: any) {
      console.error("Failed to delete transaction", err);
      alert("Failed to delete transaction.");
    } finally {
      setDeletingId(null);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-3">{t('lease_expires', lang)}</h3>
              {property.lease ? (
                 <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-semibold">{new Date(property.lease.expirationDate).toLocaleDateString()}</p>
                      <p className="text-xs text-gray-500">{t('tenant', lang)}: {property.lease.tenantName}</p>
                    </div>
                    <div className="text-right">
                       <p className="font-bold text-brand-600">{currencyService.format(property.lease.monthlyRent, property.currency)}</p>
                       <p className="text-[10px] text-gray-400 uppercase">{t('monthly_rent', lang)}</p>
                    </div>
                 </div>
              ) : (
                <p className="text-gray-400 text-sm italic">No lease active</p>
              )}
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-2">{t('address', lang)}</h3>
              <p className="text-gray-600">{property.address}, {property.country}</p>
              <div className="mt-2 inline-block px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                {property.type || 'Residential'}
              </div>
            </div>
             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-2">Valuation</h3>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Purchase Price:</span>
                <span className="font-medium">{currencyService.format(property.purchasePrice, property.currency)}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-500">Market Value:</span>
                <span className="font-bold text-brand-600">{currencyService.format(property.marketValue, property.currency)}</span>
              </div>
            </div>
          </div>
        );
      case 'financials':
        return (
          <div className="space-y-4 animate-fade-in">
             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4">{t('mortgage_mix', lang)}</h3>
                {mixData.length > 0 ? (
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={mixData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="value">
                          {mixData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-center text-gray-400 text-sm py-10">No Mortgage Data</p>
                )}
                {property.bankName && (
                  <div className="mt-2 text-center text-xs text-gray-500 font-medium bg-gray-50 p-2 rounded">
                    Lender: {property.bankName}
                  </div>
                )}
             </div>
          </div>
        );
      case 'partners':
        return (
           <div className="space-y-3 animate-fade-in">
             {property.partners?.map((p, idx) => (
               <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-xs">
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-900">{p.name}</p>
                      <p className="text-[10px] text-gray-400">{p.uid === property.userId ? 'Owner' : 'Investor'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-gray-800">{p.percentage}%</span>
                  </div>
               </div>
             ))}
           </div>
        );
      case 'docs':
        return (
          <div className="animate-fade-in space-y-4">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-dashed border-gray-300 text-center">
               <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,application/pdf" />
               {isUploading ? (
                 <div className="flex flex-col items-center justify-center py-4">
                    <Loader2 className="animate-spin text-brand-600 mb-2" size={32} />
                    <span className="text-sm text-gray-500">Uploading...</span>
                 </div>
               ) : (
                 <div onClick={handleFileClick} className="cursor-pointer group">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-brand-50 transition-colors">
                      <Upload className="text-gray-400 group-hover:text-brand-600" size={24} />
                    </div>
                    <h4 className="font-bold text-gray-800 text-sm">Upload Document</h4>
                 </div>
               )}
            </div>
            <div className="grid grid-cols-2 gap-3">
               {localProperty.documents?.map((doc) => (
                 <div key={doc.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative group">
                    <a href={doc.url} target="_blank" rel="noreferrer" className="block aspect-square bg-gray-50 flex items-center justify-center relative overflow-hidden">
                       {doc.type === 'image' ? <img src={doc.url} className="w-full h-full object-cover" /> : <FileText size={32} className="text-gray-400" />}
                       <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <ExternalLink className="text-white" size={24} />
                       </div>
                    </a>
                    <div className="p-2 flex items-start justify-between gap-2 bg-white">
                       <div className="min-w-0 flex-1">
                           <p className="text-xs font-semibold text-gray-800 truncate">{doc.name}</p>
                           <p className="text-[10px] text-gray-400">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
                       </div>
                       <button onClick={(e) => handleDeleteDoc(doc, e)} className={`p-2 rounded-lg transition-all ${confirmDeleteId === doc.id ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-red-600'}`}>
                         {deletingId === doc.id ? <Loader2 size={16} className="animate-spin" /> : confirmDeleteId === doc.id ? <span className="text-[8px] font-bold">CONFIRM</span> : <Trash2 size={16} />}
                       </button>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        );
      case 'transactions':
        return (
          <div className="animate-fade-in space-y-3">
             {isLoadingTxs ? (
               <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-brand-500" /></div>
             ) : transactions.length === 0 ? (
               <p className="text-center text-gray-400 text-sm py-10 italic">No transactions recorded for this property.</p>
             ) : (
               transactions.map(tx => (
                 <div key={tx.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center group">
                    <div className="flex items-center gap-3">
                       <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'income' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                          {tx.type === 'income' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                       </div>
                       <div>
                          <p className="font-bold text-gray-900 text-sm">{tx.category}</p>
                          <p className="text-[10px] text-gray-400">{new Date(tx.date).toLocaleDateString()}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-3">
                       <span className={`font-bold text-sm ${tx.type === 'income' ? 'text-green-600' : 'text-gray-900'}`}>
                          {tx.type === 'income' ? '+' : '-'}{currencyService.format(tx.amount, localProperty.currency)}
                       </span>
                       <button 
                         onClick={(e) => handleDeleteTx(tx.id, e)}
                         className={`p-2 rounded-lg transition-all ${confirmDeleteId === tx.id ? 'bg-red-600 text-white' : 'text-gray-300 hover:text-red-500 hover:bg-red-50'}`}
                       >
                         {deletingId === tx.id ? <Loader2 size={14} className="animate-spin" /> : confirmDeleteId === tx.id ? <span className="text-[8px] font-bold">YES</span> : <Trash2 size={14} />}
                       </button>
                    </div>
                 </div>
               ))
             )}
          </div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 pb-32">
       <div className="bg-white p-4 border-b border-gray-200 sticky top-0 z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="font-bold text-lg leading-none">{property.address}</h1>
              <span className="text-xs text-gray-500">{property.country}</span>
            </div>
          </div>
          <button onClick={onEdit} className="p-2 text-brand-600 hover:bg-brand-50 rounded-full">
             <Pencil size={20} />
          </button>
       </div>

       <div className="flex bg-white border-b border-gray-200 sticky top-[60px] z-10 overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveTab('overview')} className={`flex-1 min-w-[80px] py-3 text-xs font-bold border-b-2 transition-colors ${activeTab === 'overview' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-400'}`}>{t('overview', lang)}</button>
          <button onClick={() => setActiveTab('financials')} className={`flex-1 min-w-[80px] py-3 text-xs font-bold border-b-2 transition-colors ${activeTab === 'financials' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-400'}`}>{t('financials', lang)}</button>
          <button onClick={() => setActiveTab('partners')} className={`flex-1 min-w-[80px] py-3 text-xs font-bold border-b-2 transition-colors ${activeTab === 'partners' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-400'}`}>{t('partners', lang)}</button>
          <button onClick={() => setActiveTab('docs')} className={`flex-1 min-w-[80px] py-3 text-xs font-bold border-b-2 transition-colors ${activeTab === 'docs' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-400'}`}>{t('docs', lang)}</button>
          <button onClick={() => setActiveTab('transactions')} className={`flex-1 min-w-[80px] py-3 text-xs font-bold border-b-2 transition-colors ${activeTab === 'transactions' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-400'}`}>{t('transactions', lang)}</button>
       </div>

       <div className="p-4 flex-1 overflow-y-auto">
         {renderContent()}
       </div>
    </div>
  );
};
