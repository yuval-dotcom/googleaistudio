import { prisma } from '../db/prisma.js';

const includeAll = {
  ownerships: true,
  units: { include: { contracts: true } },
  loans: true,
  transactions: true,
};

function normalizeAssetType(type) {
  if (!type) return undefined;
  const t = String(type).toLowerCase();
  if (t === 'residential') return 'RESIDENTIAL';
  if (t === 'commercial') return 'COMMERCIAL';
  if (t === 'shop' || t === 'logistics') return 'COMMERCIAL';
  if (t === 'land') return 'LAND';
  if (t === 'foreign') return 'FOREIGN';
  if (t === 'pension' || t === 'pension_fund') return 'PENSION_FUND';
  return 'COMMERCIAL';
}

export async function getAllAssets(userId) {
  return prisma.asset.findMany({
    where: userId != null ? { userId } : {},
    include: includeAll,
    orderBy: { updatedAt: 'desc' },
  });
}

export async function getAssetById(id, userId = null) {
  const where = userId != null ? { id, userId } : { id };
  return prisma.asset.findFirst({
    where,
    include: includeAll,
  });
}

export async function createAsset(data, userId = null) {
  return prisma.asset.create({
    data: {
      ...(userId && { userId }),
      name: data.name,
      type: normalizeAssetType(data.type),
      country: data.country ?? undefined,
      city: data.city ?? undefined,
      address: data.address ?? undefined,
      status: data.status ?? undefined,
      usageType: data.usageType ?? undefined,
      occupancyRate: data.occupancyRate ?? undefined,
      pensionFundType: data.pensionFundType ?? undefined,
      pensionProvider: data.pensionProvider ?? undefined,
      pensionBalance: data.pensionBalance ?? undefined,
      pensionVesting: data.pensionVesting ? new Date(data.pensionVesting) : undefined,
      purchaseYear: data.purchaseYear ?? undefined,
      purchasePrice: data.purchasePrice ?? 0,
      currentValue: data.currentValue ?? 0,
    },
    include: includeAll,
  });
}

export async function updateAsset(id, data, userId = null) {
  const where = userId != null ? { id, userId } : { id };
  return prisma.asset.update({
    where,
    data: {
      ...(data.name != null && { name: data.name }),
      ...(data.type != null && { type: normalizeAssetType(data.type) }),
      ...(data.country !== undefined && { country: data.country }),
      ...(data.city !== undefined && { city: data.city }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.usageType !== undefined && { usageType: data.usageType }),
      ...(data.occupancyRate !== undefined && { occupancyRate: data.occupancyRate }),
      ...(data.pensionFundType !== undefined && { pensionFundType: data.pensionFundType }),
      ...(data.pensionProvider !== undefined && { pensionProvider: data.pensionProvider }),
      ...(data.pensionBalance !== undefined && { pensionBalance: data.pensionBalance }),
      ...(data.pensionVesting !== undefined && {
        pensionVesting: data.pensionVesting ? new Date(data.pensionVesting) : null,
      }),
      ...(data.purchaseYear !== undefined && { purchaseYear: data.purchaseYear }),
      ...(data.purchasePrice !== undefined && { purchasePrice: data.purchasePrice }),
      ...(data.currentValue !== undefined && { currentValue: data.currentValue }),
    },
    include: includeAll,
  });
}

export async function deleteAsset(id, userId = null) {
  const where = userId != null ? { id, userId } : { id };
  return prisma.asset.delete({
    where,
  });
}
