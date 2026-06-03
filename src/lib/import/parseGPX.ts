import type { ImportedItem, ParseResult } from './types';

function getAttrNum(el: Element, attr: string): number {
  return parseFloat(el.getAttribute(attr) ?? 'NaN');
}

function ptToLatLng(el: Element) {
  return { lat: getAttrNum(el, 'lat'), lng: getAttrNum(el, 'lon') };
}

function validPt(p: { lat: number; lng: number }) {
  return isFinite(p.lat) && isFinite(p.lng);
}

export function parseGPX(text: string): ParseResult {
  const items: ImportedItem[] = [];
  const warnings: string[] = [];

  let doc: Document;
  try {
    doc = new DOMParser().parseFromString(text, 'application/xml');
    const parseError = doc.querySelector('parsererror');
    if (parseError) throw new Error(parseError.textContent ?? 'Parse error');
  } catch (e) {
    return { items, warnings: [`Nevažeći GPX fajl — ${e instanceof Error ? e.message : 'greška parsera'}.`] };
  }

  // Waypoints → locations
  doc.querySelectorAll('wpt').forEach(wpt => {
    const p = ptToLatLng(wpt);
    if (validPt(p)) items.push({ kind: 'location', ...p });
  });

  // Tracks → routes (each track segment becomes one route)
  doc.querySelectorAll('trk').forEach(trk => {
    trk.querySelectorAll('trkseg').forEach(seg => {
      const waypoints = Array.from(seg.querySelectorAll('trkpt'))
        .map(ptToLatLng)
        .filter(validPt);
      if (waypoints.length >= 2)
        items.push({ kind: 'route', waypoints });
    });
  });

  // Routes → routes
  doc.querySelectorAll('rte').forEach(rte => {
    const waypoints = Array.from(rte.querySelectorAll('rtept'))
      .map(ptToLatLng)
      .filter(validPt);
    if (waypoints.length >= 2)
      items.push({ kind: 'route', waypoints });
  });

  if (items.length === 0)
    warnings.push('Nisu pronađeni waypointi, rute ni tragovi u GPX fajlu.');

  return { items, warnings };
}
