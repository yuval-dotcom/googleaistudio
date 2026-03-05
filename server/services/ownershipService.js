import { prisma } from '../db/prisma.js';

export async function getOwnershipsByAssetId(assetId) {
  return prisma.ownership.findMany({
    where: { assetId },
    orderBy: { id: 'asc' },
  });
}

export async function getOwnershipById(ownershipId, assetId) {
  return prisma.ownership.findFirst({
    where: { id: ownershipId, assetId },
  });
}

export async function createOwnership(assetId, data) {
  return prisma.ownership.create({
    data: {
      assetId,
      entityName: data.entityName,
      percentage: data.percentage,
    },
  });
}

export async function updateOwnership(ownershipId, assetId, data) {
  await prisma.ownership.findFirstOrThrow({ where: { id: ownershipId, assetId } });
  return prisma.ownership.update({
    where: { id: ownershipId },
    data: {
      ...(data.entityName != null && { entityName: data.entityName }),
      ...(data.percentage !== undefined && { percentage: data.percentage }),
    },
  });
}

export async function deleteOwnership(ownershipId, assetId) {
  await prisma.ownership.findFirstOrThrow({ where: { id: ownershipId, assetId } });
  return prisma.ownership.delete({
    where: { id: ownershipId },
  });
}
