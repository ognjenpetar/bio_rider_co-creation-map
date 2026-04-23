import { useMemo } from 'react';
import L from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { useMap } from '../../contexts/MapContext';
import { LocationMarker } from './LocationMarker';
import type { Location } from '../../types';

interface LocationMarkersProps {
  onOpenDetail?: (location: Location) => void;
}

export function LocationMarkers({ onOpenDetail }: LocationMarkersProps) {
  const {
    locations,
    selectedLocation,
    filteredLocationIds,
    isSearchActive,
    hoveredLocationId,
  } = useMap();

  const visibleLocations = useMemo(() => {
    if (!isSearchActive || !filteredLocationIds) return locations;
    return locations.filter(loc => filteredLocationIds.has(loc.id));
  }, [locations, filteredLocationIds, isSearchActive]);

  const dimmedLocationIds = useMemo(() => {
    if (!isSearchActive || !filteredLocationIds) return new Set<string>();
    return new Set(locations.filter(loc => !filteredLocationIds.has(loc.id)).map(loc => loc.id));
  }, [locations, filteredLocationIds, isSearchActive]);

  return (
    <>
      <MarkerClusterGroup
        chunkedLoading
        maxClusterRadius={50}
        spiderfyOnMaxZoom
        showCoverageOnHover={false}
        iconCreateFunction={(cluster: any) => {
          const count = cluster.getChildCount();
          let size = 'small';
          if (count >= 10) size = 'medium';
          if (count >= 30) size = 'large';
          return L.divIcon({
            html: `<div class="cluster-marker cluster-${size}"><span>${count}</span></div>`,
            className: 'custom-cluster-icon',
            iconSize: L.point(40, 40, true),
          });
        }}
      >
        {visibleLocations.map(location => (
          <LocationMarker
            key={location.id}
            location={location}
            isSelected={selectedLocation?.id === location.id}
            isHovered={hoveredLocationId === location.id}
            isDimmed={dimmedLocationIds.has(location.id)}
            onOpenDetail={onOpenDetail}
          />
        ))}
      </MarkerClusterGroup>

      {isSearchActive &&
        locations
          .filter(loc => dimmedLocationIds.has(loc.id))
          .map(location => (
            <LocationMarker
              key={location.id}
              location={location}
              isSelected={false}
              isHovered={false}
              isDimmed={true}
              onOpenDetail={onOpenDetail}
            />
          ))}
    </>
  );
}
