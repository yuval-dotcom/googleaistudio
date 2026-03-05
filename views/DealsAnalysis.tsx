import React, { useEffect, useState } from 'react';
import { CurrencyCode, Language, DealWithMetrics } from '../types';
import { currencyService } from '../services/currencyService';
import { ArrowLeft, LineChart, Loader2 } from 'lucide-react';

interface DealsAnalysisProps {
  lang: Language;
  globalCurrency: CurrencyCode;
  onBack: () => void;
  service: any;
}

export const DealsAnalysis: React.FC<DealsAnalysisProps> = ({
  lang,
  globalCurrency,
  onBack,
  service,
}) => {
  const [deals, setDeals] = useState<DealWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [name, setName] = useState('');
  const [assetType, setAssetType] = useState('Commercial');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [equityAmount, setEquityAmount] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [expectedRent, setExpectedRent] = useState('');
  const [operatingExpenses, setOperatingExpenses] = useState('');
  const [expectedOccupancy, setExpectedOccupancy] = useState('0.95');
  const [location, setLocation] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (typeof service.getDeals !== 'function') {
        setLoading(false);
        setError('Deal analysis is only available with the Node API backend.');
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const data = await service.getDeals();
        if (!cancelled) setDeals(data || []);
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to load deals');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [service]);

  const handleCreate = async () => {
    if (!name.trim() || !purchasePrice || !equityAmount) return;
    if (typeof service.createDeal !== 'function') return;
    setCreating(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        assetType,
        purchasePrice: Number(purchasePrice),
        equityAmount: Number(equityAmount),
        loanAmount: loanAmount ? Number(loanAmount) : undefined,
        expectedRent: expectedRent ? Number(expectedRent) : undefined,
        operatingExpenses: operatingExpenses ? Number(operatingExpenses) : undefined,
        expectedOccupancy: expectedOccupancy ? Number(expectedOccupancy) : undefined,
        location: location || undefined,
      };
      const result: DealWithMetrics = await service.createDeal(payload);
      setDeals((prev) => [result, ...prev]);
      setName('');
      setPurchasePrice('');
      setEquityAmount('');
      setLoanAmount('');
      setExpectedRent('');
      setOperatingExpenses('');
      setExpectedOccupancy('0.95');
      setLocation('');
    } catch (e: any) {
      setError(e.message || 'Failed to analyze deal');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 pb-32">
      <div className="bg-white p-4 border-b border-gray-200 sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-bold text-lg leading-none truncate max-w-[200px]">
              Deal Analysis
            </h1>
            <span className="text-xs text-gray-500">
              Evaluate new commercial real estate deals
            </span>
          </div>
        </div>
        <LineChart size={22} className="text-brand-600" />
      </div>

      <div className="p-4 flex-1 overflow-y-auto no-scrollbar space-y-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-gray-800 mb-1">New Deal</h2>
          <input
            className="w-full p-2.5 rounded-lg border border-gray-200 text-sm"
            placeholder="Asset name (e.g. Shopping Center A)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="w-full p-2.5 rounded-lg border border-gray-200 text-sm"
            placeholder="Location (city / country)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <select
            className="w-full p-2.5 rounded-lg border border-gray-200 text-sm"
            value={assetType}
            onChange={(e) => setAssetType(e.target.value)}
          >
            <option value="Commercial">Commercial</option>
            <option value="Residential">Residential</option>
            <option value="Land">Land</option>
            <option value="Foreign">Foreign</option>
            <option value="PensionFund">Pension / Fund</option>
          </select>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-gray-400 font-bold mb-1">
                Purchase Price
              </label>
              <input
                type="number"
                className="w-full p-2.5 rounded-lg border border-gray-200 text-sm"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 font-bold mb-1">
                Equity (Your cash in)
              </label>
              <input
                type="number"
                className="w-full p-2.5 rounded-lg border border-gray-200 text-sm"
                value={equityAmount}
                onChange={(e) => setEquityAmount(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-gray-400 font-bold mb-1">
                Loan Amount (optional)
              </label>
              <input
                type="number"
                className="w-full p-2.5 rounded-lg border border-gray-200 text-sm"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 font-bold mb-1">
                Expected Annual Rent
              </label>
              <input
                type="number"
                className="w-full p-2.5 rounded-lg border border-gray-200 text-sm"
                value={expectedRent}
                onChange={(e) => setExpectedRent(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-gray-400 font-bold mb-1">
                Operating Expenses / year
              </label>
              <input
                type="number"
                className="w-full p-2.5 rounded-lg border border-gray-200 text-sm"
                value={operatingExpenses}
                onChange={(e) => setOperatingExpenses(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 font-bold mb-1">
                Occupancy (0-1)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                className="w-full p-2.5 rounded-lg border border-gray-200 text-sm"
                value={expectedOccupancy}
                onChange={(e) => setExpectedOccupancy(e.target.value)}
              />
            </div>
          </div>
          {error && (
            <p className="text-xs text-red-600 mt-1">
              {error}
            </p>
          )}
          <button
            onClick={handleCreate}
            disabled={creating || !name.trim() || !purchasePrice || !equityAmount}
            className="w-full py-2.5 mt-1 rounded-lg bg-brand-600 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {creating ? <Loader2 size={16} className="animate-spin" /> : <LineChart size={16} />}
            <span>Analyze Deal</span>
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-bold text-gray-800">Recent Analyses</h2>
            {loading && <Loader2 size={16} className="animate-spin text-gray-400" />}
          </div>
          {deals.length === 0 && !loading ? (
            <p className="text-xs text-gray-400">
              No analyzed deals yet. Fill the form above to analyze a new opportunity.
            </p>
          ) : (
            deals.map(({ deal, metrics }) => (
              <div
                key={deal.id}
                className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-900 truncate">
                    {deal.name}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {deal.assetType} • {deal.location || '—'}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Purchase: {currencyService.format(deal.purchasePrice, globalCurrency)} • Equity:{' '}
                    {currencyService.format(deal.equityAmount, globalCurrency)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 uppercase font-black">Cap Rate</p>
                  <p className="text-sm font-bold text-brand-700">
                    {metrics.capRate.toFixed(1)}%
                  </p>
                  <p className="text-[10px] text-gray-400 uppercase font-black mt-1">
                    Cash-on-Cash
                  </p>
                  <p className="text-xs font-bold text-gray-800">
                    {metrics.cashOnCash.toFixed(1)}%
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

