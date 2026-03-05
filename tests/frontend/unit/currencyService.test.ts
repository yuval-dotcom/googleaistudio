import { describe, it, expect, beforeEach, vi } from 'vitest';
import { currencyService } from '../../../services/currencyService';
import type { CurrencyCode } from '../../../types';

describe('currencyService', () => {
  beforeEach(() => {
    currencyService.resetRates();
  });

  describe('getRates', () => {
    it('returns default rates after reset', () => {
      const rates = currencyService.getRates();
      expect(rates.NIS).toBe(1);
      expect(rates.USD).toBe(3.75);
      expect(rates.EUR).toBe(4.05);
    });

    it('returns a copy so mutating does not affect internal state', () => {
      const rates = currencyService.getRates();
      rates.USD = 999;
      expect(currencyService.getRates().USD).toBe(3.75);
    });
  });

  describe('setRate', () => {
    it('updates rate for given currency', () => {
      currencyService.setRate('USD', 4);
      expect(currencyService.getRates().USD).toBe(4);
    });

    it('ignores zero or negative rate', () => {
      currencyService.setRate('USD', 0);
      expect(currencyService.getRates().USD).toBe(3.75);
      currencyService.setRate('USD', -1);
      expect(currencyService.getRates().USD).toBe(3.75);
    });
  });

  describe('resetRates', () => {
    it('restores default rates', () => {
      currencyService.setRate('USD', 5);
      currencyService.resetRates();
      expect(currencyService.getRates().USD).toBe(3.75);
    });
  });

  describe('convert', () => {
    it('returns same amount when from and to are equal', () => {
      expect(currencyService.convert(100, 'USD', 'USD')).toBe(100);
      expect(currencyService.convert(50, 'NIS', 'NIS')).toBe(50);
    });

    it('converts between currencies using NIS as base', () => {
      const nisFromUsd = currencyService.convert(100, 'USD', 'NIS');
      expect(nisFromUsd).toBeCloseTo(375, 2);

      const eurFromUsd = currencyService.convert(100, 'USD', 'EUR');
      expect(eurFromUsd).toBeCloseTo(375 / 4.05, 2);
    });
  });

  describe('format', () => {
    it('formats amount with currency symbol', () => {
      expect(currencyService.format(100, 'USD')).toContain('100');
      expect(currencyService.format(100, 'NIS')).toContain('100');
      expect(currencyService.format(100, 'EUR')).toContain('100');
    });

    it('uses ILS for NIS in Intl', () => {
      const formatted = currencyService.format(50, 'NIS');
      expect(formatted).toMatch(/\d/);
    });
  });

  describe('getSymbol', () => {
    it('returns correct symbols for each currency', () => {
      expect(currencyService.getSymbol('NIS')).toBe('₪');
      expect(currencyService.getSymbol('USD')).toBe('$');
      expect(currencyService.getSymbol('EUR')).toBe('€');
    });
  });

  describe('fetchLiveRates', () => {
    it('throws when both API strategies fail', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
      await expect(currencyService.fetchLiveRates('fake-key')).rejects.toThrow(
        /All API strategies failed/
      );
      vi.unstubAllGlobals();
    });

    it('updates rates when CurrencyFreaks returns valid data', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              rates: { ILS: '3.7', EUR: '0.92', USD: '1' },
            }),
        })
      );
      await currencyService.fetchLiveRates('key');
      const rates = currencyService.getRates();
      expect(rates.USD).toBe(3.7);
      expect(rates.EUR).toBeCloseTo(3.7 / 0.92, 2);
      vi.unstubAllGlobals();
    });
  });
});
