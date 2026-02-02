import { useEffect, useCallback } from 'react';
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
      // Everyone can add locations
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

interface MapContainerProps {
  className?: string;
}

export function MapContainer({ className = '' }: MapContainerProps) {
  const { isAddingLocation, pendingCoordinates, setPendingCoordinates } = useMap();

  const handleMarkerPositionChange = useCallback(
    (lat: number, lng: number) => {
      setPendingCoordinates({ lat, lng });
    },
    [setPendingCoordinates]
  );

  return (
    <div className={`relative ${className}`}>
      <LeafletMapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom={true}
        className={`w-full h-full ${isAddingLocation ? 'cursor-crosshair' : ''}`}
        style={{ minHeight: '400px' }}
      >
        <MapSync />
        <MapClickHandler />

        {/* OpenStreetMap tiles - free and open source */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Location markers */}
        <LocationMarkers />

        {/* Draggable marker for new location */}
        {pendingCoordinates && (
          <DraggableMarker
            position={pendingCoordinates}
            onPositionChange={handleMarkerPositionChange}
          />
        )}
      </LeafletMapContainer>
    </div>
  );
}
