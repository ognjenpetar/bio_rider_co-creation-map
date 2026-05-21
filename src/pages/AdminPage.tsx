import { useState } from 'react';
import { Header } from '../components/common/Header';
import { LocationModeration, UserManagement } from '../components/admin';
import { resetAllLocations } from '../lib/api/locations';
import { resetAllRoutes } from '../lib/api/routes';
import { resetAllZones } from '../lib/api/zones';

type AdminTab = 'locations' | 'users';

export function AdminPage() {
  const [tab, setTab] = useState<AdminTab>('locations');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetDone, setResetDone] = useState(false);

  const tabs: { id: AdminTab; label: string; icon: string }[] = [
    { id: 'locations', label: 'Lokacije', icon: '📌' },
    { id: 'users', label: 'Korisnici', icon: '👥' },
  ];

  const handleResetEntireMap = async () => {
    try {
      setIsResetting(true);
      setResetError(null);
      await Promise.all([
        resetAllLocations(),
        resetAllRoutes(),
        resetAllZones(),
      ]);
      setShowResetConfirm(false);
      setResetDone(true);
      setTimeout(() => setResetDone(false), 4000);
    } catch {
      setResetError('Greška pri resetovanju mape. Pokušajte ponovo.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-gray-500 mt-1">Upravljanje sadržajem i korisnicima</p>
          </div>

          {/* Reset Entire Map */}
          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 active:scale-95 transition-all shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Resetuj celu mapu
          </button>
        </div>

        {/* Success banner */}
        {resetDone && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm font-medium">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Mapa je uspešno resetovana — sve lokacije, rute i zone su obrisane.
          </div>
        )}

        {resetError && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {resetError}
          </div>
        )}

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

      {/* Reset Confirm Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => !isResetting && setShowResetConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Resetuj celu mapu</h3>
                <p className="text-sm text-gray-500 mt-1">Ova akcija je nepovratna</p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 space-y-1.5 text-sm text-red-800">
              <p className="font-semibold">Biće trajno obrisano:</p>
              <ul className="list-disc list-inside space-y-1 text-red-700">
                <li>Sve lokacije (i njihove fotografije i dokumenta)</li>
                <li>Sve nacrtane rute</li>
                <li>Sve nacrtane zone</li>
              </ul>
            </div>

            <p className="text-sm text-gray-600 mb-5">
              Da li ste sigurni da želite da nastavite?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                disabled={isResetting}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Odustani
              </button>
              <button
                onClick={handleResetEntireMap}
                disabled={isResetting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isResetting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Brisanje...
                  </>
                ) : (
                  'Da, obriši sve'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
