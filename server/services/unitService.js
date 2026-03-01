import { prisma } from '../db/prisma.js';

export async function getUnitsByAssetId(assetId) {
  return prisma.unit.findMany({
    where: { assetId },
    include: { contracts: true },
    orderBy: { id: 'asc' },
  });
}

export async function getUnitById(unitId, assetId) {
  return prisma.unit.findFirst({
    where: { id: unitId, assetId },
    include: { contracts: true },
  });
}

export async function getUnitWithAsset(unitId) {
  return prisma.unit.findUnique({
    where: { id: unitId },
    include: { asset: true, contracts: true },
  });
}

export async function createUnit(assetId, data) {
  return prisma.unit.create({
    data: {
      assetId,
      description: data.description,
      sizeSqm: data.sizeSqm ?? undefined,
      status: data.status ?? 'Vacant',
    },
    include: { contracts: true },
  });
}

export async function updateUnit(unitId, assetId, data) {
  await prisma.unit.findFirstOrThrow({ where: { id: unitId, assetId } });
  return prisma.unit.update({
    where: { id: unitId },
    data: {
      ...(data.description != null && { description: data.description }),
      ...(data.sizeSqm !== undefined && { sizeSqm: data.sizeSqm }),
      ...(data.status != null && { status: data.status }),
    },
    include: { contracts: true },
  });
}

export async function deleteUnit(unitId, assetId) {
  await prisma.unit.findFirstOrThrow({ where: { id: unitId, assetId } });
  return prisma.unit.delete({
    where: { id: unitId },
  });
}
