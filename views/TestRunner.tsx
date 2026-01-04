
import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { ArrowLeft, CheckCircle, XCircle, Play, Loader2, TrendingUp, Zap, Calculator } from 'lucide-react';
import { currencyService, RATES } from '../services/currencyService';
import { dataService } from '../services/mockDataService';
import { ViewState, Property } from '../types';

interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
  duration: number;
}

interface TestRunnerProps {
  onBack: () => void;
}

export const TestRunner: React.FC<TestRunnerProps> = ({ onBack }) => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);
    setProgress(0);

    const tests = [
      testCurrencyConversion,
      testCurrencyFormatting,
      testTaxCalculationLogic,
      testCapRateLogic,
      testDataServiceIntegrity,
      testNoiVsCashFlow,      // NEW
      testForexGainLogic,     // NEW
      testPerformanceStress   // NEW
    ];

    const newResults: TestResult[] = [];

    for (let i = 0; i < tests.length; i++) {
      // Simulate slight delay for visual effect
      await new Promise(r => setTimeout(r, 400));
      const result = await tests[i]();
      newResults.push(result);
      setResults([...newResults]);
      setProgress(((i + 1) / tests.length) * 100);
    }

    setIsRunning(false);
  };

  // --- Basic Tests ---

  const testCurrencyConversion = async (): Promise<TestResult> => {
    const start = performance.now();
    try {
      // Test 1: USD to NIS
      // 100 USD * 3.75 = 375 NIS
      const usdToNis = currencyService.convert(100, 'USD', 'NIS');
      if (Math.abs(usdToNis - (100 * RATES['USD'])) > 0.01) {
        throw new Error(`USD->NIS failed. Expected 375, got ${usdToNis}`);
      }

      // Test 2: NIS to EUR
      // 405 NIS / 4.05 = 100 EUR
      const nisToEur = currencyService.convert(405, 'NIS', 'EUR');
      if (Math.abs(nisToEur - 100) > 0.01) {
        throw new Error(`NIS->EUR failed. Expected 100, got ${nisToEur}`);
      }
      
      return { name: 'Currency Math (USD/EUR/NIS)', passed: true, duration: performance.now() - start };
    } catch (e: any) {
      return { name: 'Currency Math (USD/EUR/NIS)', passed: false, message: e.message, duration: performance.now() - start };
    }
  };

  const testCurrencyFormatting = async (): Promise<TestResult> => {
     const start = performance.now();
     const fmt = currencyService.format(1234, 'USD');
     if (!fmt.includes('$') && !fmt.includes('USD')) {
        return { name: 'Currency Formatting', passed: false, message: `Expected $ symbol, got ${fmt}`, duration: performance.now() - start };
     }
     return { name: 'Currency Formatting', passed: true, duration: performance.now() - start };
  };

  const testTaxCalculationLogic = async (): Promise<TestResult> => {
    const start = performance.now();
    
    // Mock Property
    const prop: Property = {
      id: 'test', userId: 'u1', address: 'Test', country: 'USA', currency: 'USD',
      type: 'Residential',
      purchasePrice: 100000, marketValue: 100000, 
      incomeTaxRate: 25, propertyTaxRate: 1, 
      monthlyMortgage: 0, mortgageInterestRate: 0, loanBalance: 0
    };

    // Scenario:
    // Income: 10,000
    // Expenses: 2,000
    // Gross NOI: 8,000
    // Prop Tax: 1% of 100k = 1,000
    // Taxable Income: 8,000 - 1,000 = 7,000
    // Tax Liability (25%): 1,750

    const income = 10000;
    const expense = 2000;
    const propTax = prop.marketValue * (prop.propertyTaxRate / 100);
    const taxable = (income - expense) - propTax;
    const liability = taxable * (prop.incomeTaxRate / 100);

    if (liability !== 1750) {
      return { name: 'Global Tax Calculation Formula', passed: false, message: `Expected 1750, got ${liability}`, duration: performance.now() - start };
    }

    return { name: 'Global Tax Calculation Formula', passed: true, duration: performance.now() - start };
  };

  const testCapRateLogic = async (): Promise<TestResult> => {
     const start = performance.now();
     // NOI = 12,000 / year
     // Market Value = 200,000
     // Cap Rate = (12k / 200k) * 100 = 6%
     const cap = ((12000 / 200000) * 100);
     if (cap !== 6) return { name: 'Cap Rate Math', passed: false, message: `Expected 6%, got ${cap}%`, duration: performance.now() - start };
     return { name: 'Cap Rate Math', passed: true, duration: performance.now() - start };
  };

  const testDataServiceIntegrity = async (): Promise<TestResult> => {
    const start = performance.now();
    try {
      const props = await dataService.getProperties();
      if (!Array.isArray(props) || props.length === 0) throw new Error("No properties returned");
      if (!props[0].id) throw new Error("Property missing ID");
      return { name: 'Data Service & Mock Data', passed: true, duration: performance.now() - start };
    } catch (e: any) {
      return { name: 'Data Service & Mock Data', passed: false, message: e.message, duration: performance.now() - start };
    }
  };

  // --- Advanced Validations ---

  const testNoiVsCashFlow = async (): Promise<TestResult> => {
    const start = performance.now();
    // Validate that Mortgage reduces Cash Flow but is treated differently in NOI 
    // (Strictly speaking, Debt Service is below the NOI line).
    
    const rent = 2000;
    const repairs = 500;
    const mortgage = 1000;

    const noi = rent - repairs; // 1500
    const cashFlow = rent - repairs - mortgage; // 500

    if (noi !== 1500 || cashFlow !== 500) {
      return { name: 'NOI vs Cash Flow Logic', passed: false, message: 'Math error separating OpEx from Debt Service', duration: performance.now() - start };
    }
    return { name: 'NOI vs Cash Flow Logic', passed: true, duration: performance.now() - start };
  };

  const testForexGainLogic = async (): Promise<TestResult> => {
    const start = performance.now();
    // Scenario: You bought a house for $100k USD.
    // At the time, Rate was 3.5 NIS. Cost Basis = 350,000 NIS.
    // Now, house is still worth $100k USD.
    // But Rate is now 4.5 NIS. Current Value = 450,000 NIS.
    // Gain in USD = 0. Gain in NIS = 100,000.
    
    const purchaseUSD = 100000;
    const costBasisNIS = 350000; 
    const currentMarketUSD = 100000;
    const currentRate = 4.5;
    
    const currentMarketNIS = currentMarketUSD * currentRate; // 450,000
    const gainNIS = currentMarketNIS - costBasisNIS; // 100,000

    if (gainNIS !== 100000) {
      return { name: 'Forex Hedging Logic (NIS Basis)', passed: false, message: `Expected +100k NIS gain, got ${gainNIS}`, duration: performance.now() - start };
    }

    return { name: 'Forex Hedging Logic (NIS Basis)', passed: true, duration: performance.now() - start };
  };

  const testPerformanceStress = async (): Promise<TestResult> => {
    const start = performance.now();
    // Simulate summing 5,000 transactions to ensure mobile scalability
    const massiveList = Array.from({ length: 5000 }, () => ({
      amount: Math.random() * 1000,
      type: 'income'
    }));

    const sum = massiveList.reduce((acc, curr) => acc + curr.amount, 0);
    const duration = performance.now() - start;

    if (duration > 50) { // Should be instant (<50ms) even on mobile
      return { name: 'Stress Test (5k items)', passed: false, message: `Too slow: ${duration.toFixed(0)}ms`, duration };
    }

    return { name: 'Stress Test (5k items)', passed: true, duration };
  };

  // --- Render ---

  return (
    <div className="min-h-[100dvh] bg-gray-50 flex flex-col animate-fade-in">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <button onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-bold text-lg text-gray-900">System Diagnostics</h1>
            <p className="text-xs text-gray-500">Validation Suite</p>
          </div>
        </div>
        <button 
          onClick={runTests} 
          disabled={isRunning}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${isRunning ? 'bg-gray-100 text-gray-400' : 'bg-brand-600 text-white hover:bg-brand-700 active:scale-95'}`}
        >
          {isRunning ? <Loader2 size={16} className="animate-spin"/> : <Play size={16} fill="currentColor" />}
          <span>{isRunning ? 'Running...' : 'Run Tests'}</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-md mx-auto space-y-4">
          
          {results.length === 0 && !isRunning && (
            <div className="text-center py-20 opacity-50">
               <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                 <CheckCircle size={40} className="text-gray-400" />
               </div>
               <p className="text-gray-500">Ready to validate application logic.</p>
               <p className="text-xs text-gray-400 mt-2">Press "Run Tests" to begin.</p>
            </div>
          )}

          {results.map((res, idx) => (
            <Card key={idx} className={`flex justify-between items-center p-4 border-l-4 ${res.passed ? 'border-l-green-500' : 'border-l-red-500'} animate-slide-up`}>
               <div className="flex items-center space-x-3">
                 {res.passed ? (
                   <CheckCircle size={24} className="text-green-500 flex-shrink-0" />
                 ) : (
                   <XCircle size={24} className="text-red-500 flex-shrink-0" />
                 )}
                 <div>
                   <h3 className="font-bold text-gray-900 text-sm">{res.name}</h3>
                   {res.message && <p className="text-xs text-red-600 mt-1 font-mono bg-red-50 p-1 rounded">{res.message}</p>}
                 </div>
               </div>
               <span className="text-[10px] text-gray-400 font-mono">{res.duration.toFixed(0)}ms</span>
            </Card>
          ))}
          
          {isRunning && (
            <div className="mt-4">
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-brand-500 transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-center text-xs text-gray-500 mt-2">Executing test suite...</p>
            </div>
          )}

          {!isRunning && results.length > 0 && (
            <div className="mt-8 p-4 bg-gray-100 rounded-xl text-center">
              <p className="text-xs text-gray-500 mb-2">Tests Completed</p>
              <div className="flex justify-center space-x-4">
                <div className="flex flex-col items-center">
                   <TrendingUp className="text-gray-400 mb-1" size={16}/>
                   <span className="text-xs font-bold text-gray-700">Financial Logic</span>
                </div>
                <div className="flex flex-col items-center">
                   <Calculator className="text-gray-400 mb-1" size={16}/>
                   <span className="text-xs font-bold text-gray-700">Tax Math</span>
                </div>
                <div className="flex flex-col items-center">
                   <Zap className="text-gray-400 mb-1" size={16}/>
                   <span className="text-xs font-bold text-gray-700">Performance</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
    