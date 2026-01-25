import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { Map as LeafletMap } from 'leaflet';
import type { Location } from '../types';

// Center of Uzice, Serbia
export const DEFAULT_CENTER: [number, number] = [43.8587, 19.8456];
export const DEFAULT_ZOOM = 13;

interface MapContextType {
  map: LeafletMap | null;
  setMap: (map: LeafletMap | null) => void;
  locations: Location[];
  setLocations: (locations: Location[]) => void;
  selectedLocation: Location | null;
  selectLocation: (location: Location | null) => void;
  filteredLocationIds: Set<string> | null;
  setFilteredLocationIds: (ids: Set<string> | null) => void;
  isSearchActive: boolean;
  hoveredLocationId: string | null;
  setHoveredLocationId: (id: string | null) => void;
  centerOnLocation: (lat: number, lng: number, zoom?: number) => void;
  isAddingLocation: boolean;
  setIsAddingLocation: (value: boolean) => void;
  pendingCoordinates: { lat: number; lng: number } | null;
  setPendingCoordinates: (coords: { lat: number; lng: number } | null) => void;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

interface MapProviderProps {
  children: ReactNode;
}

export function MapProvider({ children }: MapProviderProps) {
  const [map, setMap] = useState<LeafletMap | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [filteredLocationIds, setFilteredLocationIds] = useState<Set<string> | null>(null);
  const [hoveredLocationId, setHoveredLocationId] = useState<string | null>(null);
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [pendingCoordinates, setPendingCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  const isSearchActive = filteredLocationIds !== null;

  const selectLocation = useCallback((location: Location | null) => {
    setSelectedLocation(location);

    // Center map on selected location
    if (location && map) {
      map.setView([location.latitude, location.longitude], Math.max(map.getZoom(), 15));
    }
  }, [map]);

  const centerOnLocation = useCallback(
    (lat: number, lng: number, zoom?: number) => {
      if (map) {
        map.setView([lat, lng], zoom ?? map.getZoom());
      }
    },
    [map]
  );

  const value: MapContextType = {
    map,
    setMap,
    locations,
    setLocations,
    selectedLocation,
    selectLocation,
    filteredLocationIds,
    setFilteredLocationIds,
    isSearchActive,
    hoveredLocationId,
    setHoveredLocationId,
    centerOnLocation,
    isAddingLocation,
    setIsAddingLocation,
    pendingCoordinates,
    setPendingCoordinates,
  };

  return (
    <MapContext.Provider value={value}>
      {children}
    </MapContext.Provider>
  );
}

export function useMap(): MapContextType {
  const context = useContext(MapContext);

  if (context === undefined) {
    throw new Error('useMap must be used within a MapProvider');
  }

  return context;
}
