import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Header } from '../components/common/Header';
import { MapContainer, LocationsList } from '../components/map';
import { SearchBar, SearchResults } from '../components/search';
import { LocationForm } from '../components/locations/LocationForm';
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
  const [showLocationsList, setShowLocationsList] = useState(false);

  const handleAddLocation = () => {
    setIsAddingLocation(true);
    setIsEditMode(false);
    setSelectedLocation(null);
    setShowForm(false); // Don't show form until map is clicked
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
    setIsAddingLocation(false);
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

      <main className="flex-1 flex flex-col overflow-hidden">
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

            {/* View all locations button */}
            <button
              onClick={() => setShowLocationsList(!showLocationsList)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                showLocationsList
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
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
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
              <span className="hidden sm:inline">{t('map.viewAllLocations')}</span>
            </button>

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
        {isAddingLocation && !showForm && (
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

        {/* Main content area with map and optional panels */}
        <div className="flex-1 flex overflow-hidden">
          {/* Locations list panel on the left side */}
          {showLocationsList && (
            <LocationsList onClose={() => setShowLocationsList(false)} />
          )}

          {/* Map section */}
          <div className={`flex-1 relative ${showForm || showLocationsList ? 'hidden md:block' : ''}`}>
            <MapContainer className="h-full" />
          </div>

          {/* Form panel on the right side */}
          {showForm && (
            <div className="w-full md:w-96 lg:w-[420px] bg-white border-l border-gray-200 flex flex-col overflow-hidden">
              {/* Form header */}
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">
                  {isEditMode ? t('locationForm.editTitle') : t('locationForm.createTitle')}
                </h2>
                <button
                  onClick={handleFormCancel}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Coordinates preview */}
              {pendingCoordinates && (
                <div className="px-4 py-2 bg-green-50 border-b border-green-100">
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="font-mono text-xs">
                      {pendingCoordinates.lat.toFixed(6)}, {pendingCoordinates.lng.toFixed(6)}
                    </span>
                    <span className="text-green-600 text-xs ml-auto">
                      {t('map.dragToMove')}
                    </span>
                  </div>
                </div>
              )}

              {/* Form content */}
              <div className="flex-1 overflow-y-auto p-4">
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
              </div>
            </div>
          )}
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
    </div>
  );
}
