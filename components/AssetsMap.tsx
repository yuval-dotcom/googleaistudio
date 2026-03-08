import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Property } from '../types';

type GeocodedPoint = {
  propertyId: string;
  lat: number;
  lon: number;
};

const GEOCODE_CACHE_KEY = 'assets_map_geocode_cache_v1';
const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function normalizeAddress(address: string, country: string): string {
  return `${address || ''}, ${country || ''}`.trim();
}

function readCache(): Record<string, { lat: number; lon: number }> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(GEOCODE_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeCache(cache: Record<string, { lat: number; lon: number }>) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(GEOCODE_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore cache persistence issues and keep map functional.
  }
}

async function geocodeAddress(query: string): Promise<{ lat: number; lon: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  const first = data[0];
  const lat = Number(first.lat);
  const lon = Number(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { lat, lon };
}

interface AssetsMapProps {
  properties: Property[];
  onSelectProperty: (property: Property) => void;
}

export const AssetsMap: React.FC<AssetsMapProps> = ({ properties, onSelectProperty }) => {
  const [points, setPoints] = useState<GeocodedPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [failedCount, setFailedCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!properties.length) {
        setPoints([]);
        setFailedCount(0);
        return;
      }
      setIsLoading(true);
      const cache = readCache();
      const next: GeocodedPoint[] = [];
      let failures = 0;

      for (const property of properties) {
        const query = normalizeAddress(property.address, property.country);
        if (!query.trim()) {
          failures += 1;
          continue;
        }

        const cached = cache[query];
        if (cached) {
          next.push({ propertyId: property.id, lat: cached.lat, lon: cached.lon });
          continue;
        }

        const hit = await geocodeAddress(query);
        if (hit) {
          cache[query] = hit;
          next.push({ propertyId: property.id, lat: hit.lat, lon: hit.lon });
        } else {
          failures += 1;
        }
      }

      if (cancelled) return;
      writeCache(cache);
      setPoints(next);
      setFailedCount(failures);
      setIsLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [properties]);

  const center = useMemo<[number, number]>(() => {
    if (!points.length) return [31.7683, 35.2137];
    const lat = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
    const lon = points.reduce((sum, p) => sum + p.lon, 0) / points.length;
    return [lat, lon];
  }, [points]);

  const propertyById = useMemo(() => {
    const map = new Map<string, Property>();
    for (const p of properties) map.set(p.id, p);
    return map;
  }, [properties]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3 mb-4">
      <div className="mb-2">
        <h3 className="text-sm font-bold text-gray-900">Assets Map</h3>
        <p className="text-[11px] text-gray-500">
          {isLoading ? 'Geocoding asset addresses...' : `${points.length} assets placed on map`}
          {failedCount > 0 ? ` • ${failedCount} addresses not found` : ''}
        </p>
      </div>

      <div className="h-72 rounded-lg overflow-hidden border border-gray-100">
        <MapContainer center={center} zoom={4} scrollWheelZoom className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {points.map((point) => {
            const property = propertyById.get(point.propertyId);
            if (!property) return null;
            return (
              <Marker key={point.propertyId} position={[point.lat, point.lon]} icon={markerIcon}>
                <Popup>
                  <div className="space-y-1">
                    <div className="font-bold text-xs">{property.address}</div>
                    <div className="text-[11px] text-gray-600">{property.country}</div>
                    <button
                      className="text-[11px] font-bold text-brand-600 underline"
                      onClick={() => onSelectProperty(property)}
                      type="button"
                    >
                      Open asset
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};
