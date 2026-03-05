import { describe, it, expect, beforeEach, vi } from 'vitest';
import { nodeApiDataService } from '../../../services/nodeApiDataService';
import * as nodeAuth from '../../../services/nodeAuthService';

vi.mock('../../../services/nodeAuthService', () => ({
  getToken: vi.fn(),
}));

describe('nodeApiDataService', () => {
  beforeEach(() => {
    vi.mocked(nodeAuth.getToken).mockReturnValue('fake-token');
    vi.clearAllMocks();
  });

  describe('getProperties', () => {
    it('maps API assets to Property shape', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            id: 'a1',
            name: 'Building A',
            type: 'Residential',
            purchasePrice: 100,
            currentValue: 120,
            units: [{ id: 'u1', description: 'Unit 1', sizeSqm: 50 }],
          },
        ],
      }));
      const list = await nodeApiDataService.getProperties();
      expect(list).toHaveLength(1);
      expect(list[0].id).toBe('a1');
      expect(list[0].address).toBe('Building A');
      expect(list[0].purchasePrice).toBe(100);
      expect(list[0].marketValue).toBe(120);
      expect(list[0].units).toHaveLength(1);
      expect(list[0].units[0].name).toBe('Unit 1');
    });

    it('throws on 401', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }));
      await expect(nodeApiDataService.getProperties()).rejects.toThrow(/Unauthorized/i);
    });
  });

  describe('getTransactions', () => {
    it('maps API transactions to Transaction shape', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          { id: 't1', assetId: 'a1', date: '2024-01-01', amount: 1000, type: 'INCOME', description: 'Rent' },
        ],
      }));
      const list = await nodeApiDataService.getTransactions();
      expect(list).toHaveLength(1);
      expect(list[0].id).toBe('t1');
      expect(list[0].propertyId).toBe('a1');
      expect(list[0].amount).toBe(1000);
      expect(list[0].type).toBe('income');
    });

    it('throws on 401', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }));
      await expect(nodeApiDataService.getTransactions()).rejects.toThrow(/Unauthorized/i);
    });
  });

  describe('getCompanies', () => {
    it('returns empty array', async () => {
      const list = await nodeApiDataService.getCompanies();
      expect(list).toEqual([]);
    });
  });
});
