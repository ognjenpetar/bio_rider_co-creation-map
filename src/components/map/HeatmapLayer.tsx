import { useEffect } from 'react';
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

  useEffect(() => {
    if (!visible || locations.length === 0) return;

    const points: L.HeatLatLngTuple[] = locations.map(loc => [
      loc.latitude,
      loc.longitude,
      0.8, // intensity
    ]);

    const heat = (L as unknown as { heatLayer: (latlngs: L.HeatLatLngTuple[], options?: L.HeatMapOptions) => L.Layer }).heatLayer(points, {
      radius: 30,
      blur: 20,
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

    heat.addTo(map);

    return () => {
      map.removeLayer(heat);
    };
  }, [map, locations, visible]);

  return null;
}
