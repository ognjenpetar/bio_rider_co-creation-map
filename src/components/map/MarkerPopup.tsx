import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useMap } from '../../contexts/MapContext';
import type { Location } from '../../types';

interface MarkerPopupProps {
  location: Location;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function MarkerPopup({ location, onEdit, onDelete }: MarkerPopupProps) {
  const { t } = useTranslation();
  const { user, isAdmin } = useAuth();
  const { setSelectedLocation } = useMap();

  // Check if current user can edit this location (admin or creator)
  const canEdit = isAdmin || user?.username === location.created_by;
  // Only admin can delete
  const canDelete = isAdmin;

  // Truncate description for popup
  const shortDescription = location.description
    ? location.description.length > 150
      ? location.description.substring(0, 150) + '...'
      : location.description
    : null;

  const handleEdit = () => {
    setSelectedLocation(location);
    onEdit?.();
  };

  const handleDelete = () => {
    if (window.confirm(t('location.confirmDelete'))) {
      onDelete?.();
    }
  };

  return (
    <div className="min-w-[250px] max-w-[300px]">
      {/* Image */}
      {location.preview_image_url && (
        <div className="-mx-3 -mt-3 mb-3">
          <img
            src={location.preview_image_url}
            alt={location.name}
            className="w-full h-32 object-cover rounded-t-lg"
          />
        </div>
      )}

      {/* Content */}
      <div className="space-y-2">
        <h3 className="font-semibold text-gray-900 text-lg leading-tight">
          {location.name}
        </h3>

        {shortDescription && (
          <p className="text-sm text-gray-600 leading-relaxed">
            {shortDescription}
          </p>
        )}

        {/* Creator info */}
        <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-2 py-1.5 rounded">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>{t('location.createdBy')}: <strong>{location.created_by || 'Unknown'}</strong></span>
        </div>

        {/* Coordinates */}
        <p className="text-xs text-gray-400 font-mono">
          {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
          {canEdit && (
            <button
              onClick={handleEdit}
              className="flex-1 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              {t('location.edit')}
            </button>
          )}

          {canDelete && (
            <button
              onClick={handleDelete}
              className="px-3 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200 transition-colors"
            >
              {t('location.delete')}
            </button>
          )}

          {!canEdit && !canDelete && (
            <p className="text-xs text-gray-400 italic">
              {t('location.adminOnlyEdit')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
