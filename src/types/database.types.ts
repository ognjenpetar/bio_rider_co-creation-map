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
          latitude: number;
          longitude: number;
          preview_image_url: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          latitude: number;
          longitude: number;
          preview_image_url?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          latitude?: number;
          longitude?: number;
          preview_image_url?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
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
