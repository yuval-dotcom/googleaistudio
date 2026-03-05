import * as dealService from '../services/dealService.js';

export async function list(req, res) {
  try {
    const deals = await dealService.listDeals();
    res.json(deals);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

export async function getOne(req, res) {
  try {
    const result = await dealService.getDealById(req.params.id);
    if (!result) return res.status(404).json({ error: 'Deal not found' });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

export async function create(req, res) {
  try {
    const {
      name,
      assetType,
      purchasePrice,
      equityAmount,
      loanAmount,
      interestRate,
      holdYears,
      expectedRent,
      expectedOccupancy,
      operatingExpenses,
      location,
    } = req.body || {};

    if (!name || !assetType || purchasePrice == null || equityAmount == null) {
      return res.status(400).json({
        error: 'name, assetType, purchasePrice and equityAmount are required',
      });
    }

    const result = await dealService.createDeal({
      name,
      assetType,
      purchasePrice: Number(purchasePrice),
      equityAmount: Number(equityAmount),
      loanAmount: loanAmount != null ? Number(loanAmount) : undefined,
      interestRate: interestRate != null ? Number(interestRate) : undefined,
      holdYears: holdYears != null ? Number(holdYears) : undefined,
      expectedRent: expectedRent != null ? Number(expectedRent) : undefined,
      expectedOccupancy:
        expectedOccupancy != null ? Number(expectedOccupancy) : undefined,
      operatingExpenses:
        operatingExpenses != null ? Number(operatingExpenses) : undefined,
      location,
    });

    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

