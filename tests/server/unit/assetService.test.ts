import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../server/db/prisma.js', () => {
  return {
    prisma: {
      asset: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    },
  };
});

// Import after mocking prisma
import { prisma } from '../../../server/db/prisma.js';
import * as assetService from '../../../server/services/assetService.ts';

describe('assetService (server)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getAllAssets forwards userId filter and returns list', async () => {
    (prisma.asset.findMany as any).mockResolvedValue([
      {
        id: 'a1',
        userId: 'u1',
        name: 'Asset 1',
        type: 'RESIDENTIAL',
        country: 'Israel',
        city: 'Tel Aviv',
        address: 'Main St',
        status: 'Active',
        usageType: 'Residential',
        occupancyRate: 1,
        purchaseYear: 2020,
        purchasePrice: 100,
        currentValue: 120,
        pensionFundType: null,
        pensionProvider: null,
        pensionBalance: null,
        pensionVesting: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        ownerships: [],
        units: [],
        loans: [],
        transactions: [],
        bankAccounts: [],
      },
    ]);

    const result = await assetService.getAllAssets('u1');

    expect(prisma.asset.findMany).toHaveBeenCalledWith({
      where: { userId: 'u1' },
      include: expect.any(Object),
      orderBy: { updatedAt: 'desc' },
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('a1');
  });

  it('createAsset normalizes asset type and sets defaults', async () => {
    (prisma.asset.create as any).mockResolvedValue({
      id: 'a2',
      userId: 'u1',
      name: 'New Asset',
      type: 'RESIDENTIAL',
      country: null,
      city: null,
      address: null,
      status: null,
      usageType: null,
      occupancyRate: null,
      pensionFundType: null,
      pensionProvider: null,
      pensionBalance: null,
      pensionVesting: null,
      purchaseYear: null,
      purchasePrice: 50,
      currentValue: 80,
      createdAt: new Date(),
      updatedAt: new Date(),
      ownerships: [],
      units: [],
      loans: [],
      transactions: [],
      bankAccounts: [],
    });

    const payload = {
      name: 'New Asset',
      type: 'residential',
      purchasePrice: 50,
      currentValue: 80,
    };

    const created = await assetService.createAsset(payload, 'u1');

    expect(prisma.asset.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'u1',
        name: 'New Asset',
        type: 'RESIDENTIAL',
        purchasePrice: 50,
        currentValue: 80,
      }),
      include: expect.any(Object),
    });
    expect(created.type).toBe('RESIDENTIAL');
  });

  it('updateAsset applies partial fields and respects userId filter', async () => {
    (prisma.asset.update as any).mockResolvedValue({
      id: 'a3',
      userId: 'u2',
      name: 'Updated',
      type: 'COMMERCIAL',
      country: 'USA',
      city: 'NYC',
      address: 'Wall St',
      status: 'Active',
      usageType: 'Office',
      occupancyRate: 0.9,
      pensionFundType: null,
      pensionProvider: null,
      pensionBalance: null,
      pensionVesting: null,
      purchaseYear: 2019,
      purchasePrice: 200,
      currentValue: 250,
      createdAt: new Date(),
      updatedAt: new Date(),
      ownerships: [],
      units: [],
      loans: [],
      transactions: [],
      bankAccounts: [],
    });

    const result = await assetService.updateAsset(
      'a3',
      { name: 'Updated', type: 'commercial' },
      'u2',
    );

    expect(prisma.asset.update).toHaveBeenCalledWith({
      where: { id: 'a3', userId: 'u2' },
      data: expect.objectContaining({
        name: 'Updated',
        type: 'COMMERCIAL',
      }),
      include: expect.any(Object),
    });
    expect(result.name).toBe('Updated');
  });
});

