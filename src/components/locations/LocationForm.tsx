import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDropzone } from 'react-dropzone';
import MDEditor from '@uiw/react-md-editor';
import { useMap } from '../../contexts/MapContext';
import type { Location, LocationFormData } from '../../types';

interface LocationFormProps {
  initialData?: Partial<Location>;
  mode: 'create' | 'edit';
  onSubmit: (data: LocationFormData, images?: File[], documents?: File[]) => Promise<void>;
  onCancel: () => void;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DOC_SIZE = 20 * 1024 * 1024; // 20MB
const ACCEPTED_IMAGE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
};
const ACCEPTED_DOC_TYPES = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
};

export function LocationForm({
  initialData,
  mode,
  onSubmit,
  onCancel,
}: LocationFormProps) {
  const { t } = useTranslation();
  const { pendingCoordinates, setPendingCoordinates, setIsAddingLocation } = useMap();

  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [latitude, setLatitude] = useState(
    pendingCoordinates?.lat ?? initialData?.latitude ?? 0
  );
  const [longitude, setLongitude] = useState(
    pendingCoordinates?.lng ?? initialData?.longitude ?? 0
  );
  const [images, setImages] = useState<File[]>([]);
  const [documents, setDocuments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update coordinates when pendingCoordinates changes
  if (
    pendingCoordinates &&
    (pendingCoordinates.lat !== latitude || pendingCoordinates.lng !== longitude)
  ) {
    setLatitude(pendingCoordinates.lat);
    setLongitude(pendingCoordinates.lng);
  }

  // Image dropzone
  const onDropImages = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter((file) => file.size <= MAX_IMAGE_SIZE);
    setImages((prev) => [...prev, ...validFiles]);
  }, []);

  const {
    getRootProps: getImageRootProps,
    getInputProps: getImageInputProps,
    isDragActive: isImageDragActive,
  } = useDropzone({
    onDrop: onDropImages,
    accept: ACCEPTED_IMAGE_TYPES,
    maxSize: MAX_IMAGE_SIZE,
  });

  // Document dropzone
  const onDropDocuments = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter((file) => file.size <= MAX_DOC_SIZE);
    setDocuments((prev) => [...prev, ...validFiles]);
  }, []);

  const {
    getRootProps: getDocRootProps,
    getInputProps: getDocInputProps,
    isDragActive: isDocDragActive,
  } = useDropzone({
    onDrop: onDropDocuments,
    accept: ACCEPTED_DOC_TYPES,
    maxSize: MAX_DOC_SIZE,
  });

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSelectOnMap = () => {
    setIsAddingLocation(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError(t('locationForm.error'));
      return;
    }

    if (!latitude || !longitude) {
      setError(t('locationForm.selectOnMap'));
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(
        {
          name: name.trim(),
          description: description.trim(),
          latitude,
          longitude,
        },
        images.length > 0 ? images : undefined,
        documents.length > 0 ? documents : undefined
      );
      setPendingCoordinates(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('locationForm.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const titleKey =
    mode === 'create'
      ? 'locationForm.createTitle'
      : 'locationForm.editTitle';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">{t(titleKey)}</h2>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          {t('location.name')} *
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('locationForm.namePlaceholder')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('location.description')}
        </label>
        <div data-color-mode="light">
          <MDEditor
            value={description}
            onChange={(value) => setDescription(value || '')}
            preview="edit"
            height={200}
            textareaProps={{
              placeholder: t('locationForm.descriptionPlaceholder'),
            }}
          />
        </div>
      </div>

      {/* Coordinates */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('location.coordinates')} *
        </label>
        <div className="grid grid-cols-2 gap-4 mb-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              {t('location.latitude')}
            </label>
            <input
              type="number"
              value={latitude || ''}
              onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
              step="0.000001"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              {t('location.longitude')}
            </label>
            <input
              type="number"
              value={longitude || ''}
              onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
              step="0.000001"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={handleSelectOnMap}
          className="text-sm text-green-600 hover:text-green-700"
        >
          {t('locationForm.selectOnMap')}
        </button>
      </div>

      {/* Images */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('location.images')}
        </label>
        <div
          {...getImageRootProps()}
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
            isImageDragActive
              ? 'border-green-500 bg-green-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getImageInputProps()} />
          <svg
            className="mx-auto h-8 w-8 text-gray-400 mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm text-gray-600">{t('locationForm.dropImages')}</p>
          <p className="text-xs text-gray-400 mt-1">
            {t('locationForm.supportedImageFormats')}
          </p>
        </div>

        {/* Image previews */}
        {images.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {images.map((file, index) => (
              <div key={index} className="relative group">
                <img
                  src={URL.createObjectURL(file)}
                  alt=""
                  className="w-16 h-16 rounded object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Documents */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('location.documents')}
        </label>
        <div
          {...getDocRootProps()}
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
            isDocDragActive
              ? 'border-green-500 bg-green-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getDocInputProps()} />
          <svg
            className="mx-auto h-8 w-8 text-gray-400 mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-sm text-gray-600">{t('locationForm.dropDocuments')}</p>
          <p className="text-xs text-gray-400 mt-1">
            {t('locationForm.supportedDocFormats')}
          </p>
        </div>

        {/* Document list */}
        {documents.length > 0 && (
          <div className="mt-3 space-y-2">
            {documents.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
              >
                <span className="text-sm text-gray-700 truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeDocument(index)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
          disabled={isSubmitting}
        >
          {t('locationForm.cancel')}
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? t('locationForm.saving') : t('locationForm.save')}
        </button>
      </div>
    </form>
  );
}
