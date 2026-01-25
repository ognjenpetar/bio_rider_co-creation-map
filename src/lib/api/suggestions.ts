import { supabase } from '../supabase';
import type { EditSuggestion, EditSuggestionWithProfile, LocationFormData, SuggestionStatus } from '../../types';
import type { Json } from '../../types/database.types';

// Get all suggestions (admin view)
export async function getSuggestions(status?: SuggestionStatus): Promise<EditSuggestionWithProfile[]> {
  let query = supabase
    .from('edit_suggestions')
    .select('*')
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Transform the data to match the expected type
  return (data || []).map(item => ({
    ...item,
    suggested_data: item.suggested_data as unknown as LocationFormData,
    suggestor: null,
    reviewer: null,
    location: null,
  }));
}

// Get pending suggestions count
export async function getPendingSuggestionsCount(): Promise<number> {
  const { count, error } = await supabase
    .from('edit_suggestions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  if (error) throw error;
  return count || 0;
}

// Get user's own suggestions
export async function getUserSuggestions(userId: string): Promise<EditSuggestion[]> {
  const { data, error } = await supabase
    .from('edit_suggestions')
    .select('*')
    .eq('suggested_by', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(item => ({
    ...item,
    suggested_data: item.suggested_data as unknown as LocationFormData,
  }));
}

// Create new suggestion
export async function createSuggestion(
  data: {
    locationId?: string;
    suggestionType: 'create' | 'update' | 'delete';
    suggestedData: LocationFormData;
  },
  userId: string
): Promise<EditSuggestion> {
  const { data: suggestion, error } = await supabase
    .from('edit_suggestions')
    .insert({
      location_id: data.locationId || null,
      suggested_by: userId,
      suggestion_type: data.suggestionType,
      suggested_data: data.suggestedData as unknown as Json,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    ...suggestion,
    suggested_data: suggestion.suggested_data as unknown as LocationFormData,
  };
}

// Approve suggestion
export async function approveSuggestion(
  id: string,
  reviewerId: string,
  notes?: string
): Promise<EditSuggestion> {
  const { data: suggestion, error } = await supabase
    .from('edit_suggestions')
    .update({
      status: 'approved',
      reviewed_by: reviewerId,
      review_notes: notes || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  const typedSuggestion: EditSuggestion = {
    ...suggestion,
    suggested_data: suggestion.suggested_data as unknown as LocationFormData,
  };

  // Apply the suggestion
  await applySuggestion(typedSuggestion);

  return typedSuggestion;
}

// Reject suggestion
export async function rejectSuggestion(
  id: string,
  reviewerId: string,
  notes?: string
): Promise<EditSuggestion> {
  const { data: suggestion, error } = await supabase
    .from('edit_suggestions')
    .update({
      status: 'rejected',
      reviewed_by: reviewerId,
      review_notes: notes || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return {
    ...suggestion,
    suggested_data: suggestion.suggested_data as unknown as LocationFormData,
  };
}

// Apply approved suggestion
async function applySuggestion(suggestion: EditSuggestion): Promise<void> {
  const suggestedData = suggestion.suggested_data as LocationFormData;

  switch (suggestion.suggestion_type) {
    case 'create':
      await supabase.from('locations').insert({
        name: suggestedData.name,
        description: suggestedData.description,
        latitude: suggestedData.latitude,
        longitude: suggestedData.longitude,
      });
      break;

    case 'update':
      if (suggestion.location_id) {
        await supabase
          .from('locations')
          .update({
            name: suggestedData.name,
            description: suggestedData.description,
            latitude: suggestedData.latitude,
            longitude: suggestedData.longitude,
          })
          .eq('id', suggestion.location_id);
      }
      break;

    case 'delete':
      if (suggestion.location_id) {
        await supabase
          .from('locations')
          .update({ is_active: false })
          .eq('id', suggestion.location_id);
      }
      break;
  }
}

// Delete suggestion (superadmin only)
export async function deleteSuggestion(id: string): Promise<void> {
  const { error } = await supabase
    .from('edit_suggestions')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
