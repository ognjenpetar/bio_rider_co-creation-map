import { useEffect, useState } from 'react';
import { Polygon } from 'react-leaflet';
import { getZones } from '../../lib/api/zones';
import type { Zone } from '../../types';

interface ZoneLayerProps {
  visible: boolean;
  refreshTrigger?: number;
  onSelect?: (zone: Zone) => void;
}

export function ZoneLayer({ visible, refreshTrigger, onSelect }: ZoneLayerProps) {
  const [zones, setZones] = useState<Zone[]>([]);

  useEffect(() => {
    if (!visible) return;
    getZones().then(setZones).catch(console.error);
  }, [visible, refreshTrigger]);

  if (!visible || zones.length === 0) return null;

  return (
    <>
      {zones.map(zone => (
        <Polygon
          key={zone.id}
          positions={zone.vertices.map(v => [v.lat, v.lng] as [number, number])}
          pathOptions={{
            color: zone.color,
            fillColor: zone.fill_color,
            fillOpacity: 0.3,
            weight: 2,
          }}
          eventHandlers={{
            click: () => onSelect?.(zone),
          }}
        />
      ))}
    </>
  );
}
