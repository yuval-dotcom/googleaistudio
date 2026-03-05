import * as assetService from '../services/assetService.js';
import * as ownershipService from '../services/ownershipService.js';

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
    const ownerships = await ownershipService.getOwnershipsByAssetId(req.params.assetId);
    res.json(ownerships);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

export async function getOne(req, res) {
  try {
    if (!(await ensureAssetOwnership(req, res))) return;
    const ownership = await ownershipService.getOwnershipById(
      req.params.ownershipId,
      req.params.assetId
    );
    if (!ownership) return res.status(404).json({ error: 'Ownership not found' });
    res.json(ownership);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

export async function create(req, res) {
  try {
    if (!(await ensureAssetOwnership(req, res))) return;
    const { entityName, percentage } = req.body || {};
    if (!entityName || percentage == null)
      return res.status(400).json({ error: 'entityName and percentage are required' });
    const ownership = await ownershipService.createOwnership(req.params.assetId, {
      entityName,
      percentage,
    });
    res.status(201).json(ownership);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

export async function update(req, res) {
  try {
    if (!(await ensureAssetOwnership(req, res))) return;
    const ownership = await ownershipService.getOwnershipById(
      req.params.ownershipId,
      req.params.assetId
    );
    if (!ownership) return res.status(404).json({ error: 'Ownership not found' });
    const updated = await ownershipService.updateOwnership(
      req.params.ownershipId,
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
    const ownership = await ownershipService.getOwnershipById(
      req.params.ownershipId,
      req.params.assetId
    );
    if (!ownership) return res.status(404).json({ error: 'Ownership not found' });
    await ownershipService.deleteOwnership(req.params.ownershipId, req.params.assetId);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
}
