import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getSuggestions, approveSuggestion, rejectSuggestion } from '../../lib/api/suggestions';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Modal } from '../common/Modal';
import type { EditSuggestionWithProfile, SuggestionStatus } from '../../types';

export function EditSuggestions() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<EditSuggestionWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<SuggestionStatus | 'all'>('pending');
  const [selectedSuggestion, setSelectedSuggestion] = useState<EditSuggestionWithProfile | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchSuggestions = async () => {
    try {
      setIsLoading(true);
      const status = filter === 'all' ? undefined : filter;
      const data = await getSuggestions(status);
      setSuggestions(data);
    } catch (err) {
      setError(t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [filter, t]);

  const handleApprove = async () => {
    if (!selectedSuggestion || !user) return;

    try {
      setIsProcessing(true);
      await approveSuggestion(selectedSuggestion.id, user.id, reviewNotes);
      setSelectedSuggestion(null);
      setReviewNotes('');
      fetchSuggestions();
    } catch (err) {
      setError(t('common.error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedSuggestion || !user) return;

    try {
      setIsProcessing(true);
      await rejectSuggestion(selectedSuggestion.id, user.id, reviewNotes);
      setSelectedSuggestion(null);
      setReviewNotes('');
      fetchSuggestions();
    } catch (err) {
      setError(t('common.error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: SuggestionStatus) => {
    const classes = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
    };
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${classes[status]}`}>
        {t(`suggestions.${status}`)}
      </span>
    );
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
          {t('suggestions.title')}
        </h2>

        {/* Filter */}
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as SuggestionStatus | 'all')}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All</option>
          <option value="pending">{t('suggestions.pending')}</option>
          <option value="approved">{t('suggestions.approved')}</option>
          <option value="rejected">{t('suggestions.rejected')}</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {suggestions.length === 0 ? (
        <p className="text-center py-8 text-gray-500">
          {t('suggestions.noSuggestions')}
        </p>
      ) : (
        <div className="space-y-4">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusBadge(suggestion.status)}
                    <span className="text-sm text-gray-500 capitalize">
                      {suggestion.suggestion_type}
                    </span>
                  </div>

                  <h3 className="font-medium text-gray-900">
                    {(suggestion.suggested_data as { name?: string }).name || 'Untitled'}
                  </h3>

                  {suggestion.location && (
                    <p className="text-sm text-gray-600 mt-1">
                      Location: {suggestion.location.name}
                    </p>
                  )}

                  <div className="mt-2 text-xs text-gray-500">
                    {t('suggestions.submittedBy')}: {suggestion.suggestor?.full_name || suggestion.suggestor?.email}
                    <span className="mx-2">•</span>
                    {new Date(suggestion.created_at).toLocaleDateString()}
                  </div>
                </div>

                {suggestion.status === 'pending' && (
                  <button
                    onClick={() => setSelectedSuggestion(suggestion)}
                    className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Review
                  </button>
                )}
              </div>

              {suggestion.review_notes && (
                <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-600">
                  <span className="font-medium">{t('suggestions.reviewNotes')}:</span>{' '}
                  {suggestion.review_notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      <Modal
        isOpen={!!selectedSuggestion}
        onClose={() => {
          setSelectedSuggestion(null);
          setReviewNotes('');
        }}
        title="Review Suggestion"
        size="lg"
      >
        {selectedSuggestion && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                {t('suggestions.suggestedChanges')}
              </h4>
              <div className="bg-gray-50 rounded-lg p-4 text-sm">
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(selectedSuggestion.suggested_data, null, 2)}
                </pre>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('suggestions.reviewNotes')}
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder={t('suggestions.reviewNotesPlaceholder')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={handleReject}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 bg-red-100 text-red-700 font-medium rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
              >
                {t('suggestions.reject')}
              </button>
              <button
                onClick={handleApprove}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {t('suggestions.approve')}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
