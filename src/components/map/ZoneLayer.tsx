import { useEffect, useState } from 'react';
import { Polygon, Tooltip } from 'react-leaflet';
import { getZones } from '../../lib/api/zones';
import type { Zone } from '../../types';

interface ZoneLayerProps {
  visible: boolean;
  refreshTrigger?: number;
}

const ZONE_LABELS: Record<string, string> = {
  park: '🌳 Park',
  cycling: '🚲 Cycling Zone',
  restricted: '⚠️ Restricted',
  residential: '🏠 Residential',
  commercial: '🏪 Commercial',
  other: '📍 Zone',
};

export function ZoneLayer({ visible, refreshTrigger }: ZoneLayerProps) {
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
        >
          <Tooltip>
            <div className="p-1">
              <div className="font-semibold text-sm">{zone.name}</div>
              <div className="text-xs text-gray-500">{ZONE_LABELS[zone.zone_type] ?? zone.zone_type}</div>
            </div>
          </Tooltip>
        </Polygon>
      ))}
    </>
  );
}
