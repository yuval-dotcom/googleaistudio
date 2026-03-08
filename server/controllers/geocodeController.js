import { geocodeQuery } from '../services/geocodeService.js';

export async function geocodeAddress(req, res) {
  const query = String(req.body?.query || '');
  if (!query.trim()) {
    return res.status(400).json({ error: 'query is required' });
  }

  const result = await geocodeQuery(query);
  if (!result) {
    return res.status(404).json({ error: 'Address not found' });
  }

  return res.json(result);
}
