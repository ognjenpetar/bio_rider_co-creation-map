import { useMemo } from 'react';
import { Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { useMap } from '../../contexts/MapContext';
import { createCustomIcon } from './customMarkerIcon';
import type { Location } from '../../types';

interface LocationMarkerProps {
  location: Location;
  isSelected: boolean;
  isHovered: boolean;
  isDimmed: boolean;
  onOpenDetail?: (location: Location) => void;
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function LocationMarker({
  location,
  isSelected,
  isHovered,
  isDimmed,
  onOpenDetail,
}: LocationMarkerProps) {
  const { selectLocation, setHoveredLocationId } = useMap();

  const icon = useMemo(() => {
    const isNew = Date.now() - new Date(location.created_at).getTime() < SEVEN_DAYS_MS;
    const creatorInitial = location.created_by?.charAt(0).toUpperCase() || '?';
    const opacity = isDimmed ? 0.4 : 1;

    if (isSelected || isHovered) {
      const size = isSelected ? 44 : 40;
      const borderColor = isSelected ? '#0284c7' : '#0ea5e9';
      const bgColor = isSelected ? '#0369a1' : '#0284c7';
      return L.divIcon({
        html: `
          <div style="position:relative;width:${size}px;height:${size}px;opacity:${opacity}">
            <div style="
              width:${size}px;height:${size}px;
              background:${bgColor};
              border:3px solid ${borderColor};
              border-radius:50% 50% 50% 0;
              transform:rotate(-45deg);
              display:flex;align-items:center;justify-content:center;
              box-shadow:0 4px 12px rgba(2,132,199,0.4);
            ">
              <span style="transform:rotate(45deg);color:white;font-size:15px;font-weight:700;text-shadow:0 1px 2px rgba(0,0,0,0.3);">
                ${creatorInitial}
              </span>
            </div>
          </div>
        `,
        className: 'custom-marker-icon',
        iconSize: [size, size],
        iconAnchor: [size / 2, size],
        popupAnchor: [0, -size],
      });
    }

    if (isDimmed) {
      return L.divIcon({
        html: `
          <div style="position:relative;width:36px;height:36px;opacity:0.4">
            <div style="
              width:36px;height:36px;
              background:#9ca3af;
              border:3px solid #6b7280;
              border-radius:50% 50% 50% 0;
              transform:rotate(-45deg);
              display:flex;align-items:center;justify-content:center;
            ">
              <span style="transform:rotate(45deg);color:white;font-size:13px;font-weight:700;">
                ${creatorInitial}
              </span>
            </div>
          </div>
        `,
        className: 'custom-marker-icon',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
      });
    }

    const isPopular = (location.votes_up ?? 0) - (location.votes_down ?? 0) >= 5;
    return createCustomIcon({ isNew, isPopular, creatorInitial });
  }, [location.created_at, location.created_by, location.votes_up, location.votes_down, isSelected, isHovered, isDimmed]);

  const position: [number, number] = [location.latitude, location.longitude];

  const tooltipDescription = location.description
    ? location.description.length > 100
      ? location.description.substring(0, 100) + '...'
      : location.description
    : '';

  return (
    <Marker
      position={position}
      icon={icon}
      eventHandlers={{
        click: () => {
          selectLocation(location); // centers map
          onOpenDetail?.(location); // opens detail modal
        },
        mouseover: () => setHoveredLocationId(location.id),
        mouseout: () => setHoveredLocationId(null),
      }}
    >
      <Tooltip direction="top" offset={[0, -20]} opacity={1} className="custom-tooltip">
        <div className="p-2 max-w-xs">
          <div className="flex items-start gap-2">
            {location.preview_image_url && (
              <img
                src={location.preview_image_url}
                alt=""
                className="w-12 h-12 rounded object-cover flex-shrink-0"
              />
            )}
            <div className="min-w-0">
              <h4 className="font-semibold text-gray-900 text-sm truncate">{location.name}</h4>
              {tooltipDescription && (
                <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{tooltipDescription}</p>
              )}
            </div>
          </div>
        </div>
      </Tooltip>
    </Marker>
  );
}
