import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getLocations, hardDeleteLocation, resetAllLocations } from '../../lib/api/locations';
import { useAuth } from '../../contexts/AuthContext';
import { useMap } from '../../contexts/MapContext';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Modal } from '../common/Modal';
import type { Location } from '../../types';

export function LocationModeration() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { selectLocation, centerOnLocation } = useMap();
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Location | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const fetchLocations = async () => {
    try {
      setIsLoading(true);
      const data = await getLocations();
      setLocations(data);
    } catch (err) {
      setError(t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, [t]);

  const handleDelete = async () => {
    if (!deleteTarget || !isAdmin) return;

    try {
      setIsDeleting(true);
      await hardDeleteLocation(deleteTarget.id);
      setDeleteTarget(null);
      fetchLocations();
    } catch (err) {
      setError(t('common.error'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (location: Location) => {
    selectLocation(location);
    navigate('/');
  };

  const handleViewOnMap = (location: Location) => {
    centerOnLocation(location.latitude, location.longitude, 15);
    navigate('/');
  };

  const handleResetMap = async () => {
    if (!isAdmin) return;

    try {
      setIsResetting(true);
      await resetAllLocations();
      setShowResetConfirm(false);
      fetchLocations();
    } catch (err) {
      setError(t('common.error'));
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {t('admin.locations')}
          </h2>
          <span className="text-sm text-gray-500">
            {t('admin.totalLocations')}: {locations.length}
          </span>
        </div>
        {locations.length > 0 && (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {t('admin.resetMap')}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {locations.length === 0 ? (
        <p className="text-center py-8 text-gray-500">
          {t('admin.noLocations')}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                  {t('location.name')}
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                  {t('location.createdBy')}
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                  {t('location.coordinates')}
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                  {t('location.createdAt')}
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {locations.map((location) => (
                <tr key={location.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {location.preview_image_url ? (
                        <img
                          src={location.preview_image_url}
                          alt=""
                          className="w-10 h-10 rounded object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-green-100 rounded flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-green-600"
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
                      <div>
                        <span className="font-medium text-gray-900 block">
                          {location.name}
                        </span>
                        {location.description && (
                          <span className="text-xs text-gray-500 line-clamp-1">
                            {location.description}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                      {location.created_by || 'Unknown'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 font-mono">
                    {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {new Date(location.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleViewOnMap(location)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title={t('admin.viewOnMap')}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleEdit(location)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title={t('admin.editLocation')}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteTarget(location)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title={t('admin.deleteLocation')}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={t('common.confirm')}
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            {t('location.confirmDelete')}
          </p>
          <p className="font-medium text-gray-900">
            {deleteTarget?.name}
          </p>
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {isDeleting ? t('common.loading') : t('common.delete')}
            </button>
          </div>
        </div>
      </Modal>

      {/* Reset Map Confirmation Modal */}
      <Modal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        title={t('admin.resetMap')}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-semibold text-red-900">
                {t('admin.resetMapConfirm')}
              </p>
              <p className="text-sm text-red-700 mt-1">
                {t('admin.resetMapWarning', { count: locations.length })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => setShowResetConfirm(false)}
              disabled={isResetting}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleResetMap}
              disabled={isResetting}
              className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {isResetting ? t('admin.resetting') : t('admin.resetMap')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
