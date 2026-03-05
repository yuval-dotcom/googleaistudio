import { getAlertsForUser } from '../services/alertService.js';

export async function list(req, res) {
  try {
    const alerts = await getAlertsForUser(req.userId);
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

