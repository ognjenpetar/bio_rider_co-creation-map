import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useMap } from '../../contexts/MapContext';
import { getAverageRating } from '../../lib/api/comments';
import { voteLocation, removeVote, getUserVote, getLocationVoteCounts } from '../../lib/api/votes';
import { StarRating } from './StarRating';
import { LocationComments } from './LocationComments';
import { VerificationBadge } from './VerificationBadge';
import { DeliberationPanel } from './DeliberationPanel';
import type { Location } from '../../types';

interface MarkerPopupProps {
  location: Location;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function MarkerPopup({ location, onEdit, onDelete }: MarkerPopupProps) {
  const { t, i18n } = useTranslation();
  const { user, isAdmin } = useAuth();
  const { setSelectedLocation } = useMap();
  const [showComments, setShowComments] = useState(false);
  const [showDeliberation, setShowDeliberation] = useState(false);
  const [avgRating, setAvgRating] = useState({ average: 0, count: 0 });
  const [copied, setCopied] = useState(false);

  // Vote state
  const [voteCounts, setVoteCounts] = useState({ up: location.votes_up ?? 0, down: location.votes_down ?? 0 });
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [isVoting, setIsVoting] = useState(false);

  const canEdit = isAdmin || user?.username === location.created_by;
  const canDelete = isAdmin;

  // Get localized description
  const currentLang = i18n.language;
  const localizedDescription =
    (currentLang === 'sr' ? location.description_sr : location.description_en)
    || location.description;

  const shortDescription = localizedDescription
    ? localizedDescription.length > 150
      ? localizedDescription.substring(0, 150) + '...'
      : localizedDescription
    : null;

  useEffect(() => {
    getAverageRating(location.id).then(setAvgRating).catch(() => {});
    getLocationVoteCounts(location.id).then(setVoteCounts).catch(() => {});
    if (user?.username) {
      getUserVote(location.id, user.username).then(setUserVote).catch(() => {});
    }
  }, [location.id, user?.username]);

  const handleVote = async (voteType: 'up' | 'down') => {
    if (!user?.username || isVoting) return;
    setIsVoting(true);
    try {
      if (userVote === voteType) {
        await removeVote(location.id, user.username);
        setUserVote(null);
      } else {
        await voteLocation(location.id, user.username, voteType);
        setUserVote(voteType);
      }
      const counts = await getLocationVoteCounts(location.id);
      setVoteCounts(counts);
    } catch {
      // silent
    } finally {
      setIsVoting(false);
    }
  };

  const handleEdit = () => {
    setSelectedLocation(location);
    onEdit?.();
  };

  const handleDelete = () => {
    if (window.confirm(t('location.confirmDelete'))) {
      onDelete?.();
    }
  };

  const handleShare = async () => {
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?location=${location.id}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (showDeliberation) {
    return (
      <DeliberationPanel
        locationId={location.id}
        locationName={location.name}
        onClose={() => setShowDeliberation(false)}
      />
    );
  }

  if (showComments) {
    return (
      <div className="min-w-[280px] max-w-[350px]">
        <LocationComments
          locationId={location.id}
          onClose={() => setShowComments(false)}
        />
      </div>
    );
  }

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

        {/* Average rating */}
        {avgRating.count > 0 && (
          <div className="flex items-center gap-2">
            <StarRating rating={Math.round(avgRating.average)} size="sm" readonly />
            <span className="text-sm text-gray-600">
              {avgRating.average.toFixed(1)} ({avgRating.count})
            </span>
          </div>
        )}

        {/* Vote buttons */}
        {user && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleVote('up')}
              disabled={isVoting}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                userVote === 'up'
                  ? 'bg-green-100 text-green-700 ring-1 ring-green-400'
                  : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
              {voteCounts.up}
            </button>
            <button
              onClick={() => handleVote('down')}
              disabled={isVoting}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                userVote === 'down'
                  ? 'bg-red-100 text-red-700 ring-1 ring-red-400'
                  : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
              }`}
            >
              <svg className="w-3.5 h-3.5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
              {voteCounts.down}
            </button>
          </div>
        )}

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

        {/* Verification + coordinates */}
        <div className="flex items-center justify-between">
          <VerificationBadge locationId={location.id} />
          <p className="text-xs text-gray-400 font-mono">
            {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-gray-100 flex-wrap">
          <button
            onClick={() => setShowComments(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg hover:bg-blue-100 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            {avgRating.count > 0 ? avgRating.count : ''}
          </button>

          <button
            onClick={() => setShowDeliberation(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-purple-50 text-purple-700 text-xs font-medium rounded-lg hover:bg-purple-100 transition-colors"
            title={t('deliberation.title')}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1 px-3 py-2 bg-gray-50 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
            title={t('share.copyLink')}
          >
            {copied ? (
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            )}
          </button>

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
        </div>
      </div>
    </div>
  );
}
