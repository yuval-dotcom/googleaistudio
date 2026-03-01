import * as assetService from '../services/assetService.js';
import * as loanService from '../services/loanService.js';

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
    const loans = await loanService.getLoansByAssetId(req.params.assetId);
    res.json(loans);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

export async function getOne(req, res) {
  try {
    if (!(await ensureAssetOwnership(req, res))) return;
    const loan = await loanService.getLoanById(req.params.loanId, req.params.assetId);
    if (!loan) return res.status(404).json({ error: 'Loan not found' });
    res.json(loan);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

export async function create(req, res) {
  try {
    if (!(await ensureAssetOwnership(req, res))) return;
    const body = req.body || {};
    const required = [
      'originalAmount',
      'currentBalance',
      'monthlyPayment',
      'principalPayment',
      'interestPayment',
    ];
    for (const key of required) {
      if (body[key] == null) return res.status(400).json({ error: `${key} is required` });
    }
    const loan = await loanService.createLoan(req.params.assetId, body);
    res.status(201).json(loan);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

export async function update(req, res) {
  try {
    if (!(await ensureAssetOwnership(req, res))) return;
    const loan = await loanService.getLoanById(req.params.loanId, req.params.assetId);
    if (!loan) return res.status(404).json({ error: 'Loan not found' });
    const updated = await loanService.updateLoan(
      req.params.loanId,
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
    const loan = await loanService.getLoanById(req.params.loanId, req.params.assetId);
    if (!loan) return res.status(404).json({ error: 'Loan not found' });
    await loanService.deleteLoan(req.params.loanId, req.params.assetId);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
}
