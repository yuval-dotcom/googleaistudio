import { prisma } from '../db/prisma.js';

export async function getContractsByUnitId(unitId) {
  return prisma.contract.findMany({
    where: { unitId },
    orderBy: { endDate: 'desc' },
  });
}

export async function getContractById(contractId, unitId) {
  return prisma.contract.findFirst({
    where: { id: contractId, unitId },
  });
}

export async function createContract(unitId, data) {
  return prisma.contract.create({
    data: {
      unitId,
      tenantName: data.tenantName ?? undefined,
      monthlyRent: data.monthlyRent,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      fileUrl: data.fileUrl ?? undefined,
    },
  });
}

export async function updateContract(contractId, unitId, data) {
  await prisma.contract.findFirstOrThrow({ where: { id: contractId, unitId } });
  return prisma.contract.update({
    where: { id: contractId },
    data: {
      ...(data.tenantName !== undefined && { tenantName: data.tenantName }),
      ...(data.monthlyRent !== undefined && { monthlyRent: data.monthlyRent }),
      ...(data.startDate !== undefined && { startDate: data.startDate ? new Date(data.startDate) : null }),
      ...(data.endDate !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }),
      ...(data.fileUrl !== undefined && { fileUrl: data.fileUrl }),
    },
  });
}

export async function deleteContract(contractId, unitId) {
  await prisma.contract.findFirstOrThrow({ where: { id: contractId, unitId } });
  return prisma.contract.delete({
    where: { id: contractId },
  });
}
