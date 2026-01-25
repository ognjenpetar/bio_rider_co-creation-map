import { useMemo } from 'react';
import { Marker, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { useMap } from '../../contexts/MapContext';
import { MarkerPopup } from './MarkerPopup';
import type { Location } from '../../types';

interface LocationMarkerProps {
  location: Location;
  isSelected: boolean;
  isHovered: boolean;
  isDimmed: boolean;
}

// Create custom icon
function createCustomIcon(
  previewUrl: string | null,
  isSelected: boolean,
  isHovered: boolean,
  isDimmed: boolean
): L.DivIcon {
  const size = isSelected || isHovered ? 48 : 40;
  const borderColor = isSelected
    ? '#0284c7'
    : isHovered
    ? '#0ea5e9'
    : '#475569';
  const opacity = isDimmed ? 0.4 : 1;

  const html = previewUrl
    ? `
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 3px solid ${borderColor};
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        opacity: ${opacity};
        transition: all 0.2s ease;
        background: white;
      ">
        <img
          src="${previewUrl}"
          alt=""
          style="
            width: 100%;
            height: 100%;
            object-fit: cover;
          "
        />
      </div>
    `
    : `
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 3px solid ${borderColor};
        background: linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%);
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        opacity: ${opacity};
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg
          width="${size * 0.5}"
          height="${size * 0.5}"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      </div>
    `;

  return L.divIcon({
    html,
    className: 'custom-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

export function LocationMarker({
  location,
  isSelected,
  isHovered,
  isDimmed,
}: LocationMarkerProps) {
  const { selectLocation, setHoveredLocationId } = useMap();

  const icon = useMemo(
    () =>
      createCustomIcon(
        location.preview_image_url,
        isSelected,
        isHovered,
        isDimmed
      ),
    [location.preview_image_url, isSelected, isHovered, isDimmed]
  );

  const position: [number, number] = [location.latitude, location.longitude];

  // Truncate description for tooltip
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
        click: () => selectLocation(location),
        mouseover: () => setHoveredLocationId(location.id),
        mouseout: () => setHoveredLocationId(null),
      }}
    >
      {/* Tooltip on hover */}
      <Tooltip
        direction="top"
        offset={[0, -20]}
        opacity={1}
        className="custom-tooltip"
      >
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
              <h4 className="font-semibold text-gray-900 text-sm truncate">
                {location.name}
              </h4>
              {tooltipDescription && (
                <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                  {tooltipDescription}
                </p>
              )}
            </div>
          </div>
        </div>
      </Tooltip>

      {/* Popup on click */}
      <Popup className="custom-popup" maxWidth={350} minWidth={280}>
        <MarkerPopup location={location} />
      </Popup>
    </Marker>
  );
}
