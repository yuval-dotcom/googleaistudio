import * as assetService from '../services/assetService.js';

export async function list(req, res) {
  try {
    const assets = await assetService.getAllAssets(req.userId);
    res.json(assets);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

export async function getOne(req, res) {
  try {
    const asset = await assetService.getAssetById(req.params.id, req.userId);
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    res.json(asset);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

export async function create(req, res) {
  try {
    const { name, type, purchaseYear, purchasePrice, currentValue } = req.body || {};
    if (!name || !type) return res.status(400).json({ error: 'name and type are required' });
    const asset = await assetService.createAsset(
      { name, type, purchaseYear, purchasePrice, currentValue },
      req.userId
    );
    res.status(201).json(asset);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

export async function update(req, res) {
  try {
    const asset = await assetService.getAssetById(req.params.id, req.userId);
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    const updated = await assetService.updateAsset(req.params.id, req.body || {}, req.userId);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

export async function remove(req, res) {
  try {
    const asset = await assetService.getAssetById(req.params.id, req.userId);
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    await assetService.deleteAsset(req.params.id, req.userId);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
}
