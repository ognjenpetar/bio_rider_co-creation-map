import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { GoogleLoginButton } from '../components/auth/GoogleLoginButton';
import { LanguageSwitcher } from '../components/common/LanguageSwitcher';

export function LoginPage() {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the intended destination or default to home
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, from]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex flex-col">
      {/* Language switcher in top right */}
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo and title */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg mb-4">
              <svg
                className="w-10 h-10 text-white"
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Bio Rider
            </h1>
            <p className="text-gray-600 mt-1">
              {t('app.subtitle')}
            </p>
          </div>

          {/* Login card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <h2 className="text-lg font-semibold text-gray-900 text-center mb-2">
              {t('auth.welcome')}
            </h2>
            <p className="text-sm text-gray-600 text-center mb-6">
              {t('auth.loginPrompt')}
            </p>

            <GoogleLoginButton />

            <p className="mt-6 text-xs text-gray-500 text-center">
              {t('auth.termsNotice')}
            </p>
          </div>

          {/* Footer info */}
          <p className="mt-8 text-center text-sm text-gray-500">
            {t('app.region')}
          </p>
        </div>
      </div>
    </div>
  );
}
