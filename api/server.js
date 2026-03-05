function readOriginalPath(req) {
  const fromQuery = req?.query?.__originalPath;
  if (typeof fromQuery === 'string' && fromQuery) return fromQuery;
  if (Array.isArray(fromQuery) && fromQuery.length > 0) return fromQuery[0];
  return null;
}

function isValidOriginalPath(path) {
  if (typeof path !== 'string') return false;
  return /^\/api(?:\/|$)/.test(path);
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

let cachedApp = null;

async function getApp() {
  if (cachedApp) return cachedApp;
  const mod = await import('../server/app.js');
  cachedApp = mod.app;
  return cachedApp;
}

export default async function handler(req, res) {
  const originalPath = readOriginalPath(req);
  if (isValidOriginalPath(originalPath)) {
    req.url = `${originalPath}${rebuildQuery(req)}`;
  }
  try {
    const app = await getApp();
    return app(req, res);
  } catch (error) {
    console.error('Failed to bootstrap Express app in Vercel handler', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Server bootstrap failed. Check function logs for details.' }));
  }
}
