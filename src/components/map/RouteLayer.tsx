import { useState, useEffect } from 'react';
import { Polyline, Popup } from 'react-leaflet';
import { useTranslation } from 'react-i18next';
import { getRoutes } from '../../lib/api/routes';
import type { Route } from '../../types';
import L from 'leaflet';

interface RouteLayerProps {
  visible: boolean;
  refreshTrigger?: number;
}

const routeTypeIcons: Record<string, string> = {
  cycling: '&#128690;',
  walking: '&#128694;',
  hiking: '&#9968;',
  other: '&#128205;',
};

export function RouteLayer({ visible, refreshTrigger }: RouteLayerProps) {
  const { t } = useTranslation();
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
          >
            <Popup>
              <div className="min-w-[200px]">
                <h3 className="font-semibold text-gray-900">
                  <span dangerouslySetInnerHTML={{ __html: routeTypeIcons[route.route_type] || '' }} />{' '}
                  {route.name}
                </h3>
                {route.description && (
                  <p className="text-sm text-gray-600 mt-1">{route.description}</p>
                )}
                <div className="flex gap-3 mt-2 text-xs text-gray-500">
                  {route.distance_km && (
                    <span>{route.distance_km} km</span>
                  )}
                  {route.estimated_time_min && (
                    <span>{route.estimated_time_min} {t('routes.minutes')}</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {t('location.createdBy')}: {route.created_by}
                </p>
              </div>
            </Popup>
          </Polyline>
        );
      })}
    </>
  );
}
