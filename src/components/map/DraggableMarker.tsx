import { useMemo, useRef } from 'react';
import { Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import type { Marker as LeafletMarker } from 'leaflet';
import { useTranslation } from 'react-i18next';

interface DraggableMarkerProps {
  position: { lat: number; lng: number };
  onPositionChange: (lat: number, lng: number) => void;
}

// Create a special icon for the draggable marker
function createDraggableIcon(): L.DivIcon {
  const size = 48;

  const html = `
    <div style="
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      border: 4px solid #16a34a;
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      box-shadow: 0 4px 12px rgba(22, 163, 74, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: grab;
      animation: pulse 2s infinite;
    ">
      <svg
        width="${size * 0.5}"
        height="${size * 0.5}"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3"></circle>
      </svg>
    </div>
    <style>
      @keyframes pulse {
        0%, 100% {
          transform: scale(1);
          box-shadow: 0 4px 12px rgba(22, 163, 74, 0.5);
        }
        50% {
          transform: scale(1.05);
          box-shadow: 0 6px 20px rgba(22, 163, 74, 0.7);
        }
      }
    </style>
  `;

  return L.divIcon({
    html,
    className: 'draggable-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function DraggableMarker({ position, onPositionChange }: DraggableMarkerProps) {
  const { t } = useTranslation();
  const markerRef = useRef<LeafletMarker>(null);

  const icon = useMemo(() => createDraggableIcon(), []);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const newPos = marker.getLatLng();
          onPositionChange(newPos.lat, newPos.lng);
        }
      },
    }),
    [onPositionChange]
  );

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={[position.lat, position.lng]}
      ref={markerRef}
      icon={icon}
    >
      <Tooltip direction="top" offset={[0, -24]} opacity={1} permanent>
        <div className="text-xs font-medium text-green-700">
          {t('map.dragToMove')}
        </div>
      </Tooltip>
    </Marker>
  );
}
