import type { Prisma, AssetType } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { HttpError } from '../errors/HttpError.js';

const includeAll = {
  ownerships: true,
  units: { include: { contracts: true } },
  loans: true,
  transactions: true,
} as const;

export type AssetWithRelations = Prisma.AssetGetPayload<{
  include: typeof includeAll;
}>;

function normalizeAssetType(type: unknown): AssetType {
  if (!type) {
    throw HttpError.badRequest('Asset type is required');
  }
  const t = String(type).toLowerCase();
  if (t === 'residential') return 'RESIDENTIAL';
  if (t === 'commercial') return 'COMMERCIAL';
  if (t === 'shop' || t === 'logistics') return 'COMMERCIAL';
  if (t === 'land') return 'LAND';
  if (t === 'foreign') return 'FOREIGN';
  if (t === 'pension' || t === 'pension_fund') return 'PENSION_FUND';
  throw HttpError.badRequest(`Unsupported asset type: ${String(type)}`);
}

function requireUserId(userId: string | null | undefined): string {
  if (!userId) {
    throw HttpError.unauthorized('userId is required for tenant-scoped access');
  }
  return userId;
}

export async function getAllAssets(
  userId?: string | null,
): Promise<AssetWithRelations[]> {
  const scopedUserId = requireUserId(userId ?? null);
  const assets = await prisma.asset.findMany({
    where: { userId: scopedUserId },
    include: includeAll,
    orderBy: { updatedAt: 'desc' },
  });
  return assets as unknown as AssetWithRelations[];
}

export async function getAssetById(
  id: string,
  userId: string | null = null,
): Promise<AssetWithRelations | null> {
  const where = userId != null ? { id, userId } : { id };
  const asset = await prisma.asset.findFirst({
    where,
    include: includeAll,
  });
  return asset as unknown as AssetWithRelations | null;
}

interface CreateAssetInput {
  name: string;
  type: unknown;
  country?: string;
  city?: string;
  address?: string;
  status?: string;
  usageType?: string;
  occupancyRate?: number;
  pensionFundType?: string;
  pensionProvider?: string;
  pensionBalance?: number;
  pensionVesting?: string | Date | null;
  purchaseYear?: number;
  purchasePrice?: number;
  currentValue?: number;
}

export async function createAsset(
  data: CreateAssetInput,
  userId: string | null = null,
): Promise<AssetWithRelations> {
  const scopedUserId = requireUserId(userId);
  const asset = await prisma.asset.create({
    data: {
      userId: scopedUserId,
      name: data.name,
      type: normalizeAssetType(data.type),
      country: data.country ?? undefined,
      city: data.city ?? undefined,
      address: data.address ?? undefined,
      status: data.status ?? undefined,
      usageType: data.usageType ?? undefined,
      occupancyRate: data.occupancyRate ?? undefined,
      pensionFundType: data.pensionFundType ?? undefined,
      pensionProvider: data.pensionProvider ?? undefined,
      pensionBalance: data.pensionBalance ?? undefined,
      pensionVesting: data.pensionVesting
        ? new Date(data.pensionVesting)
        : undefined,
      purchaseYear: data.purchaseYear ?? undefined,
      purchasePrice: data.purchasePrice ?? 0,
      currentValue: data.currentValue ?? 0,
    },
    include: includeAll,
  });
  return asset as unknown as AssetWithRelations;
}

type UpdateAssetInput = Partial<CreateAssetInput>;

export async function updateAsset(
  id: string,
  data: UpdateAssetInput,
  userId: string | null = null,
): Promise<AssetWithRelations> {
  const scopedUserId = requireUserId(userId);
  const where = { id, userId: scopedUserId };
  const asset = await prisma.asset.update({
    where,
    data: {
      ...(data.name != null && { name: data.name }),
      ...(data.type != null && { type: normalizeAssetType(data.type) }),
      ...(data.country !== undefined && { country: data.country }),
      ...(data.city !== undefined && { city: data.city }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.usageType !== undefined && { usageType: data.usageType }),
      ...(data.occupancyRate !== undefined && {
        occupancyRate: data.occupancyRate,
      }),
      ...(data.pensionFundType !== undefined && {
        pensionFundType: data.pensionFundType,
      }),
      ...(data.pensionProvider !== undefined && {
        pensionProvider: data.pensionProvider,
      }),
      ...(data.pensionBalance !== undefined && {
        pensionBalance: data.pensionBalance,
      }),
      ...(data.pensionVesting !== undefined && {
        pensionVesting: data.pensionVesting
          ? new Date(data.pensionVesting)
          : null,
      }),
      ...(data.purchaseYear !== undefined && {
        purchaseYear: data.purchaseYear,
      }),
      ...(data.purchasePrice !== undefined && {
        purchasePrice: data.purchasePrice,
      }),
      ...(data.currentValue !== undefined && {
        currentValue: data.currentValue,
      }),
    },
    include: includeAll,
  });
  return asset as unknown as AssetWithRelations;
}

export async function deleteAsset(
  id: string,
  userId: string | null = null,
): Promise<void> {
  const scopedUserId = requireUserId(userId);
  const where = { id, userId: scopedUserId };
  await prisma.asset.delete({
    where,
  });
}

