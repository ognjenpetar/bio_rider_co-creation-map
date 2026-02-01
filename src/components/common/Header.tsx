import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { LanguageSwitcher } from './LanguageSwitcher';

export function Header() {
  const { t } = useTranslation();
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigation = [
    { name: t('nav.map'), href: '/' },
    ...(isAdmin ? [{ name: t('nav.admin'), href: '/admin' }] : []),
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-700 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
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
            <span className="font-semibold text-gray-900 hidden sm:block">
              Bio Rider
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navigation.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'text-green-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <LanguageSwitcher />

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <div className="w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                  {user?.username}
                </span>
                {isAdmin && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full hidden sm:block">
                    Admin
                  </span>
                )}
              </button>

              {/* Dropdown */}
              {isMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {t('auth.loggedInAs')}
                      </p>
                      <p className="text-sm text-green-600 font-semibold mt-0.5">
                        {user?.username}
                      </p>
                      <p className="text-xs text-gray-500 capitalize mt-1">
                        {isAdmin ? t('roles.admin') : t('roles.user')}
                      </p>
                    </div>

                    {/* Mobile Navigation */}
                    <div className="md:hidden py-1 border-b border-gray-100">
                      {navigation.map((item) => (
                        <Link
                          key={item.href}
                          to={item.href}
                          onClick={() => setIsMenuOpen(false)}
                          className={`block px-4 py-2 text-sm ${
                            isActive(item.href)
                              ? 'text-green-600 bg-green-50'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      {t('auth.signOut')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
