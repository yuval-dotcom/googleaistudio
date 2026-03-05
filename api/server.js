import { app } from '../server/app.js';

function readOriginalPath(req) {
  const fromQuery = req?.query?.__originalPath;
  if (typeof fromQuery === 'string' && fromQuery) return fromQuery;
  if (Array.isArray(fromQuery) && fromQuery.length > 0) return fromQuery[0];
  return null;
}

function rebuildQuery(req) {
  if (!req?.query || typeof req.query !== 'object') return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query)) {
    if (key === '__originalPath' || value == null) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item != null) params.append(key, String(item));
      }
    } else {
      params.append(key, String(value));
    }
  }
  const query = params.toString();
  return query ? `?${query}` : '';
}

export default function handler(req, res) {
  const originalPath = readOriginalPath(req);
  if (originalPath) {
    req.url = `${originalPath}${rebuildQuery(req)}`;
  }
  return app(req, res);
}
