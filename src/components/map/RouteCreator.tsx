import { useMapEvents, Polyline, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import type { Coordinates } from '../../types';

// This component handles ONLY Leaflet map interactions (must be inside MapContainer).
// The floating UI controls are rendered in MapPage as an overlay (outside Leaflet context).

interface RouteCreatorLayerProps {
  active: boolean;
  waypoints: Coordinates[];
  onAddWaypoint: (coords: Coordinates) => void;
}

export function RouteCreatorLayer({ active, waypoints, onAddWaypoint }: RouteCreatorLayerProps) {
  const positions = waypoints.map(wp => [wp.lat, wp.lng] as L.LatLngTuple);

  useMapEvents({
    click(e) {
      if (!active) return;
      onAddWaypoint({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  if (waypoints.length === 0) return null;

  return (
    <>
      {positions.length >= 2 && (
        <Polyline
          positions={positions}
          pathOptions={{ color: '#3b82f6', weight: 4, dashArray: '8, 4' }}
        />
      )}
      {waypoints.map((wp, i) => (
        <CircleMarker
          key={i}
          center={[wp.lat, wp.lng]}
          radius={6}
          pathOptions={{
            color: '#3b82f6',
            fillColor: i === 0 ? '#22c55e' : '#3b82f6',
            fillOpacity: 1,
            weight: 2,
          }}
        />
      ))}
    </>
  );
}
