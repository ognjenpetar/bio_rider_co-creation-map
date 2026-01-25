import { useState, useCallback } from 'react';
import { searchLocations } from '../lib/api/search';
import { useMap } from '../contexts/MapContext';
import type { SearchResult } from '../types';

interface UseSearchReturn {
  results: SearchResult[];
  isSearching: boolean;
  query: string;
  error: Error | null;
  search: (query: string) => Promise<void>;
  clearSearch: () => void;
}

export function useSearch(): UseSearchReturn {
  const { setFilteredLocationIds } = useMap();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<Error | null>(null);

  const search = useCallback(
    async (searchQuery: string) => {
      const trimmedQuery = searchQuery.trim();

      if (!trimmedQuery) {
        setResults([]);
        setQuery('');
        setFilteredLocationIds(null);
        return;
      }

      try {
        setIsSearching(true);
        setError(null);
        setQuery(trimmedQuery);

        const searchResults = await searchLocations(trimmedQuery);
        setResults(searchResults);

        // Update map filter
        const matchedIds = new Set(searchResults.map((r) => r.id));
        setFilteredLocationIds(matchedIds.size > 0 ? matchedIds : null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Search failed'));
        setResults([]);
        setFilteredLocationIds(null);
      } finally {
        setIsSearching(false);
      }
    },
    [setFilteredLocationIds]
  );

  const clearSearch = useCallback(() => {
    setResults([]);
    setQuery('');
    setError(null);
    setFilteredLocationIds(null);
  }, [setFilteredLocationIds]);

  return {
    results,
    isSearching,
    query,
    error,
    search,
    clearSearch,
  };
}
