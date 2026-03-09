import type { Request, Response, NextFunction } from 'express';
import * as assetService from '../services/assetService.js';
import * as financeService from '../services/financeService.js';

interface AuthRequest extends Request {
  userId?: string;
}

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const assets = await assetService.getAllAssets(req.userId ?? null);
    res.json(assets);
  } catch (err) {
    next(err);
  }
}

export async function getOne(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const asset = await assetService.getAssetById(
      req.params.id,
      req.userId ?? null,
    );
    if (!asset) {
      res.status(404).json({ error: 'Asset not found' });
      return;
    }
    res.json(asset);
  } catch (err) {
    next(err);
  }
}

export async function projection(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const rawYears = Array.isArray(req.query.years)
      ? req.query.years[0]
      : req.query.years;
    let years = parseInt(String(rawYears ?? ''), 10);
    if (Number.isNaN(years)) {
      years = 5;
    }
    if (years < 1) {
      years = 1;
    }
    if (years > 20) {
      years = 20;
    }
    const data = await financeService.getProjection(
      req.params.id,
      req.userId ?? null,
      years,
    );
    if (!data) {
      res.status(404).json({ error: 'Asset not found' });
      return;
    }
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function ownershipIncome(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await financeService.getOwnershipIncome(
      req.params.id,
      req.userId ?? null,
    );
    if (!data) {
      res.status(404).json({ error: 'Asset not found' });
      return;
    }
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function create(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const { name, type, purchaseYear, purchasePrice, currentValue } =
      (req.body as any) || {};
    if (!name || !type) {
      res.status(400).json({ error: 'name and type are required' });
      return;
    }
    const asset = await assetService.createAsset(
      { name, type, purchaseYear, purchasePrice, currentValue },
      req.userId ?? null,
    );
    res.status(201).json(asset);
  } catch (err) {
    next(err);
  }
}

export async function update(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const existing = await assetService.getAssetById(
      req.params.id,
      req.userId ?? null,
    );
    if (!existing) {
      res.status(404).json({ error: 'Asset not found' });
      return;
    }
    const updated = await assetService.updateAsset(
      req.params.id,
      (req.body as any) || {},
      req.userId ?? null,
    );
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function remove(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const existing = await assetService.getAssetById(
      req.params.id,
      req.userId ?? null,
    );
    if (!existing) {
      res.status(404).json({ error: 'Asset not found' });
      return;
    }
    await assetService.deleteAsset(req.params.id, req.userId ?? null);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

