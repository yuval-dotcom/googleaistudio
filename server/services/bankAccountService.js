import { prisma } from '../db/prisma.js';

export async function listBankAccounts(assetId, userId) {
  const where = {};
  if (assetId) {
    where.assetId = assetId;
  }
  if (userId) {
    where.asset = { userId };
  }
  return prisma.bankAccount.findMany({
    where,
    include: { asset: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createBankAccount(data, userId) {
  if (data.assetId && userId) {
    const asset = await prisma.asset.findFirst({
      where: { id: data.assetId, userId },
    });
    if (!asset) {
      throw new Error('Asset not found');
    }
  }

  return prisma.bankAccount.create({
    data: {
      assetId: data.assetId ?? null,
      bankName: data.bankName ?? null,
      accountName: data.accountName ?? null,
      accountRef: data.accountRef ?? null,
      currency: data.currency ?? null,
    },
  });
}

export async function deleteBankAccount(id, userId) {
  if (userId) {
    const existing = await prisma.bankAccount.findFirst({
      where: { id, asset: { userId } },
    });
    if (!existing) return null;
  }
  return prisma.bankAccount.delete({
    where: { id },
  });
}

