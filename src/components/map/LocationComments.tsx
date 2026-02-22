import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { getComments, addComment, deleteComment } from '../../lib/api/comments';
import { StarRating } from './StarRating';
import type { LocationComment } from '../../types';

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
      });
      setNewComment('');
      setNewRating(0);
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
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={t('comments.placeholder')}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
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
