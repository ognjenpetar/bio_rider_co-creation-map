import type { ImportedItem, ParseResult } from './types';

// ── DXF is strictly line-pair based: group-code line, then value line.
// We collect all group-code→values for each entity in the ENTITIES section.
interface RawEntity {
  type: string;
  groups: Record<number, string[]>;
}

function collectEntities(text: string): RawEntity[] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const entities: RawEntity[] = [];
  let inEntities = false;
  let current: RawEntity | null = null;
  let i = 0;

  while (i < lines.length - 1) {
    const codeStr = lines[i].trim();
    const value = lines[i + 1]?.trim() ?? '';
    const code = parseInt(codeStr, 10);

    if (isNaN(code)) { i++; continue; } // blank/malformed line — advance by 1

    if (code === 2 && value === 'ENTITIES') {
      inEntities = true;
      i += 2;
      continue;
    }
    if (code === 0 && value === 'ENDSEC' && inEntities) {
      if (current) { entities.push(current); current = null; }
      inEntities = false;
      i += 2;
      continue;
    }

    if (inEntities) {
      if (code === 0) {
        if (current) entities.push(current);
        current = { type: value.toUpperCase(), groups: {} };
      } else if (current) {
        if (!current.groups[code]) current.groups[code] = [];
        current.groups[code].push(value);
      }
    }

    i += 2;
  }
  if (current && inEntities) entities.push(current);
  return entities;
}

function num(groups: Record<number, string[]>, code: number, idx = 0): number {
  return parseFloat(groups[code]?.[idx] ?? 'NaN');
}

function ok(...ns: number[]) {
  return ns.every(isFinite);
}

export function parseDXF(text: string): ParseResult {
  const items: ImportedItem[] = [];
  const warnings: string[] = [
    'DXF: koordinate se čitaju direktno kao WGS84 (lat/lng). ' +
    'Ako su koordinate u drugom sistemu (Gauss-Krüger, UTM itd.), pozicije neće biti tačne.',
  ];

  let entities: RawEntity[];
  try {
    entities = collectEntities(text);
  } catch (e) {
    return { items, warnings: ['Nevažeći DXF fajl — greška pri čitanju.'] };
  }

  if (entities.length === 0) {
    warnings.push('Nije pronađena ENTITIES sekcija u DXF fajlu.');
    return { items, warnings };
  }

  let pendingPolyline: { flags: number; vertices: Array<{ lat: number; lng: number }> } | null = null;

  for (const e of entities) {
    const g = e.groups;

    if (e.type === 'POINT') {
      const lat = num(g, 20), lng = num(g, 10);
      if (ok(lat, lng)) items.push({ kind: 'location', lat, lng });
    }

    else if (e.type === 'LINE') {
      const p1 = { lat: num(g, 20), lng: num(g, 10) };
      const p2 = { lat: num(g, 21), lng: num(g, 11) };
      if (ok(p1.lat, p1.lng, p2.lat, p2.lng))
        items.push({ kind: 'route', waypoints: [p1, p2] });
    }

    else if (e.type === 'LWPOLYLINE') {
      const flags = parseInt(g[70]?.[0] ?? '0', 10);
      const closed = (flags & 1) === 1;
      const xs = (g[10] ?? []).map(Number);
      const ys = (g[20] ?? []).map(Number);
      const pts = xs
        .map((x, i) => ({ lng: x, lat: ys[i] ?? NaN }))
        .filter(p => ok(p.lat, p.lng));

      if (closed && pts.length >= 3) items.push({ kind: 'zone', vertices: pts });
      else if (!closed && pts.length >= 2) items.push({ kind: 'route', waypoints: pts });
    }

    else if (e.type === 'POLYLINE') {
      const flags = parseInt(g[70]?.[0] ?? '0', 10);
      pendingPolyline = { flags, vertices: [] };
    }

    else if (e.type === 'VERTEX' && pendingPolyline) {
      const lat = num(g, 20), lng = num(g, 10);
      if (ok(lat, lng)) pendingPolyline.vertices.push({ lat, lng });
    }

    else if (e.type === 'SEQEND' && pendingPolyline) {
      const { flags, vertices } = pendingPolyline;
      pendingPolyline = null;
      const closed = (flags & 1) === 1;
      if (closed && vertices.length >= 3) items.push({ kind: 'zone', vertices });
      else if (!closed && vertices.length >= 2) items.push({ kind: 'route', waypoints: vertices });
    }

    // SPLINE, ARC, CIRCLE, INSERT, TEXT etc. — skipped
  }

  if (items.length === 0)
    warnings.push('Nisu pronađeni elementi (POINT, LINE, LWPOLYLINE, POLYLINE) u DXF fajlu.');

  return { items, warnings };
}
