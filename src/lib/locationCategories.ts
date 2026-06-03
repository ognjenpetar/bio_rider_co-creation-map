export const LOCATION_CATEGORIES = [
  { id: 'fountain',      label: 'Česma',                 labelEn: 'Fountain',           emoji: '💧', defaultColor: '#3b82f6' },
  { id: 'rest_area',     label: 'Odmorište',             labelEn: 'Rest Area',           emoji: '⛺', defaultColor: '#10b981' },
  { id: 'intersection',  label: 'Raskrsnica',            labelEn: 'Intersection',        emoji: '⚠️', defaultColor: '#ef4444' },
  { id: 'shop',          label: 'Prodavnica',            labelEn: 'Shop',                emoji: '🛒', defaultColor: '#f59e0b' },
  { id: 'excursion',     label: 'Izletište',             labelEn: 'Excursion Spot',      emoji: '🏞️', defaultColor: '#22c55e' },
  { id: 'tourist',       label: 'Turistička atrakcija',  labelEn: 'Tourist Attraction',  emoji: '🏛️', defaultColor: '#8b5cf6' },
  { id: 'bus_stop',      label: 'Autobusko stajalište',  labelEn: 'Bus Stop',            emoji: '🚌', defaultColor: '#f97316' },
  { id: 'info_board',    label: 'Info tabla',            labelEn: 'Info Board',          emoji: 'ℹ️', defaultColor: '#0ea5e9' },
  { id: 'parking',       label: 'Parking za bicikle',    labelEn: 'Bike Parking',        emoji: '🅿️', defaultColor: '#6366f1' },
  { id: 'danger',        label: 'Opasno mesto',          labelEn: 'Danger Spot',         emoji: '🚨', defaultColor: '#dc2626' },
  { id: 'green_area',    label: 'Zelena površina',       labelEn: 'Green Area',          emoji: '🌳', defaultColor: '#16a34a' },
  { id: 'other',         label: 'Ostalo',                labelEn: 'Other',               emoji: '📍', defaultColor: '#6b7280' },
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
