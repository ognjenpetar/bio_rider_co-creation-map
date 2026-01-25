import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Header } from '../components/common/Header';
import { MapContainer } from '../components/map/MapContainer';
import { SearchBar, SearchResults } from '../components/search';
import { LocationForm } from '../components/locations/LocationForm';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../contexts/AuthContext';
import { useMap } from '../contexts/MapContext';
import { useLocations } from '../hooks/useLocations';
import { useSearch } from '../hooks/useSearch';
import { createSuggestion } from '../lib/api/suggestions';
import type { LocationFormData } from '../types';

export function MapPage() {
  const { t } = useTranslation();
  const { canEdit, user } = useAuth();
  const { isAddingLocation, setIsAddingLocation, pendingCoordinates, setPendingCoordinates } = useMap();
  const { addLocation } = useLocations();
  const { results, isSearching, query, search, clearSearch } = useSearch();

  const [showForm, setShowForm] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const handleAddLocation = () => {
    setIsAddingLocation(true);
  };

  const handleFormSubmit = async (data: LocationFormData, images?: File[], documents?: File[]) => {
    if (canEdit) {
      // Editors can add directly
      await addLocation(data, images, documents);
    } else if (user) {
      // Viewers submit suggestions
      await createSuggestion(
        {
          suggestionType: 'create',
          suggestedData: data,
        },
        user.id
      );
    }
    setShowForm(false);
    setPendingCoordinates(null);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setPendingCoordinates(null);
    setIsAddingLocation(false);
  };

  // Show form when coordinates are selected
  if (pendingCoordinates && !showForm) {
    setShowForm(true);
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 flex flex-col">
        {/* Search and controls bar */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            {/* Search */}
            <div className="flex-1 max-w-xl relative">
              <SearchBar
                onSearch={(q) => {
                  search(q);
                  setShowSearchResults(true);
                }}
                onClear={() => {
                  clearSearch();
                  setShowSearchResults(false);
                }}
                isSearching={isSearching}
              />

              {/* Search results dropdown */}
              {showSearchResults && query && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <SearchResults
                    results={results}
                    isLoading={isSearching}
                    query={query}
                  />
                  <button
                    onClick={() => setShowSearchResults(false)}
                    className="w-full px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 border-t border-gray-100"
                  >
                    {t('common.close')}
                  </button>
                </div>
              )}
            </div>

            {/* Add location button */}
            {canEdit && (
              <button
                onClick={handleAddLocation}
                disabled={isAddingLocation}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isAddingLocation
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span className="hidden sm:inline">{t('map.addLocation')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Map instruction banner */}
        {isAddingLocation && (
          <div className="bg-primary-50 border-b border-primary-200 px-4 py-2">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <p className="text-sm text-primary-700">
                {t('map.clickToAdd')}
              </p>
              <button
                onClick={() => setIsAddingLocation(false)}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        )}

        {/* Map */}
        <div className="flex-1">
          <MapContainer className="h-full" />
        </div>
      </main>

      {/* Location form modal */}
      <Modal
        isOpen={showForm}
        onClose={handleFormCancel}
        size="lg"
      >
        <LocationForm
          mode={canEdit ? 'create' : 'suggest'}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      </Modal>
    </div>
  );
}
