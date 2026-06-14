import React, { useEffect, useCallback } from 'react';
import {
  MapContainer as LeafletMapContainer,
  TileLayer,
  useMap as useLeafletMap,
  useMapEvents,
} from 'react-leaflet';
import type { LeafletMouseEvent } from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { useMap, DEFAULT_CENTER, DEFAULT_ZOOM } from '../../contexts/MapContext';
import { LocationMarkers } from './LocationMarkers';
import { DraggableMarker } from './DraggableMarker';

// Fix for default marker icons in React-Leaflet
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-expect-error - Fix for default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Component to sync map instance with context
function MapSync() {
  const leafletMap = useLeafletMap();
  const { setMap } = useMap();

  useEffect(() => {
    setMap(leafletMap);
    return () => setMap(null);
  }, [leafletMap, setMap]);

  return null;
}

// Component to handle map click events for adding locations
function MapClickHandler() {
  const {
    isAddingLocation,
    setPendingCoordinates,
    setIsAddingLocation,
  } = useMap();

  const handleClick = useCallback(
    (e: LeafletMouseEvent) => {
      if (isAddingLocation) {
        setPendingCoordinates({
          lat: e.latlng.lat,
          lng: e.latlng.lng,
        });
        setIsAddingLocation(false);
      }
    },
    [isAddingLocation, setPendingCoordinates, setIsAddingLocation]
  );

  useMapEvents({
    click: handleClick,
  });

  return null;
}

export type BaseMap = 'osm' | 'satellite';

const TILE_LAYERS: Record<BaseMap, { url: string; attribution: string; maxZoom: number; maxNativeZoom: number }> = {
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 21,
    maxNativeZoom: 19,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &mdash; Source: Esri, DigitalGlobe, USGS',
    maxZoom: 21,
    maxNativeZoom: 18,
  },
};

interface MapContainerProps {
  className?: string;
  children?: React.ReactNode;
  onLocationOpenDetail?: (location: import('../../types').Location) => void;
  baseMap?: BaseMap;
}

export function MapContainer({ className = '', children, onLocationOpenDetail, baseMap = 'osm' }: MapContainerProps) {
  const { isAddingLocation, pendingCoordinates, setPendingCoordinates } = useMap();

  const handleMarkerPositionChange = useCallback(
    (lat: number, lng: number) => {
      setPendingCoordinates({ lat, lng });
    },
    [setPendingCoordinates]
  );

  const tileLayer = TILE_LAYERS[baseMap];

  return (
    <div className={`relative ${className}`}>
      <LeafletMapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        maxZoom={21}
        scrollWheelZoom={true}
        className={`w-full h-full ${isAddingLocation ? 'cursor-crosshair' : ''}`}
        style={{ minHeight: '400px' }}
      >
        <MapSync />
        <MapClickHandler />

        <TileLayer
          key={baseMap}
          attribution={tileLayer.attribution}
          url={tileLayer.url}
          maxZoom={tileLayer.maxZoom}
          maxNativeZoom={tileLayer.maxNativeZoom}
        />

        <LocationMarkers onOpenDetail={onLocationOpenDetail} />

        {pendingCoordinates && (
          <DraggableMarker
            position={pendingCoordinates}
            onPositionChange={handleMarkerPositionChange}
          />
        )}

        {children}
      </LeafletMapContainer>
    </div>
  );
}
