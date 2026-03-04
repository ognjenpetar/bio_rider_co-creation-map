import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMap } from '../../contexts/MapContext';
import { getRoutes } from '../../lib/api/routes';
import { getZones } from '../../lib/api/zones';
import type { Location, Route, Zone } from '../../types';
import L from 'leaflet';

type FilterTab = 'all' | 'points' | 'routes' | 'zones';

interface LocationsListProps {
  onClose: () => void;
}

const routeTypeIcons: Record<string, string> = {
  cycling: '\u{1F6B2}',
  walking: '\u{1F6B6}',
  hiking: '\u26F0\uFE0F',
  other: '\u{1F4CD}',
};

const zoneTypeIcons: Record<string, string> = {
  park: '\u{1F333}',
  cycling: '\u{1F6B2}',
  restricted: '\u26A0\uFE0F',
  residential: '\u{1F3E0}',
  commercial: '\u{1F3EA}',
  other: '\u{1F4CD}',
};

export function LocationsList({ onClose }: LocationsListProps) {
  const { t, i18n } = useTranslation();
  const { locations, centerOnLocation, map } = useMap();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [routes, setRoutes] = useState<Route[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [loadingZones, setLoadingZones] = useState(false);

  // Load routes and zones on mount
  useEffect(() => {
    setLoadingRoutes(true);
    getRoutes().then(setRoutes).catch(console.error).finally(() => setLoadingRoutes(false));
    setLoadingZones(true);
    getZones().then(setZones).catch(console.error).finally(() => setLoadingZones(false));
  }, []);

  const handleLocationClick = (location: Location) => {
    centerOnLocation(location.latitude, location.longitude, 16);
  };

  const handleRouteClick = (route: Route) => {
    if (!map || route.waypoints.length === 0) return;
    const bounds = L.latLngBounds(route.waypoints.map(wp => [wp.lat, wp.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [50, 50] });
  };

  const handleZoneClick = (zone: Zone) => {
    if (!map || zone.vertices.length === 0) return;
    const bounds = L.latLngBounds(zone.vertices.map(v => [v.lat, v.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [50, 50] });
  };

  const totalCount =
    activeTab === 'all' ? locations.length + routes.length + zones.length
    : activeTab === 'points' ? locations.length
    : activeTab === 'routes' ? routes.length
    : zones.length;

  const tabs: { key: FilterTab; label: string; count: number; color: string }[] = [
    { key: 'all', label: t('list.all', 'All'), count: locations.length + routes.length + zones.length, color: 'gray' },
    { key: 'points', label: t('list.points', 'Points'), count: locations.length, color: 'green' },
    { key: 'routes', label: t('list.routes', 'Routes'), count: routes.length, color: 'blue' },
    { key: 'zones', label: t('list.zones', 'Zones'), count: zones.length, color: 'indigo' },
  ];

  const showPoints = activeTab === 'all' || activeTab === 'points';
  const showRoutes = activeTab === 'all' || activeTab === 'routes';
  const showZones = activeTab === 'all' || activeTab === 'zones';

  return (
    <div className="w-full md:w-96 lg:w-[420px] bg-white border-r border-gray-200 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {t('map.allLocations')}
          </h2>
          <p className="text-sm text-gray-500">
            {totalCount} {t('list.items', 'items')}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-gray-200 bg-white px-2 pt-2 gap-1">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-2 py-2 text-xs font-medium rounded-t-lg transition-colors ${
              activeTab === tab.key
                ? 'bg-gray-100 text-gray-900 border-b-2 border-gray-900'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab.label}
            <span className={`ml-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-semibold rounded-full ${
              activeTab === tab.key ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {totalCount === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-gray-500">{t('map.noLocations')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {/* Points section */}
            {showPoints && locations.length > 0 && activeTab === 'all' && (
              <div className="px-4 py-2 bg-green-50 text-xs font-semibold text-green-700 uppercase tracking-wide">
                {t('list.points', 'Points')} ({locations.length})
              </div>
            )}
            {showPoints && locations.map((location, index) => (
              <button
                key={`loc-${location.id}`}
                onClick={() => handleLocationClick(location)}
                className="w-full px-4 py-3 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-start gap-3">
                  {location.preview_image_url ? (
                    <img
                      src={location.preview_image_url}
                      alt=""
                      className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-semibold text-white bg-green-600 rounded-full">
                        {index + 1}
                      </span>
                      <h3 className="font-semibold text-gray-900 text-sm truncate">
                        {location.name}
                      </h3>
                    </div>
                    {(() => {
                      const desc = (i18n.language === 'sr' ? location.description_sr : location.description_en) || location.description;
                      return desc ? (
                        <p className="text-xs text-gray-600 line-clamp-2 mb-1">{desc}</p>
                      ) : null;
                    })()}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                      {location.created_by && (
                        <span>{location.created_by}</span>
                      )}
                      <span className="font-mono">
                        {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                      </span>
                      <span>{new Date(location.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}

            {/* Routes section */}
            {showRoutes && routes.length > 0 && activeTab === 'all' && (
              <div className="px-4 py-2 bg-blue-50 text-xs font-semibold text-blue-700 uppercase tracking-wide">
                {t('list.routes', 'Routes')} ({routes.length})
              </div>
            )}
            {showRoutes && loadingRoutes && (
              <div className="px-4 py-3 text-sm text-gray-400">{t('common.loading')}</div>
            )}
            {showRoutes && routes.map((route, index) => (
              <button
                key={`route-${route.id}`}
                onClick={() => handleRouteClick(route)}
                className="w-full px-4 py-3 hover:bg-blue-50/50 transition-colors text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">{routeTypeIcons[route.route_type] || '\u{1F4CD}'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-semibold text-white bg-blue-600 rounded-full">
                        {index + 1}
                      </span>
                      <h3 className="font-semibold text-gray-900 text-sm truncate">
                        {route.name}
                      </h3>
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-medium rounded">
                        {t(`routes.${route.route_type}`, route.route_type)}
                      </span>
                    </div>
                    {route.description && (
                      <p className="text-xs text-gray-600 line-clamp-2 mb-1">{route.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                      {route.distance_km != null && (
                        <span>{route.distance_km} km</span>
                      )}
                      {route.estimated_time_min != null && (
                        <span>{route.estimated_time_min} min</span>
                      )}
                      <span>{route.waypoints.length} {t('routes.points')}</span>
                      {route.created_by && <span>{route.created_by}</span>}
                      <span>{new Date(route.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}

            {/* Zones section */}
            {showZones && zones.length > 0 && activeTab === 'all' && (
              <div className="px-4 py-2 bg-indigo-50 text-xs font-semibold text-indigo-700 uppercase tracking-wide">
                {t('list.zones', 'Zones')} ({zones.length})
              </div>
            )}
            {showZones && loadingZones && (
              <div className="px-4 py-3 text-sm text-gray-400">{t('common.loading')}</div>
            )}
            {showZones && zones.map((zone, index) => (
              <button
                key={`zone-${zone.id}`}
                onClick={() => handleZoneClick(zone)}
                className="w-full px-4 py-3 hover:bg-indigo-50/50 transition-colors text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">{zoneTypeIcons[zone.zone_type] || '\u{1F4CD}'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-semibold text-white bg-indigo-600 rounded-full">
                        {index + 1}
                      </span>
                      <h3 className="font-semibold text-gray-900 text-sm truncate">
                        {zone.name}
                      </h3>
                      <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-medium rounded">
                        {t(`zones.types.${zone.zone_type}`, zone.zone_type)}
                      </span>
                    </div>
                    {zone.description && (
                      <p className="text-xs text-gray-600 line-clamp-2 mb-1">{zone.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                      <span>{zone.vertices.length} {t('zones.vertices')}</span>
                      {zone.created_by && <span>{zone.created_by}</span>}
                      <span>{new Date(zone.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
