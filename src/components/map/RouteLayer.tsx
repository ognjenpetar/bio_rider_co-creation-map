import { useState, useEffect } from 'react';
import { Polyline } from 'react-leaflet';
import { getRoutes } from '../../lib/api/routes';
import type { Route } from '../../types';
import L from 'leaflet';

interface RouteLayerProps {
  visible: boolean;
  refreshTrigger?: number;
  onSelect?: (route: Route) => void;
}

export function RouteLayer({ visible, refreshTrigger, onSelect }: RouteLayerProps) {
  const [routes, setRoutes] = useState<Route[]>([]);

  useEffect(() => {
    if (visible) {
      getRoutes().then(setRoutes).catch(console.error);
    }
  }, [visible, refreshTrigger]);

  if (!visible || routes.length === 0) return null;

  return (
    <>
      {routes.map(route => {
        const positions = route.waypoints.map(wp => [wp.lat, wp.lng] as L.LatLngTuple);
        if (positions.length < 2) return null;

        return (
          <Polyline
            key={route.id}
            positions={positions}
            pathOptions={{
              color: route.color,
              weight: 4,
              opacity: 0.8,
              dashArray: route.route_type === 'hiking' ? '10, 5' : undefined,
            }}
            eventHandlers={{
              click: () => onSelect?.(route),
            }}
          />
        );
      })}
    </>
  );
}
