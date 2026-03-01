import { prisma } from '../db/prisma.js';

const includeAll = {
  ownerships: true,
  units: { include: { contracts: true } },
  loans: true,
  transactions: true,
};

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
      type: data.type,
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
      ...(data.type != null && { type: data.type }),
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
