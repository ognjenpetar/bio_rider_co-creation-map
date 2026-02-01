import { useTranslation } from 'react-i18next';
import { Header } from '../components/common/Header';
import { LocationModeration } from '../components/admin';

export function AdminPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t('admin.title')}</h1>
          <p className="text-gray-500 mt-1">
            {t('admin.locations')}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <LocationModeration />
        </div>
      </main>
    </div>
  );
}
