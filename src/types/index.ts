// User roles enum matching database
export type UserRole = 'superadmin' | 'admin' | 'editor' | 'viewer';

// Suggestion status enum
export type SuggestionStatus = 'pending' | 'approved' | 'rejected';

// User profile type
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

// Location type
export interface Location {
  id: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  preview_image_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
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

// Edit suggestion type
export interface EditSuggestion {
  id: string;
  location_id: string | null;
  suggested_by: string;
  suggestion_type: 'create' | 'update' | 'delete';
  suggested_data: LocationFormData;
  status: SuggestionStatus;
  reviewed_by: string | null;
  review_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
}

// Edit suggestion with related data
export interface EditSuggestionWithProfile extends EditSuggestion {
  suggestor: Profile | null;
  reviewer: Profile | null;
  location: Location | null;
}

// Form data for creating/editing locations
export interface LocationFormData {
  name: string;
  description: string;
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
