import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { getComments, addComment, deleteComment, getCommentImageUrl } from '../../lib/api/comments';
import { StarRating } from './StarRating';
import type { LocationComment } from '../../types';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

interface LocationCommentsProps {
  locationId: string;
  onClose: () => void;
}

export function LocationComments({ locationId, onClose }: LocationCommentsProps) {
  const { t } = useTranslation();
  const { user, isAdmin } = useAuth();
  const [comments, setComments] = useState<LocationComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchComments = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getComments(locationId);
      setComments(data);
    } catch {
      // silent fail
    } finally {
      setIsLoading(false);
    }
  }, [locationId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_SIZE) return;
    if (!file.type.startsWith('image/')) return;

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || newRating === 0) return;

    try {
      setIsSubmitting(true);
      await addComment({
        location_id: locationId,
        username: user.username,
        comment: newComment || undefined,
        rating: newRating,
        image: selectedImage || undefined,
      });
      setNewComment('');
      setNewRating(0);
      clearImage();
      await fetchComments();
    } catch {
      // silent fail
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteComment(id);
      await fetchComments();
    } catch {
      // silent fail
    }
  };

  const avgRating = comments.length > 0
    ? comments.reduce((sum, c) => sum + c.rating, 0) / comments.length
    : 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-lg max-h-96 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-gray-900">{t('comments.title')}</h3>
          {comments.length > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <StarRating rating={Math.round(avgRating)} size="sm" readonly />
              <span>{avgRating.toFixed(1)} ({comments.length})</span>
            </div>
          )}
        </div>
        <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <p className="text-center text-gray-400 text-sm py-4">{t('common.loading')}</p>
        ) : comments.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-4">{t('comments.noComments')}</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{comment.username}</span>
                  <StarRating rating={comment.rating} size="sm" readonly />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                  {(isAdmin || user?.username === comment.username) && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      {t('common.delete')}
                    </button>
                  )}
                </div>
              </div>
              {comment.comment && (
                <p className="text-sm text-gray-700">{comment.comment}</p>
              )}
              {/* Comment image */}
              {comment.image_storage_path && (
                <a
                  href={getCommentImageUrl(comment.image_storage_path)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-2"
                >
                  <img
                    src={getCommentImageUrl(comment.image_storage_path)}
                    alt={comment.image_file_name || 'Comment image'}
                    className="w-full max-h-40 object-cover rounded-lg border border-gray-200 hover:opacity-90 transition-opacity cursor-pointer"
                  />
                </a>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add comment form */}
      {user && (
        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-gray-600">{t('comments.yourRating')}:</span>
            <StarRating rating={newRating} onRate={setNewRating} size="md" />
          </div>

          {/* Image preview */}
          {imagePreview && (
            <div className="relative mb-2 inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="h-20 w-20 object-cover rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={clearImage}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
              >
                &times;
              </button>
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={t('comments.commentPlaceholder')}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />

            {/* Image upload button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`px-2.5 py-2 text-sm rounded-lg border transition-colors ${
                selectedImage
                  ? 'bg-blue-50 border-blue-300 text-blue-600'
                  : 'border-gray-300 text-gray-500 hover:bg-gray-50'
              }`}
              title={t('comments.addImage')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            <button
              type="submit"
              disabled={isSubmitting || newRating === 0}
              className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('comments.submit')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
