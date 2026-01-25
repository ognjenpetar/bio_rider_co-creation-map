import { useTranslation } from 'react-i18next';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'en', label: 'EN', name: 'English' },
    { code: 'sr', label: 'SR', name: 'Srpski' },
  ];

  const currentLang = i18n.language?.split('-')[0] || 'en';

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('language', langCode);
  };

  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => handleLanguageChange(lang.code)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            currentLang === lang.code
              ? 'bg-white text-primary-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          title={lang.name}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
