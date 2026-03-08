import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIconUrl from 'leaflet/dist/images/marker-icon.png';
import markerIconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png';
import type { Property } from '../types';
import { getToken } from '../services/nodeAuthService';

type GeocodedPoint = {
  propertyId: string;
  lat: number;
  lon: number;
};

const markerIcon = new L.Icon({
  iconUrl: markerIconUrl,
  iconRetinaUrl: markerIconRetinaUrl,
  shadowUrl: markerShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
const GEOCODE_BATCH_SIZE = 5;

function normalizeAddress(address: string, country: string): string {
  const addressPart = String(address || '').trim();
  if (!addressPart) return '';
  const countryPart = String(country || '').trim();
  return countryPart ? `${addressPart}, ${countryPart}` : addressPart;
}

async function geocodeAddress(query: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const token = getToken();
    const res = await fetch('/api/geocode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const lat = Number(data?.lat);
    const lon = Number(data?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return { lat, lon };
  } catch {
    return null;
  }
}

async function geocodeInBatches(properties: Property[]): Promise<{ next: GeocodedPoint[]; failures: number }> {
  const next: GeocodedPoint[] = [];
  let failures = 0;

  for (let i = 0; i < properties.length; i += GEOCODE_BATCH_SIZE) {
    const chunk = properties.slice(i, i + GEOCODE_BATCH_SIZE);
    const results = await Promise.all(
      chunk.map(async (property) => {
        const query = normalizeAddress(property.address, property.country);
        if (!query) return { propertyId: property.id, hit: null };
        const hit = await geocodeAddress(query);
        return { propertyId: property.id, hit };
      })
    );

    results.forEach(({ propertyId, hit }) => {
      if (hit) {
        next.push({ propertyId, lat: hit.lat, lon: hit.lon });
      } else {
        failures += 1;
      }
    });
  }

  return { next, failures };
}

const MapRecenter: React.FC<{ center: [number, number]; points: GeocodedPoint[] }> = ({ center, points }) => {
  const map = useMap();
  useEffect(() => {
    if (!points.length) {
      map.setView(center, 4);
      return;
    }
    if (points.length === 1) {
      map.setView(center, 12);
      return;
    }
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lon] as [number, number]));
    map.fitBounds(bounds, { padding: [24, 24] });
  }, [map, center, points]);
  return null;
};

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
      setIsLoading(true);
      try {
        if (!properties.length) {
          setPoints([]);
          setFailedCount(0);
          return;
        }

        const { next, failures } = await geocodeInBatches(properties);

        if (cancelled) return;
        setPoints(next);
        setFailedCount(failures);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
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
          <MapRecenter center={center} points={points} />
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
