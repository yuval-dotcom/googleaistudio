import * as bankAccountService from '../services/bankAccountService.js';

export async function list(req, res) {
  try {
    const assetId = req.query.assetId || null;
    const accounts = await bankAccountService.listBankAccounts(assetId, req.userId);
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

export async function create(req, res) {
  try {
    const { assetId, bankName, accountName, accountRef, currency } = req.body || {};
    const account = await bankAccountService.createBankAccount(
      { assetId, bankName, accountName, accountRef, currency },
      req.userId
    );
    res.status(201).json(account);
  } catch (err) {
    if (err.message === 'Asset not found') {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

export async function remove(req, res) {
  try {
    const deleted = await bankAccountService.deleteBankAccount(req.params.id, req.userId);
    if (!deleted) return res.status(404).json({ error: 'BankAccount not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

