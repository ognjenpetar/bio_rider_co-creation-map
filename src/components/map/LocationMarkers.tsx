import { useMemo } from 'react';
import { useMap } from '../../contexts/MapContext';
import { LocationMarker } from './LocationMarker';

export function LocationMarkers() {
  const {
    locations,
    selectedLocation,
    filteredLocationIds,
    isSearchActive,
    hoveredLocationId,
  } = useMap();

  // Filter locations based on search
  const visibleLocations = useMemo(() => {
    if (!isSearchActive || !filteredLocationIds) {
      return locations;
    }
    return locations.filter((loc) => filteredLocationIds.has(loc.id));
  }, [locations, filteredLocationIds, isSearchActive]);

  // Dimmed locations (when search is active but location doesn't match)
  const dimmedLocationIds = useMemo(() => {
    if (!isSearchActive || !filteredLocationIds) {
      return new Set<string>();
    }
    return new Set(
      locations
        .filter((loc) => !filteredLocationIds.has(loc.id))
        .map((loc) => loc.id)
    );
  }, [locations, filteredLocationIds, isSearchActive]);

  return (
    <>
      {/* Render visible markers */}
      {visibleLocations.map((location) => (
        <LocationMarker
          key={location.id}
          location={location}
          isSelected={selectedLocation?.id === location.id}
          isHovered={hoveredLocationId === location.id}
          isDimmed={dimmedLocationIds.has(location.id)}
        />
      ))}

      {/* Render dimmed markers when search is active */}
      {isSearchActive &&
        locations
          .filter((loc) => dimmedLocationIds.has(loc.id))
          .map((location) => (
            <LocationMarker
              key={location.id}
              location={location}
              isSelected={false}
              isHovered={false}
              isDimmed={true}
            />
          ))}
    </>
  );
}
