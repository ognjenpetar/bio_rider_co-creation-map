import L from 'leaflet';

interface MarkerOptions {
  isNew?: boolean; // < 7 days old
  isHighRated?: boolean; // avg rating >= 4.5
  isVerified?: boolean; // 3+ verifications
  isPopular?: boolean; // 5+ net upvotes
}

export function createCustomIcon(options: MarkerOptions = {}): L.DivIcon {
  const { isNew, isHighRated, isVerified, isPopular } = options;

  let borderColor = '#16a34a';
  let bgColor = '#22c55e';
  let pulseClass = '';
  let badge = '';
  let glowShadow = '';
  let size = 36;

  if (isPopular) {
    borderColor = '#0d9488';
    bgColor = '#14b8a6';
    glowShadow = 'box-shadow: 0 0 12px rgba(20, 184, 166, 0.5);';
    size = 40;
  }

  if (isHighRated) {
    borderColor = '#d97706';
    bgColor = '#f59e0b';
    glowShadow = 'box-shadow: 0 0 12px rgba(245, 158, 11, 0.5);';
  }

  if (isNew) {
    pulseClass = 'marker-pulse';
  }

  if (isVerified) {
    badge = `<div style="position:absolute;top:-4px;right:-4px;width:14px;height:14px;background:#10b981;border:2px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;">
      <svg width="8" height="8" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
    </div>`;
  } else if (isPopular) {
    badge = `<div style="position:absolute;top:-4px;right:-4px;width:14px;height:14px;background:#0d9488;border:2px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;">
      <svg width="8" height="8" viewBox="0 0 24 24" fill="white"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>
    </div>`;
  }

  // SVG icon chosen by priority: verified > high-rated > popular > new > default
  let icon: string;
  if (isVerified) {
    icon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
  } else if (isHighRated) {
    icon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="white"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
  } else if (isPopular) {
    icon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M13.5 2.5c0 2.5-2.5 4-2.5 7h2c0-2 2.5-3.5 2.5-7h-2zm-3 0c0 2.5-2.5 4-2.5 7h2c0-2 2.5-3.5 2.5-7h-2zm7 10H6c-.55 0-1 .45-1 1v1c0 .55.45 1 1 1h.25L7 20.5c.13.87.87 1.5 1.75 1.5h6.5c.88 0 1.62-.63 1.75-1.5l.75-5h.25c.55 0 1-.45 1-1v-1c0-.55-.45-1-1-1z"/></svg>`;
  } else if (isNew) {
    icon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z"/></svg>`;
  } else {
    icon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="3"/><path d="M12 8v8"/><path d="M9 11l3-3 3 3"/><path d="M8 19h8"/></svg>`;
  }

  const html = `
    <div class="${pulseClass}" style="position:relative;width:${size}px;height:${size}px;">
      <div style="
        width:${size}px;height:${size}px;
        background:${bgColor};
        border:3px solid ${borderColor};
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        ${glowShadow}
        display:flex;align-items:center;justify-content:center;
        transition:transform 0.2s;
      ">
        <span style="transform:rotate(45deg);display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.3));">
          ${icon}
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
