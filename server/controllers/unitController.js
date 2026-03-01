import * as assetService from '../services/assetService.js';
import * as unitService from '../services/unitService.js';

async function ensureAssetOwnership(req, res) {
  const asset = await assetService.getAssetById(req.params.assetId, req.userId);
  if (!asset) {
    res.status(404).json({ error: 'Asset not found' });
    return null;
  }
  return asset;
}

export async function list(req, res) {
  try {
    if (!(await ensureAssetOwnership(req, res))) return;
    const units = await unitService.getUnitsByAssetId(req.params.assetId);
    res.json(units);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

export async function getOne(req, res) {
  try {
    if (!(await ensureAssetOwnership(req, res))) return;
    const unit = await unitService.getUnitById(req.params.unitId, req.params.assetId);
    if (!unit) return res.status(404).json({ error: 'Unit not found' });
    res.json(unit);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

export async function create(req, res) {
  try {
    if (!(await ensureAssetOwnership(req, res))) return;
    const { description, sizeSqm, status } = req.body || {};
    if (!description) return res.status(400).json({ error: 'description is required' });
    const unit = await unitService.createUnit(req.params.assetId, {
      description,
      sizeSqm,
      status,
    });
    res.status(201).json(unit);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

export async function update(req, res) {
  try {
    if (!(await ensureAssetOwnership(req, res))) return;
    const unit = await unitService.getUnitById(req.params.unitId, req.params.assetId);
    if (!unit) return res.status(404).json({ error: 'Unit not found' });
    const updated = await unitService.updateUnit(
      req.params.unitId,
      req.params.assetId,
      req.body || {}
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

export async function remove(req, res) {
  try {
    if (!(await ensureAssetOwnership(req, res))) return;
    const unit = await unitService.getUnitById(req.params.unitId, req.params.assetId);
    if (!unit) return res.status(404).json({ error: 'Unit not found' });
    await unitService.deleteUnit(req.params.unitId, req.params.assetId);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
}
