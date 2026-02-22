import L from 'leaflet';

interface MarkerOptions {
  isNew?: boolean; // < 7 days old
  isHighRated?: boolean; // avg rating >= 4.5
  isVerified?: boolean; // 3+ verifications
  creatorInitial?: string;
}

export function createCustomIcon(options: MarkerOptions = {}): L.DivIcon {
  const { isNew, isHighRated, isVerified, creatorInitial } = options;

  let borderColor = '#16a34a';
  let bgColor = '#22c55e';
  let pulseClass = '';
  let badge = '';
  let glowShadow = '';

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
  }

  const initial = creatorInitial?.charAt(0).toUpperCase() || '?';

  const html = `
    <div class="${pulseClass}" style="position:relative;width:36px;height:36px;">
      <div style="
        width:36px;height:36px;
        background:${bgColor};
        border:3px solid ${borderColor};
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        ${glowShadow}
        display:flex;align-items:center;justify-content:center;
        transition:transform 0.2s;
      ">
        <span style="
          transform:rotate(45deg);
          color:white;
          font-size:14px;
          font-weight:700;
          text-shadow:0 1px 2px rgba(0,0,0,0.3);
        ">${initial}</span>
      </div>
      ${badge}
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-marker-icon',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
}
