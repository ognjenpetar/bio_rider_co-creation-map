import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getLocations, hardDeleteLocation } from '../../lib/api/locations';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Modal } from '../common/Modal';
import type { Location } from '../../types';

export function LocationModeration() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Location | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
        <h2 className="text-lg font-semibold text-gray-900">
          {t('admin.locations')}
        </h2>
        <span className="text-sm text-gray-500">
          {t('admin.totalLocations')}: {locations.length}
        </span>
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
                  {t('common.delete')}
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
                      <span className="font-medium text-gray-900">
                        {location.name}
                      </span>
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
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setDeleteTarget(location)}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      {t('common.delete')}
                    </button>
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
    </div>
  );
}
