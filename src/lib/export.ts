import type { Location, Route, Zone } from '../types';

// ── CSV ───────────────────────────────────────────────────────────────────────

export function exportAsCSV(locations: Location[]): void {
  const headers = ['Name', 'Description (EN)', 'Description (SR)', 'Latitude', 'Longitude', 'Created By', 'Created At'];
  const rows = locations.map(loc => [
    escapeCsvField(loc.name),
    escapeCsvField(loc.description_en || loc.description || ''),
    escapeCsvField(loc.description_sr || loc.description || ''),
    loc.latitude.toString(),
    loc.longitude.toString(),
    escapeCsvField(loc.created_by || ''),
    new Date(loc.created_at).toISOString(),
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadFile(csv, 'bio-rider-locations.csv', 'text/csv;charset=utf-8;');
}

// ── GeoJSON ───────────────────────────────────────────────────────────────────

export function exportAsGeoJSON(locations: Location[]): void {
  exportAllAsGeoJSON(locations, [], []);
}

export function exportAllAsGeoJSON(locations: Location[], routes: Route[], zones: Zone[]): void {
  const locationFeatures = locations.map(loc => ({
    type: 'Feature' as const,
    geometry: { type: 'Point' as const, coordinates: [loc.longitude, loc.latitude] },
    properties: {
      id: loc.id, feature_type: 'location', name: loc.name,
      description: loc.description, description_en: loc.description_en, description_sr: loc.description_sr,
      created_by: loc.created_by, created_at: loc.created_at, preview_image_url: loc.preview_image_url,
      votes_up: loc.votes_up, votes_down: loc.votes_down,
    },
  }));

  const routeFeatures = routes.map(route => ({
    type: 'Feature' as const,
    geometry: { type: 'LineString' as const, coordinates: route.waypoints.map(wp => [wp.lng, wp.lat]) },
    properties: {
      id: route.id, feature_type: 'route', name: route.name,
      description: route.description, route_type: route.route_type, color: route.color,
      distance_km: route.distance_km, estimated_time_min: route.estimated_time_min,
      created_by: route.created_by, created_at: route.created_at,
    },
  }));

  const zoneFeatures = zones
    .filter(zone => zone.vertices.length >= 3)
    .map(zone => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[
          ...zone.vertices.map(v => [v.lng, v.lat]),
          [zone.vertices[0].lng, zone.vertices[0].lat],
        ]],
      },
      properties: {
        id: zone.id, feature_type: 'zone', name: zone.name,
        description: zone.description, zone_type: zone.zone_type, color: zone.color,
        fill_color: zone.fill_color, created_by: zone.created_by, created_at: zone.created_at,
      },
    }));

  const geojson = { type: 'FeatureCollection' as const, features: [...locationFeatures, ...routeFeatures, ...zoneFeatures] };
  downloadFile(JSON.stringify(geojson, null, 2), 'bio-rider-map.geojson', 'application/geo+json');
}

// ── PDF (browser print) ───────────────────────────────────────────────────────

export function exportAsPDF(locations: Location[], routes: Route[], zones: Zone[]): void {
  const html = `<!DOCTYPE html>
<html lang="sr">
<head>
  <meta charset="UTF-8">
  <title>Bio Rider – Mapa Exportovana</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', sans-serif; color: #111; background: #fff; padding: 32px; font-size: 13px; }
    h1 { font-size: 22px; color: #16a34a; margin-bottom: 4px; }
    .meta { color: #6b7280; font-size: 12px; margin-bottom: 28px; }
    h2 { font-size: 15px; font-weight: 700; color: #374151; border-bottom: 2px solid #e5e7eb;
         padding-bottom: 6px; margin: 24px 0 10px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #f9fafb; padding: 7px 10px; text-align: left; font-weight: 600;
         border: 1px solid #e5e7eb; color: #374151; }
    td { padding: 6px 10px; border: 1px solid #e5e7eb; vertical-align: top; }
    tr:nth-child(even) td { background: #fafafa; }
    .badge { display: inline-block; font-size: 10px; padding: 1px 6px; border-radius: 9999px;
             font-weight: 600; text-transform: uppercase; letter-spacing: .03em; }
    .loc  { background: #dcfce7; color: #166534; }
    .rt   { background: #dbeafe; color: #1d4ed8; }
    .zn   { background: #f3e8ff; color: #6b21a8; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <h1>Bio Rider Co-Creation Map</h1>
  <p class="meta">Generisano: ${new Date().toLocaleString('sr')}</p>

  <h2>📌 Lokacije <span style="font-weight:400;color:#9ca3af;">(${locations.length})</span></h2>
  <table>
    <thead><tr><th>#</th><th>Naziv</th><th>Opis</th><th>Koordinate</th><th>Kreator</th><th>Datum</th></tr></thead>
    <tbody>
      ${locations.map((l, i) => `<tr>
        <td>${i + 1}</td>
        <td>${escHtml(l.name)}</td>
        <td style="max-width:220px;">${escHtml(l.description_sr || l.description || '')}</td>
        <td style="font-family:monospace;font-size:11px;">${l.latitude.toFixed(5)}, ${l.longitude.toFixed(5)}</td>
        <td>${escHtml(l.created_by || '')}</td>
        <td>${new Date(l.created_at).toLocaleDateString('sr')}</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <h2>🚲 Rute <span style="font-weight:400;color:#9ca3af;">(${routes.length})</span></h2>
  <table>
    <thead><tr><th>#</th><th>Naziv</th><th>Tip</th><th>Dužina</th><th>Vreme</th><th>Kreator</th><th>Datum</th></tr></thead>
    <tbody>
      ${routes.map((r, i) => `<tr>
        <td>${i + 1}</td>
        <td>${escHtml(r.name)}</td>
        <td>${r.route_type}</td>
        <td>${r.distance_km ? r.distance_km + ' km' : '–'}</td>
        <td>${r.estimated_time_min ? r.estimated_time_min + ' min' : '–'}</td>
        <td>${escHtml(r.created_by)}</td>
        <td>${new Date(r.created_at).toLocaleDateString('sr')}</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <h2>📐 Zone <span style="font-weight:400;color:#9ca3af;">(${zones.length})</span></h2>
  <table>
    <thead><tr><th>#</th><th>Naziv</th><th>Tip</th><th>Opis</th><th>Kreator</th><th>Datum</th></tr></thead>
    <tbody>
      ${zones.map((z, i) => `<tr>
        <td>${i + 1}</td>
        <td>${escHtml(z.name)}</td>
        <td>${z.zone_type}</td>
        <td>${escHtml(z.description || '')}</td>
        <td>${escHtml(z.created_by)}</td>
        <td>${new Date(z.created_at).toLocaleDateString('sr')}</td>
      </tr>`).join('')}
    </tbody>
  </table>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 600);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function escapeCsvField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
