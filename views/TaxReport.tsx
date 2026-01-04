import React from 'react';
import { Card } from '../components/Card';
import { Property, Transaction, CurrencyCode, Language } from '../types';
import { FileText, Globe, Calculator, Download } from 'lucide-react';
import { currencyService } from '../services/currencyService';
import { t } from '../services/translationService';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import * as XLSX from 'xlsx'; // Uses importmap version

interface TaxReportProps {
  properties: Property[];
  transactions: Transaction[];
  globalCurrency: CurrencyCode;
  lang: Language;
}

export const TaxReport: React.FC<TaxReportProps> = ({ properties, transactions, globalCurrency, lang }) => {
  
  let totalTaxLiability = 0;
  const countryIncomeMap: Record<string, number> = {};

  const breakdown = properties.map(property => {
    const propTxs = transactions.filter(t => t.propertyId === property.id);
    
    const income = propTxs.filter(t => t.type === 'income').reduce((sum, t) => {
        return sum + currencyService.convert(t.amount, property.currency, globalCurrency);
    }, 0);

    // Aggregate for Chart
    if (!countryIncomeMap[property.country]) countryIncomeMap[property.country] = 0;
    countryIncomeMap[property.country] += income;

    const opExpenses = propTxs.filter(t => t.type === 'expense' && t.category !== 'Mortgage').reduce((sum, t) => {
        return sum + currencyService.convert(t.amount, property.currency, globalCurrency);
    }, 0);
    
    const grossNoi = income - opExpenses;
    const marketValueGlobal = currencyService.convert(property.marketValue, property.currency, globalCurrency);
    const annualPropertyTax = marketValueGlobal * (property.propertyTaxRate / 100);
    const loanBalanceGlobal = currencyService.convert(property.loanBalance || 0, property.currency, globalCurrency);
    const annualMortgageInterest = loanBalanceGlobal * ((property.mortgageInterestRate || 0) / 100);
    const taxableIncome = Math.max(0, grossNoi - annualPropertyTax - annualMortgageInterest);
    const estimatedTax = taxableIncome * (property.incomeTaxRate / 100);
    
    totalTaxLiability += estimatedTax;

    return {
      Address: property.address,
      Country: property.country,
      GrossNOI: grossNoi,
      EstTax: estimatedTax,
    };
  });

  const pieData = Object.keys(countryIncomeMap).map(key => ({
    name: key, value: countryIncomeMap[key]
  }));
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const handleExport = () => {
    // 1. Prepare Data
    const data = breakdown.map(item => ({
      ...item,
      GrossNOI: currencyService.format(item.GrossNOI, globalCurrency),
      EstTax: currencyService.format(item.EstTax, globalCurrency)
    }));
    
    // 2. Create Sheet
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tax Report");
    
    // 3. Download
    XLSX.writeFile(wb, "Global_Tax_Report.xlsx");
  };

  return (
    <div className="pb-32 animate-fade-in">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('tax_report', lang)}</h1>
          <p className="text-gray-500 text-sm">{t('estimated', lang)} ({globalCurrency})</p>
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center gap-1 bg-green-600 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-sm active:scale-95"
        >
          <Download size={14} />
          {t('export_excel', lang)}
        </button>
      </header>

      {/* Summary Card */}
      <Card className="bg-gray-900 text-white border-none mb-6">
        <div className="flex items-center space-x-3 gap-3 mb-2 opacity-80">
          <Globe size={18} />
          <span className="text-sm font-medium">{t('tax_liability', lang)}</span>
        </div>
        <h2 className="text-4xl font-bold tracking-tight">
            {currencyService.format(totalTaxLiability, globalCurrency)}
        </h2>
      </Card>

      {/* Pie Chart: Income by Country */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
         <h3 className="font-bold text-gray-800 mb-2">{t('income_by_country', lang)}</h3>
         <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={30} outerRadius={60} fill="#8884d8" paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: number) => currencyService.format(val, globalCurrency)} />
              </PieChart>
            </ResponsiveContainer>
         </div>
      </div>

      {/* Breakdown List */}
      <div className="space-y-3">
        {breakdown.map((item, idx) => (
          <Card key={idx} className="p-4 flex justify-between items-center">
            <div>
              <h4 className="font-bold text-gray-800 text-sm">{item.Address}</h4>
              <p className="text-xs text-gray-500">{item.Country}</p>
            </div>
            <div className="text-right">
              <span className="block font-bold text-gray-900">
                  {currencyService.format(item.EstTax, globalCurrency)}
              </span>
              <span className="text-[10px] text-gray-400">TAX</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};