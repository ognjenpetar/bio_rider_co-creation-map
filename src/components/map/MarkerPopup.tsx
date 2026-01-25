import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../../contexts/AuthContext';
import type { Location } from '../../types';

interface MarkerPopupProps {
  location: Location;
}

export function MarkerPopup({ location }: MarkerPopupProps) {
  const { t } = useTranslation();
  const { canEdit } = useAuth();

  // Truncate description for popup
  const shortDescription = location.description
    ? location.description.length > 200
      ? location.description.substring(0, 200) + '...'
      : location.description
    : null;

  return (
    <div className="p-1">
      {/* Image */}
      {location.preview_image_url && (
        <div className="mb-3 -mx-1 -mt-1">
          <img
            src={location.preview_image_url}
            alt={location.name}
            className="w-full h-32 object-cover rounded-t"
          />
        </div>
      )}

      {/* Content */}
      <div className="space-y-2">
        <h3 className="font-semibold text-gray-900 text-base">
          {location.name}
        </h3>

        {shortDescription && (
          <div className="text-sm text-gray-600 prose prose-sm max-w-none">
            <ReactMarkdown>{shortDescription}</ReactMarkdown>
          </div>
        )}

        {/* Coordinates */}
        <p className="text-xs text-gray-500">
          {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
          <Link
            to={`/location/${location.id}`}
            className="flex-1 text-center px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            {t('location.viewDetails')}
          </Link>

          {canEdit && (
            <Link
              to={`/location/${location.id}/edit`}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              {t('location.edit')}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
