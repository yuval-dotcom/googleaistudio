import * as transactionService from '../services/transactionService.js';

export async function list(req, res) {
  try {
    const assetId = req.query.assetId || null;
    const transactions = await transactionService.getTransactions(assetId, req.userId);
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

export async function getOne(req, res) {
  try {
    const transaction = await transactionService.getTransactionById(req.params.id, req.userId);
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
    res.json(transaction);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

export async function create(req, res) {
  try {
    const transaction = await transactionService.createTransaction(req.body || {}, req.userId);
    res.status(201).json(transaction);
  } catch (err) {
    if (err.message?.includes('required')) return res.status(400).json({ error: err.message });
    if (err.message === 'Asset not found') return res.status(404).json({ error: err.message });
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

export async function update(req, res) {
  try {
    const updated = await transactionService.updateTransaction(req.params.id, req.body || {}, req.userId);
    if (!updated) return res.status(404).json({ error: 'Transaction not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

export async function remove(req, res) {
  try {
    const deleted = await transactionService.deleteTransaction(req.params.id, req.userId);
    if (!deleted) return res.status(404).json({ error: 'Transaction not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
}
