import { prisma } from '../db/prisma.js';

function normalizeAssetType(type) {
  if (!type) return 'COMMERCIAL';
  const t = String(type).toLowerCase();
  if (t === 'residential') return 'RESIDENTIAL';
  if (t === 'commercial') return 'COMMERCIAL';
  if (t === 'shop' || t === 'logistics') return 'COMMERCIAL';
  if (t === 'land') return 'LAND';
  if (t === 'foreign') return 'FOREIGN';
  if (t === 'pension' || t === 'pension_fund') return 'PENSION_FUND';
  return 'COMMERCIAL';
}

function computeMetrics(deal) {
  const purchasePrice = deal.purchasePrice || 0;
  const equity = deal.equityAmount || 0;
  const expectedRent = deal.expectedRent || 0; // assumed annual rent
  const occupancy = deal.expectedOccupancy != null ? deal.expectedOccupancy : 1;
  const operatingExpenses = deal.operatingExpenses || 0;

  const annualIncome = expectedRent * occupancy;
  const noi = annualIncome - operatingExpenses;
  const capRate = purchasePrice ? (noi / purchasePrice) * 100 : 0;
  const cashOnCash = equity ? (noi / equity) * 100 : 0;

  return {
    noi,
    capRate,
    cashOnCash,
  };
}

export async function listDeals() {
  const deals = await prisma.potentialDeal.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return deals.map((d) => ({
    deal: d,
    metrics: computeMetrics(d),
  }));
}

export async function getDealById(id) {
  const deal = await prisma.potentialDeal.findUnique({ where: { id } });
  if (!deal) return null;
  return {
    deal,
    metrics: computeMetrics(deal),
  };
}

export async function createDeal(data) {
  const deal = await prisma.potentialDeal.create({
    data: {
      name: data.name,
      location: data.location ?? null,
      assetType: normalizeAssetType(data.assetType),
      purchasePrice: data.purchasePrice,
      equityAmount: data.equityAmount,
      loanAmount: data.loanAmount ?? 0,
      interestRate: data.interestRate ?? null,
      holdYears: data.holdYears ?? null,
      expectedRent: data.expectedRent ?? 0,
      expectedOccupancy: data.expectedOccupancy ?? 1,
      operatingExpenses: data.operatingExpenses ?? 0,
    },
  });
  return {
    deal,
    metrics: computeMetrics(deal),
  };
}

