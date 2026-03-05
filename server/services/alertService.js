import { prisma } from '../db/prisma.js';

function daysBetween(a, b) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((b.getTime() - a.getTime()) / msPerDay);
}

export async function getAlertsForUser(userId) {
  const now = new Date();
  const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const assets = await prisma.asset.findMany({
    where: { userId },
    include: {
      units: { include: { contracts: true } },
      transactions: true,
    },
  });

  const alerts = [];

  for (const asset of assets) {
    const address = asset.address || asset.name;

    // Lease expiry alerts
    for (const unit of asset.units || []) {
      for (const contract of unit.contracts || []) {
        if (!contract.endDate) continue;
        const end = new Date(contract.endDate);
        if (end < now) continue;

        let severity = null;
        if (end <= in30Days) severity = 'high';
        else if (end <= in60Days) severity = 'medium';
        else if (end <= in90Days) severity = 'low';

        if (severity) {
          alerts.push({
            type: 'LEASE_EXPIRY',
            severity,
            assetId: asset.id,
            unitId: unit.id,
            contractId: contract.id,
            address,
            unitName: unit.description,
            tenantName: contract.tenantName,
            expiryDate: end.toISOString(),
            daysRemaining: daysBetween(now, end),
          });
        }
      }
    }

    // Simple payment delay alert: if no INCOME tx in last 45 days
    const last45Days = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000);
    const recentIncome = (asset.transactions || []).some(
      (t) => t.type === 'INCOME' && new Date(t.date) >= last45Days
    );
    if (!recentIncome && (asset.transactions || []).length > 0) {
      alerts.push({
        type: 'POSSIBLE_PAYMENT_DELAY',
        severity: 'medium',
        assetId: asset.id,
        address,
        message:
          'No rental income recorded in the last 45 days – check payments for this asset.',
      });
    }
  }

  alerts.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return (order[a.severity] ?? 2) - (order[b.severity] ?? 2);
  });

  return alerts;
}

