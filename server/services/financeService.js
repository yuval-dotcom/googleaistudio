import { prisma } from '../db/prisma.js';

/**
 * Get 5-year cash flow projection for an asset (user must own it).
 */
export async function getProjection(assetId, userId, years = 5) {
  const asset = await prisma.asset.findFirst({
    where: userId != null ? { id: assetId, userId } : { id: assetId },
    include: { transactions: true, loans: true, units: { include: { contracts: true } } },
  });
  if (!asset) return null;

  const now = new Date();
  const currentYear = now.getFullYear();

  const incomeTx = asset.transactions.filter((t) => t.type === 'INCOME');
  const expenseTx = asset.transactions.filter((t) => t.type === 'EXPENSE');
  const monthlyIncome = incomeTx.length ? incomeTx.reduce((s, t) => s + t.amount, 0) / 12 : 0;
  const monthlyExpense = expenseTx.length ? expenseTx.reduce((s, t) => s + t.amount, 0) / 12 : 0;
  const contractRent = asset.units?.reduce(
    (s, u) => s + (u.contracts?.reduce((c, ct) => c + (ct.monthlyRent || 0), 0) || 0),
    0
  ) || 0;
  const revenue = monthlyIncome || contractRent || 0;
  const loanPayment = asset.loans?.reduce((s, l) => s + (l.monthlyPayment || 0), 0) || 0;
  const expenses = monthlyExpense + loanPayment;

  const projection = [];
  for (let y = 0; y < years; y++) {
    const year = currentYear + y;
    const yearRevenue = revenue * 12;
    const yearExpenses = expenses * 12;
    projection.push({
      year,
      revenue: Math.round(yearRevenue * 100) / 100,
      expenses: Math.round(yearExpenses * 100) / 100,
      netCashFlow: Math.round((yearRevenue - yearExpenses) * 100) / 100,
      balance: asset.currentValue,
    });
  }
  return projection;
}

/**
 * Get income per ownership (total income × percentage per entity).
 */
export async function getOwnershipIncome(assetId, userId) {
  const asset = await prisma.asset.findFirst({
    where: userId != null ? { id: assetId, userId } : { id: assetId },
    include: { ownerships: true, transactions: true, units: { include: { contracts: true } } },
  });
  if (!asset) return null;

  const incomeTx = asset.transactions.filter((t) => t.type === 'INCOME');
  const totalFromTx = incomeTx.reduce((s, t) => s + t.amount, 0);
  const totalFromContracts = (asset.units || []).reduce(
    (s, u) => s + (u.contracts?.reduce((c, ct) => c + (ct.monthlyRent || 0) * 12, 0) || 0),
    0
  );
  const totalIncome = totalFromTx + totalFromContracts;

  return (asset.ownerships || []).map((o) => {
    const pct = o.percentage > 1 ? o.percentage / 100 : o.percentage;
    return {
      entityName: o.entityName,
      percentage: o.percentage,
      income: Math.round(totalIncome * pct * 100) / 100,
    };
  });
}
