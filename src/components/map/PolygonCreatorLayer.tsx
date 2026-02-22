import { useState } from 'react';
import { useMapEvents, Polygon, CircleMarker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import type { Coordinates } from '../../types';

// Leaflet-only component — must be inside MapContainer.
// All UI controls are rendered in MapPage as overlays (outside Leaflet context).

interface PolygonCreatorLayerProps {
  active: boolean;
  vertices: Coordinates[];
  onAddVertex: (coords: Coordinates) => void;
}

export function PolygonCreatorLayer({ active, vertices, onAddVertex }: PolygonCreatorLayerProps) {
  const [mousePos, setMousePos] = useState<Coordinates | null>(null);

  useMapEvents({
    click(e) {
      if (!active) return;
      onAddVertex({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
    mousemove(e) {
      if (!active) return;
      setMousePos({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  if (vertices.length === 0) return null;

  const positions = vertices.map(v => [v.lat, v.lng] as L.LatLngTuple);

  return (
    <>
      {/* Filled polygon preview when >= 3 vertices */}
      {vertices.length >= 3 && (
        <Polygon
          positions={positions}
          pathOptions={{
            color: '#6366f1',
            fillColor: '#a5b4fc',
            fillOpacity: 0.25,
            weight: 2,
            dashArray: '6, 4',
          }}
        />
      )}

      {/* Outline between placed vertices */}
      {vertices.length >= 2 && (
        <Polyline
          positions={positions}
          pathOptions={{ color: '#6366f1', weight: 2, dashArray: '6, 4' }}
        />
      )}

      {/* Live preview line from last vertex to cursor */}
      {mousePos && vertices.length >= 1 && (
        <Polyline
          positions={[
            [vertices[vertices.length - 1].lat, vertices[vertices.length - 1].lng],
            [mousePos.lat, mousePos.lng],
          ]}
          pathOptions={{ color: '#6366f1', weight: 2, dashArray: '4, 4', opacity: 0.5 }}
        />
      )}

      {/* Vertex circle markers */}
      {vertices.map((v, i) => (
        <CircleMarker
          key={i}
          center={[v.lat, v.lng]}
          radius={6}
          pathOptions={{
            color: '#6366f1',
            fillColor: i === 0 ? '#22c55e' : '#6366f1',
            fillOpacity: 1,
            weight: 2,
          }}
        />
      ))}
    </>
  );
}
