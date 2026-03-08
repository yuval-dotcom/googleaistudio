const geocodeCache = new Map();
const inflight = new Map();
const MAX_CACHE_SIZE = 500;
const GEOCODE_TIMEOUT_MS = 5000;

function makeGeocodeTimeoutError() {
  const err = new Error('Geocode request timed out');
  err.code = 'GEOCODE_TIMEOUT';
  return err;
}

function normalizeQuery(raw) {
  return String(raw || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function cacheSet(key, value) {
  if (geocodeCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = geocodeCache.keys().next().value;
    if (oldestKey) geocodeCache.delete(oldestKey);
  }
  geocodeCache.set(key, value);
}

export async function geocodeQuery(rawQuery) {
  const query = normalizeQuery(rawQuery);
  if (!query) return null;

  const cached = geocodeCache.get(query);
  if (cached) return cached;

  const existing = inflight.get(query);
  if (existing) return existing;

  const request = (async () => {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GEOCODE_TIMEOUT_MS);
    let res;
    try {
      res = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'RE-Investor-Pro/1.0',
        },
        signal: controller.signal,
      });
    } catch (error) {
      if (
        (error instanceof Error && error.name === 'AbortError') ||
        controller.signal.aborted
      ) {
        throw makeGeocodeTimeoutError();
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const first = data[0];
    const lat = Number(first.lat);
    const lon = Number(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    const hit = { lat, lon };
    cacheSet(query, hit);
    return hit;
  })()
    .catch((error) => {
      if (error instanceof Error && error.code === 'GEOCODE_TIMEOUT') {
        throw error;
      }
      return null;
    })
    .finally(() => {
      inflight.delete(query);
    });

  inflight.set(query, request);
  return request;
}
