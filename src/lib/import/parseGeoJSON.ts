import type { ImportedItem, ParseResult } from './types';

type Coord = [number, number]; // [lng, lat]

function coordToLatLng(c: Coord) {
  return { lat: c[1], lng: c[0] };
}

function processGeometry(geometry: any, items: ImportedItem[]) {
  if (!geometry) return;
  switch (geometry.type) {
    case 'Point':
      items.push({ kind: 'location', ...coordToLatLng(geometry.coordinates) });
      break;
    case 'MultiPoint':
      geometry.coordinates.forEach((c: Coord) =>
        items.push({ kind: 'location', ...coordToLatLng(c) }));
      break;
    case 'LineString':
      if (geometry.coordinates.length >= 2)
        items.push({ kind: 'route', waypoints: geometry.coordinates.map(coordToLatLng) });
      break;
    case 'MultiLineString':
      geometry.coordinates.forEach((line: Coord[]) => {
        if (line.length >= 2)
          items.push({ kind: 'route', waypoints: line.map(coordToLatLng) });
      });
      break;
    case 'Polygon':
      // Use outer ring only, drop closing duplicate point
      if (geometry.coordinates[0]?.length >= 4) {
        const ring: Coord[] = geometry.coordinates[0].slice(0, -1);
        items.push({ kind: 'zone', vertices: ring.map(coordToLatLng) });
      }
      break;
    case 'MultiPolygon':
      geometry.coordinates.forEach((poly: Coord[][]) => {
        const ring = poly[0]?.slice(0, -1);
        if (ring?.length >= 3)
          items.push({ kind: 'zone', vertices: ring.map(coordToLatLng) });
      });
      break;
    case 'GeometryCollection':
      geometry.geometries?.forEach((g: any) => processGeometry(g, items));
      break;
  }
}

export function parseGeoJSON(text: string): ParseResult {
  const items: ImportedItem[] = [];
  const warnings: string[] = [];

  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    return { items, warnings: ['Nevažeći GeoJSON fajl — greška pri parsovanju JSON-a.'] };
  }

  if (json.type === 'FeatureCollection') {
    (json.features || []).forEach((f: any) => processGeometry(f.geometry, items));
  } else if (json.type === 'Feature') {
    processGeometry(json.geometry, items);
  } else {
    processGeometry(json, items);
  }

  if (items.length === 0) warnings.push('Nisu pronađene geometrije u fajlu.');

  return { items, warnings };
}
