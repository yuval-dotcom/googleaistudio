import { geocodeQuery } from '../services/geocodeService.js';

export async function geocodeAddress(req, res) {
  const query = String(req.body?.query || '');
  if (!query.trim()) {
    return res.status(400).json({ error: 'query is required' });
  }

  try {
    const result = await geocodeQuery(query);
    if (!result) {
      return res.status(404).json({ error: 'Address not found' });
    }

    return res.json(result);
  } catch (error) {
    if (error instanceof Error && error.code === 'GEOCODE_TIMEOUT') {
      console.error('Geocode provider timeout', { code: error.code, error });
      return res.status(504).json({ error: 'Geocode provider timeout' });
    }
    console.error('Geocode request failed', { code: error?.code, error });
    return res.status(502).json({ error: 'Geocode request failed' });
  }
}
