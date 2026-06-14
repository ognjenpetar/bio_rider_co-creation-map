export const LOCATION_CATEGORIES = [
  // ── Infrastruktura za korisnike ──
  { id: 'fountain',           label: 'Česma',                  labelEn: 'Fountain',              emoji: '💧', defaultColor: '#3b82f6' },
  { id: 'spring',             label: 'Izvor vode',             labelEn: 'Water Spring',          emoji: '💦', defaultColor: '#0ea5e9' },
  { id: 'wc',                 label: 'Toalet / WC',            labelEn: 'Toilet / WC',           emoji: '🚻', defaultColor: '#6b7280' },
  { id: 'rest_area',          label: 'Odmorište',              labelEn: 'Rest Area',             emoji: '⛺', defaultColor: '#10b981' },
  { id: 'shade',              label: 'Hladovina',              labelEn: 'Shade Spot',            emoji: '🌴', defaultColor: '#84cc16' },
  { id: 'shelter',            label: 'Sklonište / nadstrešnica', labelEn: 'Shelter',             emoji: '⛱️', defaultColor: '#64748b' },
  { id: 'picnic',             label: 'Piknik',                 labelEn: 'Picnic Area',           emoji: '🧺', defaultColor: '#d97706' },
  { id: 'bike_repair',        label: 'Servis bicikla',         labelEn: 'Bike Repair',           emoji: '🔧', defaultColor: '#b45309' },
  { id: 'parking',            label: 'Parking za bicikle',     labelEn: 'Bike Parking',          emoji: '🅿️', defaultColor: '#6366f1' },
  { id: 'bus_stop',           label: 'Autobusko stajalište',   labelEn: 'Bus Stop',              emoji: '🚌', defaultColor: '#f97316' },
  { id: 'camping',            label: 'Kamp',                   labelEn: 'Camping',               emoji: '🏕️', defaultColor: '#a3e635' },
  { id: 'fast_food',          label: 'Brza hrana',             labelEn: 'Fast Food',             emoji: '🍔', defaultColor: '#fb923c' },
  { id: 'sports_field',       label: 'Sportski teren',         labelEn: 'Sports Field',          emoji: '⚽', defaultColor: '#4ade80' },
  { id: 'phone_charger',      label: 'Punjač za telefone',     labelEn: 'Phone Charger',         emoji: '🔋', defaultColor: '#facc15' },
  { id: 'wifi',               label: 'WiFi zona',              labelEn: 'WiFi Zone',             emoji: '📶', defaultColor: '#60a5fa' },

  // ── Priroda i ekologija ──
  { id: 'green_area',         label: 'Zelena površina',        labelEn: 'Green Area',            emoji: '🌳', defaultColor: '#16a34a' },
  { id: 'biotop_significant', label: 'Značajan biotop',        labelEn: 'Significant Biotop',    emoji: '🦋', defaultColor: '#15803d' },
  { id: 'fishing',            label: 'Mesto za pecanje',       labelEn: 'Fishing Spot',          emoji: '🎣', defaultColor: '#0284c7' },
  { id: 'wildlife',           label: 'Divlje životinje',       labelEn: 'Wildlife',              emoji: '🦌', defaultColor: '#166534' },

  // ── Turizam i kultura ──
  { id: 'viewpoint',          label: 'Vidikovac',              labelEn: 'Viewpoint',             emoji: '🔭', defaultColor: '#7c3aed' },
  { id: 'excursion',          label: 'Izletište',              labelEn: 'Excursion Spot',        emoji: '🏞️', defaultColor: '#22c55e' },
  { id: 'tourist',            label: 'Turistička atrakcija',   labelEn: 'Tourist Attraction',    emoji: '🏛️', defaultColor: '#8b5cf6' },
  { id: 'cultural',           label: 'Kulturno nasleđe',       labelEn: 'Cultural Heritage',     emoji: '🏺', defaultColor: '#92400e' },
  { id: 'church',             label: 'Crkva / manastir',       labelEn: 'Church / Monastery',    emoji: '⛪', defaultColor: '#78716c' },
  { id: 'playground',         label: 'Dečije igralište',       labelEn: 'Playground',            emoji: '🛝', defaultColor: '#ec4899' },
  { id: 'cafe',               label: 'Kafić / restoran',       labelEn: 'Café / Restaurant',     emoji: '☕', defaultColor: '#a16207' },
  { id: 'shop',               label: 'Prodavnica',             labelEn: 'Shop',                  emoji: '🛒', defaultColor: '#f59e0b' },

  // ── Ekologija i akcije ──
  { id: 'cleaning_action',    label: 'Akcija čišćenja',        labelEn: 'Cleaning Action',       emoji: '🧹', defaultColor: '#34d399' },
  { id: 'illegal_dump',       label: 'Divlja deponija',        labelEn: 'Illegal Dump',          emoji: '🗑️', defaultColor: '#78716c' },
  { id: 'recycling',          label: 'Reciklažno mesto',       labelEn: 'Recycling Point',       emoji: '♻️', defaultColor: '#059669' },

  // ── Upozorenja i info ──
  { id: 'info_board',         label: 'Info tabla',             labelEn: 'Info Board',            emoji: 'ℹ️', defaultColor: '#0ea5e9' },
  { id: 'danger',             label: 'Opasno mesto',           labelEn: 'Danger Spot',           emoji: '🚨', defaultColor: '#dc2626' },
  { id: 'intersection',       label: 'Raskrsnica',             labelEn: 'Intersection',          emoji: '⚠️', defaultColor: '#ef4444' },

  // ── Ostalo ──
  { id: 'other',              label: 'Ostalo',                 labelEn: 'Other',                 emoji: '📍', defaultColor: '#6b7280' },
] as const;

export type LocationCategory = typeof LOCATION_CATEGORIES[number]['id'];

export function getCategoryDef(id: string) {
  return LOCATION_CATEGORIES.find(c => c.id === id) ?? LOCATION_CATEGORIES[LOCATION_CATEGORIES.length - 1];
}

export const ROUTE_TYPES = [
  { id: 'cycling', label: 'Biciklistička', emoji: '🚲' },
  { id: 'walking', label: 'Pešačka',       emoji: '🚶' },
  { id: 'hiking',  label: 'Planinska',     emoji: '🥾' },
  { id: 'biotop',  label: 'Biotop',        emoji: '🌿' },
  { id: 'other',   label: 'Ostalo',        emoji: '📍' },
] as const;

export type RouteTypeId = typeof ROUTE_TYPES[number]['id'];
