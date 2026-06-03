export type ImportedItem =
  | { kind: 'location'; lat: number; lng: number }
  | { kind: 'route'; waypoints: Array<{ lat: number; lng: number }> }
  | { kind: 'zone'; vertices: Array<{ lat: number; lng: number }> };

export interface ParseResult {
  items: ImportedItem[];
  warnings: string[];
}
