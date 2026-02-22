import type { Location } from '../types';

// Export locations as CSV
export function exportAsCSV(locations: Location[]): void {
  const headers = ['Name', 'Description', 'Description (EN)', 'Description (SR)', 'Latitude', 'Longitude', 'Created By', 'Created At'];

  const rows = locations.map(loc => [
    escapeCsvField(loc.name),
    escapeCsvField(loc.description || ''),
    escapeCsvField(loc.description_en || ''),
    escapeCsvField(loc.description_sr || ''),
    loc.latitude.toString(),
    loc.longitude.toString(),
    escapeCsvField(loc.created_by || ''),
    new Date(loc.created_at).toISOString(),
  ]);

  const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  downloadFile(csv, 'bio-rider-locations.csv', 'text/csv;charset=utf-8;');
}

// Export locations as GeoJSON
export function exportAsGeoJSON(locations: Location[]): void {
  const geojson = {
    type: 'FeatureCollection' as const,
    features: locations.map(loc => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [loc.longitude, loc.latitude],
      },
      properties: {
        id: loc.id,
        name: loc.name,
        description: loc.description,
        description_en: loc.description_en,
        description_sr: loc.description_sr,
        created_by: loc.created_by,
        created_at: loc.created_at,
        preview_image_url: loc.preview_image_url,
      },
    })),
  };

  const json = JSON.stringify(geojson, null, 2);
  downloadFile(json, 'bio-rider-locations.geojson', 'application/geo+json');
}

// Helper: escape CSV field
function escapeCsvField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

// Helper: download file
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
