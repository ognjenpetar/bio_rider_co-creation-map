import { useState, useEffect, useCallback, useRef } from 'react';
import { getLocations, createLocation, updateLocation as updateLocationApi, deleteLocation } from '../lib/api/locations';
import { useMap } from '../contexts/MapContext';
import { supabase } from '../lib/supabase';
import type { Location } from '../types';

interface UseLocationsReturn {
  locations: Location[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  addLocation: (
    data: { name: string; description?: string; latitude: number; longitude: number; created_by: string },
    images?: File[],
    documents?: File[]
  ) => Promise<Location>;
  updateLocation: (
    id: string,
    data: { name?: string; description?: string; latitude?: number; longitude?: number }
  ) => Promise<Location>;
  removeLocation: (id: string) => Promise<void>;
}

export function useLocations(): UseLocationsReturn {
  const { setLocations } = useMap();
  const [localLocations, setLocalLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isMounted = useRef(true);

  const fetchLocations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Clear immediately so stale data doesn't persist while fetching
      setLocalLocations([]);
      setLocations([]);
      const data = await getLocations();
      if (!isMounted.current) return;
      setLocalLocations(data);
      setLocations(data);
    } catch (err) {
      if (!isMounted.current) return;
      setError(err instanceof Error ? err : new Error('Failed to fetch locations'));
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  }, [setLocations]);

  useEffect(() => {
    isMounted.current = true;
    fetchLocations();

    // Realtime subscription — re-fetch whenever locations table changes
    const channel = supabase
      .channel('locations-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'locations' }, () => {
        if (isMounted.current) fetchLocations();
      })
      .subscribe();

    return () => {
      isMounted.current = false;
      supabase.removeChannel(channel);
    };
  }, [fetchLocations]);

  const addLocation = useCallback(
    async (
      data: { name: string; description?: string; latitude: number; longitude: number; created_by: string },
      images?: File[],
      documents?: File[]
    ): Promise<Location> => {
      const location = await createLocation(data, images, documents);

      // Refresh to get updated data including preview image
      await fetchLocations();

      return location;
    },
    [fetchLocations]
  );

  const updateLocation = useCallback(
    async (
      id: string,
      data: { name?: string; description?: string; latitude?: number; longitude?: number }
    ): Promise<Location> => {
      const location = await updateLocationApi(id, data);

      // Refresh to get updated data
      await fetchLocations();

      return location;
    },
    [fetchLocations]
  );

  const removeLocation = useCallback(
    async (id: string): Promise<void> => {
      await deleteLocation(id);

      // Refresh to get updated data
      await fetchLocations();
    },
    [fetchLocations]
  );

  return {
    locations: localLocations,
    isLoading,
    error,
    refresh: fetchLocations,
    addLocation,
    updateLocation,
    removeLocation,
  };
}
