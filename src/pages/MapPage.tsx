import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '../components/common/Header';
import { OnboardingTour } from '../components/common/OnboardingTour';
import { MapContainer, LocationsList } from '../components/map';
import { HeatmapLayer } from '../components/map/HeatmapLayer';
import { RouteLayer } from '../components/map/RouteLayer';
import { RouteCreatorLayer } from '../components/map/RouteCreator';
import { PolygonCreatorLayer } from '../components/map/PolygonCreatorLayer';
import { ZoneLayer } from '../components/map/ZoneLayer';
import { TimeMachineSlider } from '../components/map/TimeMachineSlider';
import { SearchBar, SearchResults } from '../components/search';
import { LocationForm } from '../components/locations/LocationForm';
import { useAuth } from '../contexts/AuthContext';
import { useMap } from '../contexts/MapContext';
import { useLocations } from '../hooks/useLocations';
import { useSearch } from '../hooks/useSearch';
import { exportAsCSV, exportAsGeoJSON } from '../lib/export';
import { createRoute } from '../lib/api/routes';
import { createZone } from '../lib/api/zones';
import type { Location, LocationFormData, Coordinates, ZoneType } from '../types';

// Haversine formula for route distance calculation
function calcDistance(waypoints: Coordinates[]): number {
  return waypoints.reduce((sum, wp, i) => {
    if (i === 0) return 0;
    const prev = waypoints[i - 1];
    const R = 6371;
    const dLat = ((wp.lat - prev.lat) * Math.PI) / 180;
    const dLng = ((wp.lng - prev.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((prev.lat * Math.PI) / 180) *
        Math.cos((wp.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return sum + R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }, 0);
}

export function MapPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    isAddingLocation, setIsAddingLocation,
    pendingCoordinates, setPendingCoordinates,
    selectedLocation, setSelectedLocation,
    locations: mapLocations, centerOnLocation, selectLocation,
  } = useMap();
  const { addLocation, updateLocation } = useLocations();
  const { results, isSearching, query, search, clearSearch } = useSearch();

  const [showForm, setShowForm] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showLocationsList, setShowLocationsList] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Layer states — default routes & zones to ON so saved data is always visible
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showRoutes, setShowRoutes] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [showTimeMachine, setShowTimeMachine] = useState(false);
  const [filteredLocations, setFilteredLocations] = useState<Location[] | null>(null);
  const [showLayersMenu, setShowLayersMenu] = useState(false);

  // Route creation state (managed here, outside Leaflet context)
  const [isCreatingRoute, setIsCreatingRoute] = useState(false);
  const [routeWaypoints, setRouteWaypoints] = useState<Coordinates[]>([]);
  const [showRouteSaveForm, setShowRouteSaveForm] = useState(false);
  const [routeName, setRouteName] = useState('');
  const [routeType, setRouteType] = useState<'cycling' | 'walking' | 'hiking' | 'other'>('cycling');
  const [routeSaving, setRouteSaving] = useState(false);

  // Zone creation state
  const [isCreatingZone, setIsCreatingZone] = useState(false);
  const [zoneVertices, setZoneVertices] = useState<Coordinates[]>([]);
  const [showZoneSaveForm, setShowZoneSaveForm] = useState(false);
  const [zoneName, setZoneName] = useState('');
  const [zoneType, setZoneType] = useState<ZoneType>('other');
  const [zoneSaving, setZoneSaving] = useState(false);
  const [zoneRefresh, setZoneRefresh] = useState(0);
  const [routeRefresh, setRouteRefresh] = useState(0);

  // Handle shared location link (?location=ID)
  useEffect(() => {
    const locationId = searchParams.get('location');
    if (locationId && mapLocations.length > 0) {
      const loc = mapLocations.find(l => l.id === locationId);
      if (loc) {
        centerOnLocation(loc.latitude, loc.longitude, 16);
        selectLocation(loc);
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, mapLocations, centerOnLocation, selectLocation, setSearchParams]);

  const handleAddLocation = () => {
    setIsAddingLocation(true);
    setIsEditMode(false);
    setSelectedLocation(null);
    setShowForm(false);
  };

  const handleFormSubmit = async (data: LocationFormData, images?: File[], documents?: File[]) => {
    if (!user) return;
    if (isEditMode && selectedLocation) {
      await updateLocation(selectedLocation.id, data);
    } else {
      await addLocation({ ...data, created_by: user.username }, images, documents);
    }
    setShowForm(false);
    setPendingCoordinates(null);
    setIsEditMode(false);
    setSelectedLocation(null);
    setIsAddingLocation(false);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setPendingCoordinates(null);
    setIsAddingLocation(false);
    setIsEditMode(false);
    setSelectedLocation(null);
  };

  useEffect(() => {
    if (pendingCoordinates && !showForm && !isEditMode) {
      setShowForm(true);
    }
  }, [pendingCoordinates, showForm, isEditMode]);

  useEffect(() => {
    if (selectedLocation && !showForm) {
      setIsEditMode(true);
      setShowForm(true);
    }
  }, [selectedLocation, showForm]);

  // Route creation handlers
  const handleStartRouteCreation = () => {
    setIsCreatingRoute(true);
    setIsCreatingZone(false);
    setRouteWaypoints([]);
    setShowLayersMenu(false);
    setIsAddingLocation(false);
  };

  const handleCancelRoute = () => {
    setIsCreatingRoute(false);
    setRouteWaypoints([]);
    setShowRouteSaveForm(false);
  };

  const handleSaveRoute = async () => {
    if (!routeName.trim() || routeWaypoints.length < 2 || !user?.username) return;
    setRouteSaving(true);
    try {
      const dist = calcDistance(routeWaypoints);
      const speedKmH = routeType === 'cycling' ? 15 : 5;
      await createRoute({
        name: routeName.trim(),
        waypoints: routeWaypoints,
        created_by: user.username,
        route_type: routeType,
        distance_km: Math.round(dist * 100) / 100,
        estimated_time_min: Math.round((dist / speedKmH) * 60),
      });
      handleCancelRoute();
      setRouteName('');
      setShowRoutes(true);
      setRouteRefresh(prev => prev + 1);
    } catch (err) {
      console.error('Failed to save route:', err);
      alert(t('routes.saveError', 'Failed to save route. Check console for details.'));
    } finally {
      setRouteSaving(false);
    }
  };

  // Zone creation handlers
  const handleStartZoneCreation = () => {
    setIsCreatingZone(true);
    setIsCreatingRoute(false);
    setZoneVertices([]);
    setShowLayersMenu(false);
    setIsAddingLocation(false);
  };

  const handleCancelZone = () => {
    setIsCreatingZone(false);
    setZoneVertices([]);
    setShowZoneSaveForm(false);
  };

  const handleSaveZone = async () => {
    if (!zoneName.trim() || zoneVertices.length < 3 || !user?.username) return;
    setZoneSaving(true);
    try {
      await createZone({
        name: zoneName.trim(),
        vertices: zoneVertices,
        created_by: user.username,
        zone_type: zoneType,
      });
      handleCancelZone();
      setZoneName('');
      setZoneType('other');
      setShowZones(true);
      setZoneRefresh(prev => prev + 1);
    } catch (err) {
      console.error('Failed to save zone:', err);
      alert(t('zones.saveError', 'Failed to save zone. Check console for details.'));
    } finally {
      setZoneSaving(false);
    }
  };

  const routeDistance = calcDistance(routeWaypoints);
  const displayedLocations = filteredLocations || mapLocations;
  const isDrawing = isCreatingRoute || isCreatingZone;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <OnboardingTour />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-2 sm:gap-3 flex-wrap">

            {/* Search */}
            <div className="flex-1 min-w-[200px] max-w-xl relative" data-tour="search">
              <SearchBar
                onSearch={(q) => { search(q); setShowSearchResults(true); }}
                onClear={() => { clearSearch(); setShowSearchResults(false); }}
                isSearching={isSearching}
              />
              {showSearchResults && query && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <SearchResults results={results} isLoading={isSearching} query={query} />
                  <button
                    onClick={() => setShowSearchResults(false)}
                    className="w-full px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 border-t border-gray-100"
                  >
                    {t('common.close')}
                  </button>
                </div>
              )}
            </div>

            {/* Locations list */}
            <button
              data-tour="locations-list"
              onClick={() => setShowLocationsList(!showLocationsList)}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                showLocationsList ? 'bg-blue-100 text-blue-700' : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span className="hidden sm:inline">{t('map.viewAllLocations')}</span>
            </button>

            {/* ─── Draw Route (dedicated button) ─── */}
            <button
              onClick={isCreatingRoute ? handleCancelRoute : handleStartRouteCreation}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isCreatingRoute
                  ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-400'
                  : 'bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-700'
              }`}
              title={t('routes.create')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span className="hidden sm:inline">
                {isCreatingRoute ? t('common.cancel') : t('routes.draw')}
              </span>
            </button>

            {/* ─── Draw Zone (dedicated button) ─── */}
            <button
              onClick={isCreatingZone ? handleCancelZone : handleStartZoneCreation}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isCreatingZone
                  ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-400'
                  : 'bg-gray-100 text-gray-700 hover:bg-indigo-50 hover:text-indigo-700'
              }`}
              title={t('zones.draw')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2H5z" />
              </svg>
              <span className="hidden sm:inline">
                {isCreatingZone ? t('common.cancel') : t('zones.draw')}
              </span>
            </button>

            {/* Layers menu */}
            <div className="relative" data-tour="layers">
              <button
                onClick={() => setShowLayersMenu(!showLayersMenu)}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  showHeatmap || showRoutes || showZones || showTimeMachine
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <span className="hidden sm:inline">{t('layers.title')}</span>
              </button>

              <AnimatePresence>
                {showLayersMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-200 z-50 w-56 p-2"
                  >
                    {/* Heatmap toggle */}
                    <label className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showHeatmap}
                        onChange={e => setShowHeatmap(e.target.checked)}
                        className="w-4 h-4 rounded text-green-600 focus:ring-green-500"
                      />
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-red-500" />
                        <span className="text-sm text-gray-700">{t('layers.heatmap')}</span>
                      </div>
                    </label>

                    {/* Routes toggle */}
                    <label className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showRoutes}
                        onChange={e => setShowRoutes(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex items-center gap-2">
                        <div className="w-5 border-b-2 border-blue-500 border-dashed" />
                        <span className="text-sm text-gray-700">{t('layers.routes')}</span>
                      </div>
                    </label>

                    {/* Zones toggle */}
                    <label className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showZones}
                        onChange={e => setShowZones(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded border-2 border-indigo-500 bg-indigo-100 opacity-70" />
                        <span className="text-sm text-gray-700">{t('layers.zones')}</span>
                      </div>
                    </label>

                    <hr className="my-1 border-gray-100" />

                    {/* Time machine */}
                    <button
                      onClick={() => { setShowTimeMachine(!showTimeMachine); setShowLayersMenu(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-purple-50 text-left ${showTimeMachine ? 'bg-purple-50' : ''}`}
                    >
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-gray-700">{t('timeMachine.title')}</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Export */}
            <div className="relative" data-tour="export">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span className="hidden sm:inline">{t('export.title')}</span>
              </button>
              {showExportMenu && (
                <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-[160px]">
                  <button
                    onClick={() => { exportAsCSV(mapLocations); setShowExportMenu(false); }}
                    className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 rounded-t-lg"
                  >
                    CSV (.csv)
                  </button>
                  <button
                    onClick={() => { exportAsGeoJSON(mapLocations); setShowExportMenu(false); }}
                    className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 rounded-b-lg border-t border-gray-100"
                  >
                    GeoJSON (.geojson)
                  </button>
                </div>
              )}
            </div>

            {/* Add location */}
            <button
              data-tour="add-location"
              onClick={handleAddLocation}
              disabled={isAddingLocation || isDrawing}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isAddingLocation ? 'bg-green-100 text-green-700' : 'bg-green-600 text-white hover:bg-green-700'
              } disabled:opacity-60`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">{t('map.addLocation')}</span>
            </button>
          </div>
        </div>

        {/* Map instruction banners */}
        <AnimatePresence>
          {isAddingLocation && !showForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-green-50 border-b border-green-200 px-4 py-2 overflow-hidden"
            >
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <p className="text-sm text-green-700">{t('map.clickToAdd')}</p>
                <button onClick={() => setIsAddingLocation(false)} className="text-sm text-green-600 hover:text-green-700 font-medium">
                  {t('common.cancel')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Route creation banner */}
        <AnimatePresence>
          {isCreatingRoute && !showRouteSaveForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-blue-50 border-b border-blue-200 px-4 py-2 overflow-hidden"
            >
              <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <p className="text-sm text-blue-700 font-medium">
                    {t('routes.clickToAddPoints')} &mdash; {routeWaypoints.length} {t('routes.points')}
                    {routeWaypoints.length >= 2 && ` | ${routeDistance.toFixed(2)} km`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {routeWaypoints.length > 0 && (
                    <button
                      onClick={() => setRouteWaypoints(prev => prev.slice(0, -1))}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                    >
                      {t('routes.undo')}
                    </button>
                  )}
                  {routeWaypoints.length >= 2 && (
                    <button
                      onClick={() => setShowRouteSaveForm(true)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      {t('routes.finish')}
                    </button>
                  )}
                  <button
                    onClick={handleCancelRoute}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Zone creation banner */}
        <AnimatePresence>
          {isCreatingZone && !showZoneSaveForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-indigo-50 border-b border-indigo-200 px-4 py-2 overflow-hidden"
            >
              <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2H5z" />
                  </svg>
                  <p className="text-sm text-indigo-700 font-medium">
                    {t('zones.clickToAddVertices')} &mdash; {zoneVertices.length} {t('zones.vertices')}
                    {zoneVertices.length >= 3 && ` | ${t('zones.polygonReady')}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {zoneVertices.length > 0 && (
                    <button
                      onClick={() => setZoneVertices(prev => prev.slice(0, -1))}
                      className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200"
                    >
                      {t('routes.undo')}
                    </button>
                  )}
                  {zoneVertices.length >= 3 && (
                    <button
                      onClick={() => setShowZoneSaveForm(true)}
                      className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      {t('zones.finish')}
                    </button>
                  )}
                  <button
                    onClick={handleCancelZone}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden relative" data-tour="map">

          {/* Locations list panel */}
          <AnimatePresence>
            {showLocationsList && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 'auto', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden border-r border-gray-200"
              >
                <LocationsList onClose={() => setShowLocationsList(false)} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Map section */}
          <div className={`flex-1 relative ${showForm || showLocationsList ? 'hidden md:block' : ''}`}>
            <MapContainer className="h-full">
              <HeatmapLayer locations={displayedLocations} visible={showHeatmap} />
              <RouteLayer visible={showRoutes} refreshTrigger={routeRefresh} />
              <ZoneLayer visible={showZones} refreshTrigger={zoneRefresh} />
              <RouteCreatorLayer
                active={isCreatingRoute}
                waypoints={routeWaypoints}
                onAddWaypoint={(coords) => setRouteWaypoints(prev => [...prev, coords])}
              />
              <PolygonCreatorLayer
                active={isCreatingZone}
                vertices={zoneVertices}
                onAddVertex={(coords) => setZoneVertices(prev => [...prev, coords])}
              />
            </MapContainer>

            {/* Time machine slider - rendered over map but outside Leaflet */}
            <TimeMachineSlider
              locations={mapLocations}
              visible={showTimeMachine}
              onFilteredLocationsChange={setFilteredLocations}
              onClose={() => { setShowTimeMachine(false); setFilteredLocations(null); }}
            />
          </div>

          {/* Form panel */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 100, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="w-full md:w-96 lg:w-[420px] bg-white border-l border-gray-200 flex flex-col overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {isEditMode ? t('locationForm.editTitle') : t('locationForm.createTitle')}
                  </h2>
                  <button onClick={handleFormCancel} className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {pendingCoordinates && (
                  <div className="px-4 py-2 bg-green-50 border-b border-green-100">
                    <div className="flex items-center gap-2 text-sm text-green-700">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      <span className="font-mono text-xs">
                        {pendingCoordinates.lat.toFixed(6)}, {pendingCoordinates.lng.toFixed(6)}
                      </span>
                      <span className="text-green-600 text-xs ml-auto">{t('map.dragToMove')}</span>
                    </div>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto p-4">
                  <LocationForm
                    mode={isEditMode ? 'edit' : 'create'}
                    initialData={isEditMode && selectedLocation ? {
                      name: selectedLocation.name,
                      description: selectedLocation.description || '',
                      description_sr: selectedLocation.description_sr || '',
                      description_en: selectedLocation.description_en || '',
                      latitude: selectedLocation.latitude,
                      longitude: selectedLocation.longitude,
                    } : undefined}
                    onSubmit={handleFormSubmit}
                    onCancel={handleFormCancel}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <img src={`${import.meta.env.BASE_URL}logos/bio-rider-logo.svg`} alt="Bio Rider" className="h-10" />
            </div>
            <div className="flex items-center gap-6">
              <img src={`${import.meta.env.BASE_URL}logos/green-mobility-logo.jpeg`} alt="Green Mobility" className="h-8 object-contain" />
              <img src={`${import.meta.env.BASE_URL}logos/eit-logo.png`} alt="EIT Co-funded" className="h-8 object-contain" />
            </div>
          </div>
        </footer>
      </main>

      {/* Route save modal - rendered at root level, fully outside map */}
      <AnimatePresence>
        {showRouteSaveForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) setShowRouteSaveForm(false); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4"
            >
              <h3 className="font-bold text-lg text-gray-900 mb-1">{t('routes.saveRoute')}</h3>
              <p className="text-sm text-gray-500 mb-4">
                {routeWaypoints.length} {t('routes.points')} &bull; {routeDistance.toFixed(2)} km
              </p>

              <input
                type="text"
                value={routeName}
                onChange={e => setRouteName(e.target.value)}
                placeholder={t('routes.namePlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />

              <select
                value={routeType}
                onChange={e => setRouteType(e.target.value as typeof routeType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="cycling">🚲 {t('routes.cycling')}</option>
                <option value="walking">🚶 {t('routes.walking')}</option>
                <option value="hiking">🥾 {t('routes.hiking')}</option>
                <option value="other">📍 {t('routes.other')}</option>
              </select>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowRouteSaveForm(false)}
                  className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleSaveRoute}
                  disabled={routeSaving || !routeName.trim()}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {routeSaving ? t('locationForm.saving') : t('common.save')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zone save modal - rendered at root level, fully outside map */}
      <AnimatePresence>
        {showZoneSaveForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) setShowZoneSaveForm(false); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4"
            >
              <h3 className="font-bold text-lg text-gray-900 mb-1">{t('zones.saveZone')}</h3>
              <p className="text-sm text-gray-500 mb-4">
                {zoneVertices.length} {t('zones.vertices')}
              </p>

              <input
                type="text"
                value={zoneName}
                onChange={e => setZoneName(e.target.value)}
                placeholder={t('zones.namePlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />

              <select
                value={zoneType}
                onChange={e => setZoneType(e.target.value as ZoneType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="park">🌳 {t('zones.types.park')}</option>
                <option value="cycling">🚲 {t('zones.types.cycling')}</option>
                <option value="restricted">⚠️ {t('zones.types.restricted')}</option>
                <option value="residential">🏠 {t('zones.types.residential')}</option>
                <option value="commercial">🏪 {t('zones.types.commercial')}</option>
                <option value="other">📍 {t('zones.types.other')}</option>
              </select>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowZoneSaveForm(false)}
                  className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleSaveZone}
                  disabled={zoneSaving || !zoneName.trim()}
                  className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  {zoneSaving ? t('locationForm.saving') : t('common.save')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
