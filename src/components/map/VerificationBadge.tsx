import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { getVerificationCount, hasUserVerified, verifyLocation, removeVerification } from '../../lib/api/verifications';

interface VerificationBadgeProps {
  locationId: string;
}

export function VerificationBadge({ locationId }: VerificationBadgeProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const [userVerified, setUserVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getVerificationCount(locationId).then(setCount).catch(() => {});
    if (user?.username) {
      hasUserVerified(locationId, user.username).then(setUserVerified).catch(() => {});
    }
  }, [locationId, user?.username]);

  const handleToggle = async () => {
    if (!user?.username || loading) return;
    setLoading(true);
    try {
      if (userVerified) {
        await removeVerification(locationId, user.username);
        setUserVerified(false);
        setCount(prev => Math.max(0, prev - 1));
      } else {
        await verifyLocation({ location_id: locationId, username: user.username });
        setUserVerified(true);
        setCount(prev => prev + 1);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
        userVerified
          ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
      title={t('verification.toggle')}
    >
      <svg className="w-4 h-4" fill={userVerified ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{count}</span>
      {count >= 3 && (
        <span className="ml-0.5 text-emerald-600 font-bold" title={t('verification.verified')}>
          &#10003;
        </span>
      )}
    </button>
  );
}
