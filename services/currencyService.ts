
import { CurrencyCode } from '../types';

// Default Exchange Rates (Base: NIS)
const DEFAULT_RATES: Record<CurrencyCode, number> = {
  NIS: 1,
  USD: 3.75,
  EUR: 4.05
};

// Internal storage for rates
let currentRates: Record<CurrencyCode, number> = { ...DEFAULT_RATES };

// Load from localStorage if available
try {
  const stored = localStorage.getItem('exchange_rates');
  if (stored) {
    currentRates = { ...DEFAULT_RATES, ...JSON.parse(stored) };
  }
} catch (e) {
  console.error("Failed to load rates", e);
}

const SYMBOLS: Record<CurrencyCode, string> = {
  NIS: '₪',
  USD: '$',
  EUR: '€'
};

export const currencyService = {
  getRates: (): Record<CurrencyCode, number> => {
    return { ...currentRates };
  },

  setRate: (currency: CurrencyCode, rate: number) => {
    if (rate <= 0) return;
    currentRates[currency] = rate;
    try {
      localStorage.setItem('exchange_rates', JSON.stringify(currentRates));
    } catch (e) {
      console.error("Failed to save rates", e);
    }
  },

  resetRates: () => {
    currentRates = { ...DEFAULT_RATES };
    localStorage.removeItem('exchange_rates');
  },

  // Robust Fetch Strategy
  fetchLiveRates: async (apiKey: string): Promise<void> => {
    const cleanKey = apiKey.trim();
    let rateILS = 0;
    let rateEUR = 0; // Relative to USD base
    let source = '';

    // Strategy 1: CurrencyFreaks (with provided key)
    try {
      console.log("Attempting CurrencyFreaks...");
      const url = `https://api.currencyfreaks.com/v2.0/rates/latest?apikey=${cleanKey}&symbols=ILS,EUR,USD`;
      const res = await fetch(url);
      
      if (res.ok) {
        const data = await res.json();
        if (data.rates) {
            rateILS = parseFloat(data.rates['ILS']);
            rateEUR = parseFloat(data.rates['EUR']);
            source = 'CurrencyFreaks';
        }
      } else {
        console.warn(`CurrencyFreaks returned ${res.status}`);
      }
    } catch (e) {
      console.warn("CurrencyFreaks failed:", e);
    }

    // Strategy 2: Frankfurter (Fallback - No Key Needed)
    if (!rateILS || !rateEUR) {
      try {
        console.log("Attempting Frankfurter (Fallback)...");
        // Frankfurter Base: USD
        const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=ILS,EUR');
        if (!res.ok) throw new Error("Frankfurter API unreachable");
        
        const data = await res.json();
        // data.rates = { ILS: 4.x, EUR: 0.9x }
        if (data.rates) {
            rateILS = data.rates['ILS'];
            rateEUR = data.rates['EUR'];
            source = 'Frankfurter (Open API)';
        }
      } catch (e) {
        console.error("Frankfurter failed:", e);
      }
    }

    // Validate Data
    if (!rateILS || !rateEUR) {
      throw new Error("All API strategies failed. Please check internet connection.");
    }

    // Apply Rates (Base: NIS)
    // We have rates relative to USD (Base=USD)
    // 1 USD = rateILS (NIS)
    // 1 USD = rateEUR (EUR) -> 1 EUR = rateILS / rateEUR (NIS)

    const newUsdToNis = rateILS;
    const newEurToNis = rateILS / rateEUR;

    currencyService.setRate('USD', parseFloat(newUsdToNis.toFixed(4)));
    currencyService.setRate('EUR', parseFloat(newEurToNis.toFixed(4)));
    
    console.log(`Rates updated via ${source}: USD=${newUsdToNis.toFixed(2)}, EUR=${newEurToNis.toFixed(2)}`);
  },

  convert: (amount: number, from: CurrencyCode, to: CurrencyCode): number => {
    if (from === to) return amount;
    const amountInNIS = amount * currentRates[from];
    const finalAmount = amountInNIS / currentRates[to];
    return finalAmount;
  },

  format: (amount: number, currency: CurrencyCode): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency === 'NIS' ? 'ILS' : currency,
      maximumFractionDigits: 0,
      currencyDisplay: 'narrowSymbol'
    }).format(amount);
  },

  getSymbol: (currency: CurrencyCode): string => {
    return SYMBOLS[currency];
  }
};

export const RATES = currentRates;
