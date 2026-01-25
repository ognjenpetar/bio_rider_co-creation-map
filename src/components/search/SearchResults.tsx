import { useTranslation } from 'react-i18next';
import { useMap } from '../../contexts/MapContext';
import type { SearchResult } from '../../types';

interface SearchResultsProps {
  results: SearchResult[];
  isLoading: boolean;
  query: string;
}

export function SearchResults({ results, isLoading, query }: SearchResultsProps) {
  const { t } = useTranslation();
  const { centerOnLocation, selectLocation, locations } = useMap();

  if (isLoading) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        {t('common.loading')}
      </div>
    );
  }

  if (!query) {
    return null;
  }

  if (results.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        {t('search.noResults')}
      </div>
    );
  }

  const handleResultClick = (result: SearchResult) => {
    // Find the full location object
    const location = locations.find((loc) => loc.id === result.id);
    if (location) {
      selectLocation(location);
    }
    centerOnLocation(result.latitude, result.longitude, 16);
  };

  return (
    <div className="divide-y divide-gray-100">
      {/* Results count */}
      <div className="px-4 py-2 bg-gray-50 text-xs text-gray-600">
        {t('search.resultsCount', { count: results.length })}
      </div>

      {/* Results list */}
      <div className="max-h-80 overflow-y-auto">
        {results.map((result) => (
          <button
            key={result.id}
            onClick={() => handleResultClick(result)}
            className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-50"
          >
            <div className="flex items-start gap-3">
              {/* Thumbnail */}
              {result.preview_image_url ? (
                <img
                  src={result.preview_image_url}
                  alt=""
                  className="w-10 h-10 rounded object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                  </svg>
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Name with highlight */}
                {result.name_highlight ? (
                  <h4
                    className="font-medium text-gray-900 text-sm truncate"
                    dangerouslySetInnerHTML={{ __html: result.name_highlight }}
                  />
                ) : (
                  <h4 className="font-medium text-gray-900 text-sm truncate">
                    {result.name}
                  </h4>
                )}

                {/* Description with highlight */}
                {result.description_highlight ? (
                  <p
                    className="text-xs text-gray-600 mt-0.5 line-clamp-2"
                    dangerouslySetInnerHTML={{
                      __html: result.description_highlight,
                    }}
                  />
                ) : result.description ? (
                  <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                    {result.description}
                  </p>
                ) : null}

                {/* Match indicator */}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400">
                    {t('search.matchedIn')}{' '}
                    <span className="text-primary-600">
                      {t(`search.${result.matched_in}`)}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
