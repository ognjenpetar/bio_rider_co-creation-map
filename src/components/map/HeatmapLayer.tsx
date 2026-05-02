import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import type { Location } from '../../types';

interface HeatmapLayerProps {
  locations: Location[];
  visible: boolean;
}

export function HeatmapLayer({ locations, visible }: HeatmapLayerProps) {
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

    const points = locations.map(loc => [loc.latitude, loc.longitude, 0.8]);

    if (heatRef.current) {
      map.removeLayer(heatRef.current);
    }

    heatRef.current = heatFn(points, {
      radius: 35,
      blur: 25,
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
  }, [map, locations, visible]);

  return null;
}
