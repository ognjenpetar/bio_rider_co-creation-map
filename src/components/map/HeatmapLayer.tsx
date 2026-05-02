import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import type { Location } from '../../types';

export interface HeatmapOptions {
  radius: number;
  blur: number;
  intensity: number;
}

interface HeatmapLayerProps {
  locations: Location[];
  visible: boolean;
  options: HeatmapOptions;
}

// Haversine distance in km between two points
function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Calculate a good default radius based on average nearest-neighbour distance
export function calcAutoRadius(locations: Location[]): number {
  if (locations.length < 2) return 35;

  let totalNearest = 0;
  for (const loc of locations) {
    let nearest = Infinity;
    for (const other of locations) {
      if (other === loc) continue;
      const d = distanceKm(loc.latitude, loc.longitude, other.latitude, other.longitude);
      if (d < nearest) nearest = d;
    }
    totalNearest += nearest;
  }
  const avgNearest = totalNearest / locations.length;

  // Map average nearest distance (km) → pixel radius
  // 0–0.5 km → 20px, 0.5–2 km → 35px, 2–10 km → 55px, 10+ km → 80px
  if (avgNearest < 0.5) return 20;
  if (avgNearest < 2) return Math.round(20 + ((avgNearest - 0.5) / 1.5) * 15);
  if (avgNearest < 10) return Math.round(35 + ((avgNearest - 2) / 8) * 20);
  return 80;
}

export function HeatmapLayer({ locations, visible, options }: HeatmapLayerProps) {
  const map = useMap();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const heatRef = useRef<any>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const heatFn = (L as any).heatLayer;
    if (!heatFn) return;

    if (!visible) {
      if (heatRef.current) {
        map.removeLayer(heatRef.current);
        heatRef.current = null;
      }
      return;
    }

    if (locations.length === 0) return;

    const points = locations.map(loc => [loc.latitude, loc.longitude, options.intensity]);

    if (heatRef.current) {
      map.removeLayer(heatRef.current);
    }

    heatRef.current = heatFn(points, {
      radius: options.radius,
      blur: options.blur,
      maxZoom: 17,
      max: 1.0,
      gradient: {
        0.2: '#22c55e',
        0.4: '#84cc16',
        0.6: '#eab308',
        0.8: '#f97316',
        1.0: '#ef4444',
      },
    });

    heatRef.current.addTo(map);

    return () => {
      if (heatRef.current) {
        map.removeLayer(heatRef.current);
        heatRef.current = null;
      }
    };
  }, [map, locations, visible, options]);

  return null;
}
