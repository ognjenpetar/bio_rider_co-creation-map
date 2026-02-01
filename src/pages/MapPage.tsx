import { useState, useEffect } from 'react';
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
import type { LocationFormData } from '../types';

export function MapPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isAddingLocation, setIsAddingLocation, pendingCoordinates, setPendingCoordinates, selectedLocation, setSelectedLocation } = useMap();
  const { addLocation, updateLocation } = useLocations();
  const { results, isSearching, query, search, clearSearch } = useSearch();

  const [showForm, setShowForm] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const handleAddLocation = () => {
    setIsAddingLocation(true);
    setIsEditMode(false);
    setSelectedLocation(null);
  };

  const handleFormSubmit = async (data: LocationFormData, images?: File[], documents?: File[]) => {
    if (!user) return;

    if (isEditMode && selectedLocation) {
      // Update existing location
      await updateLocation(selectedLocation.id, data);
    } else {
      // Create new location with username
      await addLocation({
        ...data,
        created_by: user.username,
      }, images, documents);
    }

    setShowForm(false);
    setPendingCoordinates(null);
    setIsEditMode(false);
    setSelectedLocation(null);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setPendingCoordinates(null);
    setIsAddingLocation(false);
    setIsEditMode(false);
    setSelectedLocation(null);
  };

  // Show form when coordinates are selected (new location)
  useEffect(() => {
    if (pendingCoordinates && !showForm && !isEditMode) {
      setShowForm(true);
    }
  }, [pendingCoordinates, showForm, isEditMode]);

  // Handle edit mode when location is selected
  useEffect(() => {
    if (selectedLocation && !showForm) {
      setIsEditMode(true);
      setShowForm(true);
    }
  }, [selectedLocation, showForm]);

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

            {/* Add location button - everyone can add */}
            <button
              onClick={handleAddLocation}
              disabled={isAddingLocation}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                isAddingLocation
                  ? 'bg-green-100 text-green-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
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
          </div>
        </div>

        {/* Map instruction banner */}
        {isAddingLocation && (
          <div className="bg-green-50 border-b border-green-200 px-4 py-2">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <p className="text-sm text-green-700">
                {t('map.clickToAdd')}
              </p>
              <button
                onClick={() => setIsAddingLocation(false)}
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        )}

        {/* Map */}
        <div className="flex-1 relative">
          <MapContainer className="h-full" />
        </div>

        {/* Footer with logos */}
        <footer className="bg-white border-t border-gray-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <img
                src={`${import.meta.env.BASE_URL}logos/bio-rider-logo.svg`}
                alt="Bio Rider"
                className="h-10"
              />
            </div>
            <div className="flex items-center gap-6">
              <img
                src={`${import.meta.env.BASE_URL}logos/green-mobility-logo.jpeg`}
                alt="Green Mobility"
                className="h-8 object-contain"
              />
              <img
                src={`${import.meta.env.BASE_URL}logos/eit-logo.png`}
                alt="EIT Co-funded"
                className="h-8 object-contain"
              />
            </div>
          </div>
        </footer>
      </main>

      {/* Location form modal */}
      <Modal
        isOpen={showForm}
        onClose={handleFormCancel}
        size="lg"
      >
        <LocationForm
          mode={isEditMode ? 'edit' : 'create'}
          initialData={isEditMode && selectedLocation ? {
            name: selectedLocation.name,
            description: selectedLocation.description || '',
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
          } : undefined}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      </Modal>
    </div>
  );
}
