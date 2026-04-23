import { useState } from 'react';
import { Header } from '../components/common/Header';
import { LocationModeration, UserManagement } from '../components/admin';

type AdminTab = 'locations' | 'users';

export function AdminPage() {
  const [tab, setTab] = useState<AdminTab>('locations');

  const tabs: { id: AdminTab; label: string; icon: string }[] = [
    { id: 'locations', label: 'Lokacije', icon: '📌' },
    { id: 'users', label: 'Korisnici', icon: '👥' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-500 mt-1">Upravljanje sadržajem i korisnicima</p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 mb-6 w-fit">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                tab === t.id
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {tab === 'locations' && <LocationModeration />}
          {tab === 'users' && <UserManagement />}
        </div>
      </main>
    </div>
  );
}
