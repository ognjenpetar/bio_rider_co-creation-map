import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { voteRoute, removeRouteVote, getUserRouteVote, getRouteVoteCounts } from '../../lib/api/routeVotes';
import { getRouteComments } from '../../lib/api/routeComments';
import { StarRating } from './StarRating';
import { EntityComments } from './EntityComments';
import type { Route } from '../../types';

const ROUTE_TYPE_ICONS: Record<string, string> = {
  cycling: '🚲',
  walking: '🚶',
  hiking: '🥾',
  biotop: '🌿',
  other: '📍',
};

interface RoutePopupProps {
  route: Route;
  onDelete?: (id: string) => void;
}

export function RoutePopup({ route, onDelete }: RoutePopupProps) {
  const { t } = useTranslation();
  const { user, isAdmin } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [voteCounts, setVoteCounts] = useState({ up: route.votes_up ?? 0, down: route.votes_down ?? 0 });
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [avgRating, setAvgRating] = useState(0);

  useEffect(() => {
    getRouteVoteCounts(route.id).then(setVoteCounts).catch(() => {});
    if (user?.username) {
      getUserRouteVote(route.id, user.username).then(setUserVote).catch(() => {});
    }
    getRouteComments(route.id).then(comments => {
      setCommentCount(comments.length);
      if (comments.length > 0) {
        setAvgRating(comments.reduce((s, c) => s + c.rating, 0) / comments.length);
      }
    }).catch(() => {});
  }, [route.id, user?.username]);

  const handleVote = async (voteType: 'up' | 'down') => {
    if (!user?.username || isVoting) return;
    setIsVoting(true);
    try {
      if (userVote === voteType) {
        await removeRouteVote(route.id, user.username);
        setUserVote(null);
      } else {
        await voteRoute(route.id, user.username, voteType);
        setUserVote(voteType);
      }
      const counts = await getRouteVoteCounts(route.id);
      setVoteCounts(counts);
    } catch {
      // silent
    } finally {
      setIsVoting(false);
    }
  };

  if (showComments) {
    return (
      <div className="min-w-[280px] max-w-[350px]">
        <EntityComments
          entityType="route"
          entityId={route.id}
          onClose={() => setShowComments(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-w-[240px] max-w-[300px] space-y-2">
      {/* Header */}
      <h3 className="font-semibold text-gray-900 text-base leading-tight">
        {ROUTE_TYPE_ICONS[route.route_type] || '📍'} {route.name}
      </h3>

      {/* Rating */}
      {avgRating > 0 && (
        <div className="flex items-center gap-2">
          <StarRating rating={Math.round(avgRating)} size="sm" readonly />
          <span className="text-sm text-gray-600">{avgRating.toFixed(1)} ({commentCount})</span>
        </div>
      )}

      {/* Route info */}
      <div className="flex gap-3 text-xs text-gray-500 bg-gray-50 px-2 py-1.5 rounded">
        {route.distance_km && <span>📏 {route.distance_km} km</span>}
        {route.estimated_time_min && <span>⏱ {route.estimated_time_min} {t('routes.minutes', 'min')}</span>}
        <span className="ml-auto">{t('location.createdBy')}: <strong>{route.created_by}</strong></span>
      </div>

      {route.description && (
        <p className="text-sm text-gray-600">{route.description}</p>
      )}

      {/* Votes */}
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

      {/* Actions */}
      <div className="flex items-center gap-1.5 pt-2 border-t border-gray-100">
        <button
          onClick={() => setShowComments(true)}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg hover:bg-blue-100 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          {commentCount > 0 ? commentCount : t('comments.title')}
        </button>

        {isAdmin && onDelete && (
          <button
            onClick={() => {
              if (window.confirm(t('routes.deleteConfirm', 'Delete this route?'))) {
                onDelete(route.id);
              }
            }}
            className="ml-auto px-2.5 py-1.5 bg-red-100 text-red-700 text-xs font-medium rounded-lg hover:bg-red-200 transition-colors"
          >
            {t('common.delete')}
          </button>
        )}
      </div>
    </div>
  );
}
