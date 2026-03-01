import { prisma } from '../db/prisma.js';

export async function getTransactions(assetId = null, userId = null) {
  const where = {};
  if (assetId) where.assetId = assetId;
  if (userId != null) {
    where.asset = { userId };
  }
  return prisma.transaction.findMany({
    where,
    include: { asset: true },
    orderBy: { date: 'desc' },
  });
}

export async function getTransactionById(id, userId = null) {
  const tx = await prisma.transaction.findUnique({
    where: { id },
    include: { asset: true },
  });
  if (!tx) return null;
  if (userId != null && tx.asset?.userId !== userId) return null;
  return tx;
}

export async function createTransaction(data, userId = null) {
  const { assetId, type, amount, date, description } = data;
  if (!assetId || !type || amount == null) {
    throw new Error('assetId, type and amount are required');
  }
  if (userId != null) {
    const asset = await prisma.asset.findFirst({ where: { id: assetId, userId } });
    if (!asset) throw new Error('Asset not found');
  }
  return prisma.transaction.create({
    data: {
      assetId,
      type,
      amount: Number(amount),
      date: date ? new Date(date) : undefined,
      description: description ?? undefined,
    },
    include: { asset: true },
  });
}

export async function updateTransaction(id, data, userId = null) {
  if (userId != null) {
    const existing = await getTransactionById(id, userId);
    if (!existing) return null;
  }
  return prisma.transaction.update({
    where: { id },
    data: {
      ...(data.assetId != null && { assetId: data.assetId }),
      ...(data.type != null && { type: data.type }),
      ...(data.amount !== undefined && { amount: Number(data.amount) }),
      ...(data.date !== undefined && { date: data.date ? new Date(data.date) : undefined }),
      ...(data.description !== undefined && { description: data.description }),
    },
    include: { asset: true },
  });
}

export async function deleteTransaction(id, userId = null) {
  if (userId != null) {
    const existing = await getTransactionById(id, userId);
    if (!existing) return null;
  }
  return prisma.transaction.delete({
    where: { id },
  });
}
