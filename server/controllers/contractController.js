import * as contractService from '../services/contractService.js';
import * as unitService from '../services/unitService.js';

async function ensureUnitOwnership(req, res) {
  const unit = await unitService.getUnitWithAsset(req.params.unitId);
  if (!unit || unit.asset?.userId !== req.userId) {
    res.status(404).json({ error: 'Unit not found' });
    return null;
  }
  return unit;
}

export async function list(req, res) {
  try {
    if (!(await ensureUnitOwnership(req, res))) return;
    const contracts = await contractService.getContractsByUnitId(req.params.unitId);
    res.json(contracts);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

export async function getOne(req, res) {
  try {
    if (!(await ensureUnitOwnership(req, res))) return;
    const contract = await contractService.getContractById(
      req.params.contractId,
      req.params.unitId
    );
    if (!contract) return res.status(404).json({ error: 'Contract not found' });
    res.json(contract);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

export async function create(req, res) {
  try {
    if (!(await ensureUnitOwnership(req, res))) return;
    const { tenantName, monthlyRent, startDate, endDate, fileUrl } = req.body || {};
    if (monthlyRent == null) return res.status(400).json({ error: 'monthlyRent is required' });
    const contract = await contractService.createContract(req.params.unitId, {
      tenantName,
      monthlyRent,
      startDate,
      endDate,
      fileUrl,
    });
    res.status(201).json(contract);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

export async function update(req, res) {
  try {
    if (!(await ensureUnitOwnership(req, res))) return;
    const contract = await contractService.getContractById(
      req.params.contractId,
      req.params.unitId
    );
    if (!contract) return res.status(404).json({ error: 'Contract not found' });
    const updated = await contractService.updateContract(
      req.params.contractId,
      req.params.unitId,
      req.body || {}
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

export async function remove(req, res) {
  try {
    if (!(await ensureUnitOwnership(req, res))) return;
    const contract = await contractService.getContractById(
      req.params.contractId,
      req.params.unitId
    );
    if (!contract) return res.status(404).json({ error: 'Contract not found' });
    await contractService.deleteContract(req.params.contractId, req.params.unitId);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
}
