const geocodeCache = new Map();
const inflight = new Map();
const MAX_CACHE_SIZE = 500;
const GEOCODE_TIMEOUT_MS = 5000;
const POSITIVE_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const NEGATIVE_CACHE_TTL_MS = 5 * 60 * 1000;

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
  if (geocodeCache.has(key)) {
    geocodeCache.delete(key);
  }
  if (geocodeCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = geocodeCache.keys().next().value;
    if (oldestKey) geocodeCache.delete(oldestKey);
  }
  geocodeCache.set(key, value);
}

function cacheSetPositive(key, lat, lon) {
  cacheSet(key, {
    kind: 'positive',
    lat,
    lon,
    expiresAt: Date.now() + POSITIVE_CACHE_TTL_MS,
  });
}

function cacheSetNegative(key) {
  cacheSet(key, {
    kind: 'negative',
    expiresAt: Date.now() + NEGATIVE_CACHE_TTL_MS,
  });
}

function getCachedResult(key) {
  const entry = geocodeCache.get(key);
  if (!entry) return { hit: false, value: null };

  if (entry.expiresAt <= Date.now()) {
    geocodeCache.delete(key);
    return { hit: false, value: null };
  }

  // Promote to most recently used entry.
  geocodeCache.delete(key);
  geocodeCache.set(key, entry);

  if (entry.kind === 'negative') {
    return { hit: true, value: null };
  }

  return { hit: true, value: { lat: entry.lat, lon: entry.lon } };
}

export async function geocodeQuery(rawQuery) {
  const query = normalizeQuery(rawQuery);
  if (!query) return null;

  const cached = getCachedResult(query);
  if (cached.hit) {
    return cached.value;
  }

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

    if (!res.ok) {
      cacheSetNegative(query);
      return null;
    }
    let data;
    try {
      data = await res.json();
    } catch {
      cacheSetNegative(query);
      return null;
    }
    if (!Array.isArray(data) || data.length === 0) {
      cacheSetNegative(query);
      return null;
    }
    const first = data[0];
    const lat = Number(first.lat);
    const lon = Number(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      cacheSetNegative(query);
      return null;
    }
    const hit = { lat, lon };
    cacheSetPositive(query, lat, lon);
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
