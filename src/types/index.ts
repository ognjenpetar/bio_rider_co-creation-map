// Location type - stored in Supabase
export interface Location {
  id: string;
  name: string;
  description: string | null;
  description_en: string | null;
  description_sr: string | null;
  latitude: number;
  longitude: number;
  preview_image_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

// Comment/rating type
export interface LocationComment {
  id: string;
  location_id: string;
  username: string;
  comment: string | null;
  rating: number;
  created_at: string;
}

// Location with related data
export interface LocationWithFiles extends Location {
  images: LocationImage[];
  documents: LocationDocument[];
}

// Location image type
export interface LocationImage {
  id: string;
  location_id: string;
  storage_path: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  alt_text: string | null;
  display_order: number;
  created_by: string | null;
  created_at: string;
}

// Location document type
export interface LocationDocument {
  id: string;
  location_id: string;
  storage_path: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  extracted_text: string | null;
  extraction_status: 'pending' | 'completed' | 'failed';
  created_by: string | null;
  created_at: string;
}

// Form data for creating/editing locations
export interface LocationFormData {
  name: string;
  description: string;
  description_en?: string;
  description_sr?: string;
  latitude: number;
  longitude: number;
  images?: File[];
  documents?: File[];
}

// Search result type
export interface SearchResult {
  id: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  preview_image_url: string | null;
  rank: number;
  matched_in: 'location' | 'document' | 'both';
  name_highlight?: string;
  description_highlight?: string;
}

// Map bounds type
export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

// Coordinates type
export interface Coordinates {
  lat: number;
  lng: number;
}

// Verification type
export interface LocationVerification {
  id: string;
  location_id: string;
  username: string;
  verified: boolean;
  comment: string | null;
  created_at: string;
}

// Route type (polyline)
export interface Route {
  id: string;
  name: string;
  description: string | null;
  waypoints: Array<{ lat: number; lng: number }>;
  color: string;
  created_by: string;
  distance_km: number | null;
  estimated_time_min: number | null;
  route_type: 'cycling' | 'walking' | 'hiking' | 'other';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Deliberation types
export type DeliberationPhase = 'identification' | 'proposals' | 'argumentation' | 'consensus' | 'closed';
export type EntryType = 'problem' | 'proposal' | 'argument_for' | 'argument_against' | 'consensus' | 'comment';

export interface Deliberation {
  id: string;
  location_id: string;
  title: string;
  description: string | null;
  phase: DeliberationPhase;
  created_by: string;
  deadline: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeliberationEntry {
  id: string;
  deliberation_id: string;
  username: string;
  entry_type: EntryType;
  content: string;
  votes_up: number;
  votes_down: number;
  created_at: string;
}

// Notification type
export interface Notification {
  id: string;
  username: string;
  type: 'new_location' | 'new_comment' | 'verification' | 'deliberation' | 'route';
  title: string;
  message: string | null;
  reference_id: string | null;
  is_read: boolean;
  created_at: string;
}
