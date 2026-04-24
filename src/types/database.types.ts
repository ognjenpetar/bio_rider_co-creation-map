// Supabase Database Types
// These types represent the database schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: 'superadmin' | 'admin' | 'editor' | 'viewer';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: 'superadmin' | 'admin' | 'editor' | 'viewer';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: 'superadmin' | 'admin' | 'editor' | 'viewer';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      locations: {
        Row: {
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
          votes_up: number;
          votes_down: number;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          description_en?: string | null;
          description_sr?: string | null;
          latitude: number;
          longitude: number;
          preview_image_url?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
          votes_up?: number;
          votes_down?: number;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          description_en?: string | null;
          description_sr?: string | null;
          latitude?: number;
          longitude?: number;
          preview_image_url?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
          votes_up?: number;
          votes_down?: number;
        };
        Relationships: [];
      };
      location_comments: {
        Row: {
          id: string;
          location_id: string;
          username: string;
          comment: string | null;
          rating: number;
          image_storage_path: string | null;
          image_file_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          location_id: string;
          username: string;
          comment?: string | null;
          rating: number;
          image_storage_path?: string | null;
          image_file_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          location_id?: string;
          username?: string;
          comment?: string | null;
          rating?: number;
          image_storage_path?: string | null;
          image_file_name?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      location_votes: {
        Row: {
          id: string;
          location_id: string;
          username: string;
          vote_type: 'up' | 'down';
          created_at: string;
        };
        Insert: {
          id?: string;
          location_id: string;
          username: string;
          vote_type: 'up' | 'down';
          created_at?: string;
        };
        Update: {
          id?: string;
          location_id?: string;
          username?: string;
          vote_type?: 'up' | 'down';
          created_at?: string;
        };
        Relationships: [];
      };
      location_images: {
        Row: {
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
        };
        Insert: {
          id?: string;
          location_id: string;
          storage_path: string;
          file_name: string;
          file_size?: number | null;
          mime_type?: string | null;
          alt_text?: string | null;
          display_order?: number;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          location_id?: string;
          storage_path?: string;
          file_name?: string;
          file_size?: number | null;
          mime_type?: string | null;
          alt_text?: string | null;
          display_order?: number;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      location_documents: {
        Row: {
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
        };
        Insert: {
          id?: string;
          location_id: string;
          storage_path: string;
          file_name: string;
          file_size?: number | null;
          mime_type?: string | null;
          extracted_text?: string | null;
          extraction_status?: 'pending' | 'completed' | 'failed';
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          location_id?: string;
          storage_path?: string;
          file_name?: string;
          file_size?: number | null;
          mime_type?: string | null;
          extracted_text?: string | null;
          extraction_status?: 'pending' | 'completed' | 'failed';
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      location_verifications: {
        Row: {
          id: string;
          location_id: string;
          username: string;
          verified: boolean;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          location_id: string;
          username: string;
          verified?: boolean;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          location_id?: string;
          username?: string;
          verified?: boolean;
          comment?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      routes: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          waypoints: Json;
          color: string;
          created_by: string;
          distance_km: number | null;
          estimated_time_min: number | null;
          route_type: 'cycling' | 'walking' | 'hiking' | 'biotop' | 'other';
          is_active: boolean;
          votes_up: number;
          votes_down: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          waypoints: Json;
          color?: string;
          created_by: string;
          distance_km?: number | null;
          estimated_time_min?: number | null;
          route_type?: 'cycling' | 'walking' | 'hiking' | 'biotop' | 'other';
          votes_up?: number;
          votes_down?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          waypoints?: Json;
          color?: string;
          created_by?: string;
          distance_km?: number | null;
          estimated_time_min?: number | null;
          route_type?: 'cycling' | 'walking' | 'hiking' | 'biotop' | 'other';
          votes_up?: number;
          votes_down?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      deliberations: {
        Row: {
          id: string;
          location_id: string;
          title: string;
          description: string | null;
          phase: 'identification' | 'proposals' | 'argumentation' | 'consensus' | 'closed';
          created_by: string;
          deadline: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          location_id: string;
          title: string;
          description?: string | null;
          phase?: 'identification' | 'proposals' | 'argumentation' | 'consensus' | 'closed';
          created_by: string;
          deadline?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          location_id?: string;
          title?: string;
          description?: string | null;
          phase?: 'identification' | 'proposals' | 'argumentation' | 'consensus' | 'closed';
          created_by?: string;
          deadline?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      deliberation_entries: {
        Row: {
          id: string;
          deliberation_id: string;
          username: string;
          entry_type: 'problem' | 'proposal' | 'argument_for' | 'argument_against' | 'consensus' | 'comment';
          content: string;
          votes_up: number;
          votes_down: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          deliberation_id: string;
          username: string;
          entry_type?: 'problem' | 'proposal' | 'argument_for' | 'argument_against' | 'consensus' | 'comment';
          content: string;
          votes_up?: number;
          votes_down?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          deliberation_id?: string;
          username?: string;
          entry_type?: 'problem' | 'proposal' | 'argument_for' | 'argument_against' | 'consensus' | 'comment';
          content?: string;
          votes_up?: number;
          votes_down?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      deliberation_votes: {
        Row: {
          id: string;
          entry_id: string;
          username: string;
          vote_type: 'up' | 'down';
          created_at: string;
        };
        Insert: {
          id?: string;
          entry_id: string;
          username: string;
          vote_type: 'up' | 'down';
          created_at?: string;
        };
        Update: {
          id?: string;
          entry_id?: string;
          username?: string;
          vote_type?: 'up' | 'down';
          created_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          username: string;
          type: 'new_location' | 'new_comment' | 'verification' | 'deliberation' | 'route';
          title: string;
          message: string | null;
          reference_id: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          username: string;
          type?: 'new_location' | 'new_comment' | 'verification' | 'deliberation' | 'route';
          title: string;
          message?: string | null;
          reference_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          type?: 'new_location' | 'new_comment' | 'verification' | 'deliberation' | 'route';
          title?: string;
          message?: string | null;
          reference_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      zones: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          vertices: Json;
          color: string;
          fill_color: string;
          created_by: string;
          zone_type: 'park' | 'cycling' | 'restricted' | 'residential' | 'commercial' | 'biotop' | 'other';
          is_active: boolean;
          votes_up: number;
          votes_down: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          vertices: Json;
          color?: string;
          fill_color?: string;
          created_by: string;
          zone_type?: 'park' | 'cycling' | 'restricted' | 'residential' | 'commercial' | 'biotop' | 'other';
          votes_up?: number;
          votes_down?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          vertices?: Json;
          color?: string;
          fill_color?: string;
          created_by?: string;
          zone_type?: 'park' | 'cycling' | 'restricted' | 'residential' | 'commercial' | 'biotop' | 'other';
          votes_up?: number;
          votes_down?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      edit_suggestions: {
        Row: {
          id: string;
          location_id: string | null;
          suggested_by: string;
          suggestion_type: 'create' | 'update' | 'delete';
          suggested_data: Json;
          status: 'pending' | 'approved' | 'rejected';
          reviewed_by: string | null;
          review_notes: string | null;
          created_at: string;
          reviewed_at: string | null;
        };
        Insert: {
          id?: string;
          location_id?: string | null;
          suggested_by: string;
          suggestion_type: 'create' | 'update' | 'delete';
          suggested_data: Json;
          status?: 'pending' | 'approved' | 'rejected';
          reviewed_by?: string | null;
          review_notes?: string | null;
          created_at?: string;
          reviewed_at?: string | null;
        };
        Update: {
          id?: string;
          location_id?: string | null;
          suggested_by?: string;
          suggestion_type?: 'create' | 'update' | 'delete';
          suggested_data?: Json;
          status?: 'pending' | 'approved' | 'rejected';
          reviewed_by?: string | null;
          review_notes?: string | null;
          created_at?: string;
          reviewed_at?: string | null;
        };
        Relationships: [];
      };
      route_votes: {
        Row: { id: string; route_id: string; username: string; vote_type: 'up' | 'down'; created_at: string; };
        Insert: { id?: string; route_id: string; username: string; vote_type: 'up' | 'down'; created_at?: string; };
        Update: { id?: string; route_id?: string; username?: string; vote_type?: 'up' | 'down'; created_at?: string; };
        Relationships: [];
      };
      route_comments: {
        Row: { id: string; route_id: string; username: string; comment: string | null; rating: number; created_at: string; };
        Insert: { id?: string; route_id: string; username: string; comment?: string | null; rating: number; created_at?: string; };
        Update: { id?: string; route_id?: string; username?: string; comment?: string | null; rating?: number; created_at?: string; };
        Relationships: [];
      };
      zone_votes: {
        Row: { id: string; zone_id: string; username: string; vote_type: 'up' | 'down'; created_at: string; };
        Insert: { id?: string; zone_id: string; username: string; vote_type: 'up' | 'down'; created_at?: string; };
        Update: { id?: string; zone_id?: string; username?: string; vote_type?: 'up' | 'down'; created_at?: string; };
        Relationships: [];
      };
      zone_comments: {
        Row: { id: string; zone_id: string; username: string; comment: string | null; rating: number; created_at: string; };
        Insert: { id?: string; zone_id: string; username: string; comment?: string | null; rating: number; created_at?: string; };
        Update: { id?: string; zone_id?: string; username?: string; comment?: string | null; rating?: number; created_at?: string; };
        Relationships: [];
      };
      route_images: {
        Row: { id: string; route_id: string; storage_path: string; file_name: string; file_size: number | null; mime_type: string | null; display_order: number; created_by: string | null; created_at: string; };
        Insert: { id?: string; route_id: string; storage_path: string; file_name: string; file_size?: number | null; mime_type?: string | null; display_order?: number; created_by?: string | null; created_at?: string; };
        Update: { id?: string; route_id?: string; storage_path?: string; file_name?: string; file_size?: number | null; mime_type?: string | null; display_order?: number; created_by?: string | null; created_at?: string; };
        Relationships: [];
      };
      route_documents: {
        Row: { id: string; route_id: string; storage_path: string; file_name: string; file_size: number | null; mime_type: string | null; created_by: string | null; created_at: string; };
        Insert: { id?: string; route_id: string; storage_path: string; file_name: string; file_size?: number | null; mime_type?: string | null; created_by?: string | null; created_at?: string; };
        Update: { id?: string; route_id?: string; storage_path?: string; file_name?: string; file_size?: number | null; mime_type?: string | null; created_by?: string | null; created_at?: string; };
        Relationships: [];
      };
      zone_images: {
        Row: { id: string; zone_id: string; storage_path: string; file_name: string; file_size: number | null; mime_type: string | null; display_order: number; created_by: string | null; created_at: string; };
        Insert: { id?: string; zone_id: string; storage_path: string; file_name: string; file_size?: number | null; mime_type?: string | null; display_order?: number; created_by?: string | null; created_at?: string; };
        Update: { id?: string; zone_id?: string; storage_path?: string; file_name?: string; file_size?: number | null; mime_type?: string | null; display_order?: number; created_by?: string | null; created_at?: string; };
        Relationships: [];
      };
      zone_documents: {
        Row: { id: string; zone_id: string; storage_path: string; file_name: string; file_size: number | null; mime_type: string | null; created_by: string | null; created_at: string; };
        Insert: { id?: string; zone_id: string; storage_path: string; file_name: string; file_size?: number | null; mime_type?: string | null; created_by?: string | null; created_at?: string; };
        Update: { id?: string; zone_id?: string; storage_path?: string; file_name?: string; file_size?: number | null; mime_type?: string | null; created_by?: string | null; created_at?: string; };
        Relationships: [];
      };
      user_bans: {
        Row: { id: string; username: string; ban_type: 'permanent' | 'temporary'; ban_until: string | null; reason: string | null; banned_by: string; created_at: string; };
        Insert: { id?: string; username: string; ban_type: 'permanent' | 'temporary'; ban_until?: string | null; reason?: string | null; banned_by?: string; created_at?: string; };
        Update: { id?: string; username?: string; ban_type?: 'permanent' | 'temporary'; ban_until?: string | null; reason?: string | null; banned_by?: string; created_at?: string; };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
    Functions: {
      get_user_role: {
        Args: Record<string, never>;
        Returns: 'superadmin' | 'admin' | 'editor' | 'viewer';
      };
      can_edit: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_superadmin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      search_locations: {
        Args: { search_query: string };
        Returns: {
          id: string;
          name: string;
          description: string | null;
          latitude: number;
          longitude: number;
          preview_image_url: string | null;
          rank: number;
          matched_in: string;
        }[];
      };
      search_locations_with_highlights: {
        Args: { search_query: string; max_results?: number };
        Returns: {
          id: string;
          name: string;
          description: string | null;
          latitude: number;
          longitude: number;
          preview_image_url: string | null;
          rank: number;
          matched_in: string;
          name_highlight: string;
          description_highlight: string;
        }[];
      };
    };
    Enums: {
      user_role: 'superadmin' | 'admin' | 'editor' | 'viewer';
      suggestion_status: 'pending' | 'approved' | 'rejected';
    };
  };
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Insertable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type Updatable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
export type UserRole = Database['public']['Enums']['user_role'];
export type SuggestionStatus = Database['public']['Enums']['suggestion_status'];
