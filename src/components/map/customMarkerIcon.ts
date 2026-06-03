import L from 'leaflet';
import { getCategoryDef } from '../../lib/locationCategories';

interface MarkerOptions {
  isNew?: boolean;
  isHighRated?: boolean;
  isVerified?: boolean;
  isPopular?: boolean;
  category?: string;
  color?: string;       // custom hex from location
  icon?: string;        // emoji from location
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function darken(hex: string): string {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - 40);
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - 40);
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - 40);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function createCustomIcon(options: MarkerOptions = {}): L.DivIcon {
  const { isNew, isHighRated, isVerified, isPopular, category, color, icon } = options;

  // Base color: use location's custom color → category default → status-based
  const catDef = getCategoryDef(category || 'other');
  let baseColor = color || catDef.defaultColor;

  // Status overrides color for special states
  if (isHighRated) baseColor = '#f59e0b';
  if (isPopular)   baseColor = '#14b8a6';

  const borderColor = darken(baseColor);
  const glowShadow = (isHighRated || isPopular)
    ? `box-shadow: 0 0 14px ${hexToRgba(baseColor, 0.55)};`
    : '';
  const pulseClass = isNew ? 'marker-pulse' : '';
  const size = isPopular ? 40 : 36;

  // Badge for verified / popular
  let badge = '';
  if (isVerified) {
    badge = `<div style="position:absolute;top:-4px;right:-4px;width:14px;height:14px;background:#10b981;border:2px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;">
      <svg width="8" height="8" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
    </div>`;
  } else if (isPopular) {
    badge = `<div style="position:absolute;top:-4px;right:-4px;width:14px;height:14px;background:#0d9488;border:2px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;">
      <svg width="8" height="8" viewBox="0 0 24 24" fill="white"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>
    </div>`;
  }

  // Icon: category emoji takes priority; status icons shown via badge only
  const displayEmoji = icon || catDef.emoji;

  const html = `
    <div class="${pulseClass}" style="position:relative;width:${size}px;height:${size}px;">
      <div style="
        width:${size}px;height:${size}px;
        background:${baseColor};
        border:3px solid ${borderColor};
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        ${glowShadow}
        display:flex;align-items:center;justify-content:center;
        transition:transform 0.2s;
      ">
        <span style="transform:rotate(45deg);display:flex;align-items:center;justify-content:center;font-size:15px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.25));">
          ${displayEmoji}
        </span>
      </div>
      ${badge}
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-marker-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}
