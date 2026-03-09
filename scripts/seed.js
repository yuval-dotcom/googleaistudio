/**
 * Seed DB from Excel (e.g. data/mangeassests.xlsx).
 * Usage: node scripts/seed.js <path-to-xlsx> <user-email>
 * All data is assigned to the user with the given email (must exist).
 */

import XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ASSETS_SHEET = 'נכסים מאוחד (2)';
const LEGACY_ASSETS_SHEET = 'נכסים קרן טל';
const INCOME_SHEET = 'הכנסות ';

// Column indices (row 0 = headers, data from row 1)
// A=0 name, B=1 מס״ד, C=2 סוג נכס, D=3 תאריך קניה, E=4 מחיר קניה, F=5 שווי כיום, H=7 אחוזים, K=10 מינוף כללי, L=11 מינוף אישי, O=14 הכנסה חודשית, P=15 הוצאות
const COL = {
  name: 0,
  type: 2,
  purchaseYear: 3,
  purchasePrice: 4,
  currentValue: 5,
  percentage: 7,
  leverageGeneral: 10,
  leveragePersonal: 11,
  monthlyIncome: 14,
  expenses: 15,
};

function num(val) {
  if (val == null || val === '') return null;
  const n = Number(val);
  return Number.isNaN(n) ? null : n;
}

function str(val) {
  if (val == null) return '';
  return String(val).trim();
}

// Map Excel "type" / description to Prisma AssetType enum
// AssetType = { COMMERCIAL, RESIDENTIAL, LAND, FOREIGN, PENSION_FUND }
function normalizeAssetTypeForSeed(typeVal, name) {
  const base = str(typeVal || name).toLowerCase();
  if (!base) return 'COMMERCIAL';

  // Heuristic mappings from Hebrew descriptions
  if (base.includes('מגורים') || base.includes('דירה')) return 'RESIDENTIAL';
  if (base.includes('קרקע')) return 'LAND';
  if (base.includes('חו') || base.includes('חול')) return 'FOREIGN';
  if (
    base.includes('פנסי') ||
    base.includes('קרן השתלמות') ||
    base.includes('קופת גמל') ||
    base.includes('פנסיה')
  ) {
    return 'PENSION_FUND';
  }
  // כל השאר – מסחרי כברירת מחדל
  return 'COMMERCIAL';
}

async function main() {
  const xlsxPath = process.argv[2];
  const userEmail = process.argv[3];
  if (!xlsxPath || !userEmail) {
    console.error('Usage: node scripts/seed.js <path-to-xlsx> <user-email>');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email: userEmail.trim().toLowerCase() } });
  if (!user) {
    console.error('User not found for email:', userEmail);
    process.exit(1);
  }
  const userId = user.id;
  console.log('Seeding for user:', user.email);

  let wb;
  try {
    wb = XLSX.readFile(xlsxPath);
  } catch (e) {
    console.error('Failed to read Excel file:', e.message);
    process.exit(1);
  }

  const assetSheet = wb.Sheets[ASSETS_SHEET] || wb.Sheets[LEGACY_ASSETS_SHEET];
  if (!assetSheet) {
    console.error(
      `Sheet "${ASSETS_SHEET}" (or "${LEGACY_ASSETS_SHEET}") not found. Available:`,
      wb.SheetNames.join(', ')
    );
    process.exit(1);
  }

  const assetRows = XLSX.utils.sheet_to_json(assetSheet, { header: 1 });
  const nameToAssetId = {};
  let lastHoldingCompany = '';

  for (let i = 1; i < assetRows.length; i++) {
    const row = assetRows[i];
    if (!row || row.length < 6) continue;

    // A = שם החברה המחזיקה, סוג/תיאור הנכס בעמודה C (COL.type)
    const rawHoldingCompany = str(row[COL.name]);
    if (rawHoldingCompany && !/סה.?כ/.test(rawHoldingCompany)) {
      lastHoldingCompany = rawHoldingCompany;
    }
    // באקסל עם תאים ממוזגים שם החברה מופיע רק בשורה הראשונה של הקבוצה,
    // לכן ממשיכים עם החברה האחרונה שאינה ריקה.
    const holdingCompany = rawHoldingCompany || lastHoldingCompany;
    const typeVal = str(row[COL.type]);

    // דילוג על שורות סיכום ("סה\"כ" וכו')
    const combined = `${rawHoldingCompany} ${typeVal}`;
    if (/סה.?כ/.test(combined)) continue;

    // שם הנכס עצמו – נשתמש בתיאור בעמודה C, ואם אין אז בשם החברה
    const assetName = typeVal || holdingCompany;
    if (!assetName) continue;

    const type = normalizeAssetTypeForSeed(typeVal, assetName);
    const purchaseYear = num(row[COL.purchaseYear]);
    const purchasePrice = num(row[COL.purchasePrice]) ?? 0;
    const currentValue = num(row[COL.currentValue]) ?? purchasePrice ?? 0;
    const percentage = num(row[COL.percentage]);
    const monthlyIncome = num(row[COL.monthlyIncome]);
    const expenses = num(row[COL.expenses]);
    const leverageGeneral = num(row[COL.leverageGeneral]) ?? 0;
    const leveragePersonal = num(row[COL.leveragePersonal]) ?? 0;

    const asset = await prisma.asset.create({
      data: {
        userId,
        name: assetName,
        type,
        purchaseYear: purchaseYear ?? undefined,
        purchasePrice,
        currentValue,
      },
    });
    nameToAssetId[assetName] = asset.id;

    const pct = percentage != null ? (percentage > 1 ? percentage / 100 : percentage) : 1;
    await prisma.ownership.create({
      data: {
        assetId: asset.id,
        entityName: holdingCompany || 'בעלות פרטית',
        percentage: pct,
      },
    });

    if (leverageGeneral > 0 || leveragePersonal > 0) {
      const totalLeverage = leverageGeneral + leveragePersonal;
      await prisma.loan.create({
        data: {
          assetId: asset.id,
          originalAmount: totalLeverage,
          currentBalance: totalLeverage,
          monthlyPayment: 0,
          principalPayment: 0,
          interestPayment: 0,
        },
      });
    }

    const now = new Date();
    if (monthlyIncome != null && monthlyIncome > 0) {
      await prisma.transaction.create({
        data: {
          assetId: asset.id,
          type: 'INCOME',
          amount: monthlyIncome,
          date: now,
          description: 'הכנסה חודשית (ייבוא)',
        },
      });
    }
    if (expenses != null && expenses > 0) {
      await prisma.transaction.create({
        data: {
          assetId: asset.id,
          type: 'EXPENSE',
          amount: expenses,
          date: now,
          description: 'הוצאות (ייבוא)',
        },
      });
    }
  }

  const incomeSheet = wb.Sheets[INCOME_SHEET];
  if (incomeSheet) {
    const incomeRows = XLSX.utils.sheet_to_json(incomeSheet, { header: 1 });
    for (let i = 1; i < incomeRows.length; i++) {
      const row = incomeRows[i];
      if (!row || row.length < 3) continue;
      const desc = str(row[2]);
      let assetName = str(row[0]).replace(/^הכנסות\s*/, '').trim();
      if (!assetName) assetName = str(row[1]); // כשעמודה 0 ריקה, השם בעמודה 1
      if (!assetName || assetName === 'סה״כ') continue; // דילוג על שורות סיכום
      let assetId = nameToAssetId[assetName];
      if (!assetId) assetId = nameToAssetId[str(row[0])];
      if (!assetId) continue;
      const incomeTotal = num(row[4]);
      const expensesTotal = num(row[5]);
      const netIncome = num(row[8]);
      if (incomeTotal != null && incomeTotal > 0) {
        await prisma.transaction.create({
          data: {
            assetId,
            type: 'INCOME',
            amount: incomeTotal,
            date: new Date(),
            description: desc || 'הכנסות (ייבוא)',
          },
        });
      }
      if (expensesTotal != null && expensesTotal > 0) {
        await prisma.transaction.create({
          data: {
            assetId,
            type: 'EXPENSE',
            amount: expensesTotal,
            date: new Date(),
            description: 'הוצאות (ייבוא)',
          },
        });
      }
    }
  }

  console.log('Seed done. Assets created:', Object.keys(nameToAssetId).length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
