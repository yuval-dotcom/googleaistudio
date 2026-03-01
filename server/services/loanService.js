import { prisma } from '../db/prisma.js';

export async function getLoansByAssetId(assetId) {
  return prisma.loan.findMany({
    where: { assetId },
    orderBy: { id: 'asc' },
  });
}

export async function getLoanById(loanId, assetId) {
  return prisma.loan.findFirst({
    where: { id: loanId, assetId },
  });
}

export async function createLoan(assetId, data) {
  return prisma.loan.create({
    data: {
      assetId,
      originalAmount: data.originalAmount,
      currentBalance: data.currentBalance,
      monthlyPayment: data.monthlyPayment,
      principalPayment: data.principalPayment,
      interestPayment: data.interestPayment,
    },
  });
}

export async function updateLoan(loanId, assetId, data) {
  await prisma.loan.findFirstOrThrow({ where: { id: loanId, assetId } });
  return prisma.loan.update({
    where: { id: loanId },
    data: {
      ...(data.originalAmount !== undefined && { originalAmount: data.originalAmount }),
      ...(data.currentBalance !== undefined && { currentBalance: data.currentBalance }),
      ...(data.monthlyPayment !== undefined && { monthlyPayment: data.monthlyPayment }),
      ...(data.principalPayment !== undefined && { principalPayment: data.principalPayment }),
      ...(data.interestPayment !== undefined && { interestPayment: data.interestPayment }),
    },
  });
}

export async function deleteLoan(loanId, assetId) {
  await prisma.loan.findFirstOrThrow({ where: { id: loanId, assetId } });
  return prisma.loan.delete({
    where: { id: loanId },
  });
}
