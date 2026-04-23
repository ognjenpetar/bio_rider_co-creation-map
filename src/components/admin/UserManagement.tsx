import { useState, useEffect } from 'react';
import { listUsers, banUser, unbanUser, deleteAllUserEntries, type UserSummary } from '../../lib/api/userManagement';

export function UserManagement() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null);
  const [banType, setBanType] = useState<'permanent' | 'temporary'>('permanent');
  const [banUntil, setBanUntil] = useState('');
  const [banReason, setBanReason] = useState('');
  const [working, setWorking] = useState(false);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try { setUsers(await listUsers()); } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleBan = async () => {
    if (!selectedUser) return;
    setWorking(true);
    try {
      await banUser(selectedUser.username, banType, banType === 'temporary' ? banUntil : null, banReason);
      setSelectedUser(null);
      setBanReason('');
      setBanUntil('');
      await load();
    } catch { /* silent */ } finally { setWorking(false); }
  };

  const handleUnban = async (username: string) => {
    setWorking(true);
    try { await unbanUser(username); await load(); }
    catch { /* silent */ } finally { setWorking(false); }
  };

  const handleDeleteAll = async (username: string) => {
    if (!window.confirm(`Obrisati SVE unose korisnika "${username}"? Ova akcija je nepovratna.`)) return;
    setWorking(true);
    try { await deleteAllUserEntries(username); await load(); }
    catch { /* silent */ } finally { setWorking(false); }
  };

  const filtered = users.filter(u => u.username.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Upravljanje korisnicima</h2>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Pretraži korisnike..."
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none w-48"
        />
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-8">Učitavanje...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-gray-400 py-8">Nema korisnika.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 font-semibold text-gray-700">Korisnik</th>
                <th className="text-center py-2 px-3 font-semibold text-gray-700">Lok.</th>
                <th className="text-center py-2 px-3 font-semibold text-gray-700">Rute</th>
                <th className="text-center py-2 px-3 font-semibold text-gray-700">Zone</th>
                <th className="text-center py-2 px-3 font-semibold text-gray-700">Kom.</th>
                <th className="text-center py-2 px-3 font-semibold text-gray-700">Status</th>
                <th className="text-right py-2 px-3 font-semibold text-gray-700">Akcije</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => {
                const isBanned = !!u.ban;
                const isTemp = u.ban?.ban_type === 'temporary';
                return (
                  <tr key={u.username} className={`border-b border-gray-100 ${isBanned ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                    <td className="py-2.5 px-3 font-medium text-gray-900">{u.username}</td>
                    <td className="py-2.5 px-3 text-center text-gray-600">{u.locations}</td>
                    <td className="py-2.5 px-3 text-center text-gray-600">{u.routes}</td>
                    <td className="py-2.5 px-3 text-center text-gray-600">{u.zones}</td>
                    <td className="py-2.5 px-3 text-center text-gray-600">{u.comments}</td>
                    <td className="py-2.5 px-3 text-center">
                      {isBanned ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full ${isTemp ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                          {isTemp ? '⏱ Privremeno' : '🚫 Zabranjen'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                          ✓ Aktivan
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isBanned ? (
                          <button
                            onClick={() => handleUnban(u.username)}
                            disabled={working}
                            className="px-2.5 py-1 text-xs font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 disabled:opacity-50"
                          >
                            Odblokuj
                          </button>
                        ) : (
                          <button
                            onClick={() => { setSelectedUser(u); setBanType('permanent'); setBanReason(''); setBanUntil(''); }}
                            disabled={working}
                            className="px-2.5 py-1 text-xs font-medium bg-red-50 text-red-700 rounded-lg hover:bg-red-100 disabled:opacity-50"
                          >
                            Blokiraj
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteAll(u.username)}
                          disabled={working}
                          className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                          title="Obriši sve unose"
                        >
                          🗑 Unosi
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Ban dialog */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-bold text-gray-900">Blokiraj korisnika: <span className="text-red-600">{selectedUser.username}</span></h3>

            <div className="flex gap-2">
              {(['permanent', 'temporary'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setBanType(t)}
                  className={`flex-1 py-2 text-sm font-medium rounded-xl border-2 transition-colors ${banType === t ? 'border-red-400 bg-red-50 text-red-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                >
                  {t === 'permanent' ? '🚫 Trajno' : '⏱ Privremeno'}
                </button>
              ))}
            </div>

            {banType === 'temporary' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Zabranjeno do</label>
                <input
                  type="datetime-local"
                  value={banUntil}
                  onChange={e => setBanUntil(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Razlog (opciono)</label>
              <input
                value={banReason}
                onChange={e => setBanReason(e.target.value)}
                placeholder="Razlog blokiranja..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedUser(null)}
                className="flex-1 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200"
              >
                Otkaži
              </button>
              <button
                onClick={handleBan}
                disabled={working || (banType === 'temporary' && !banUntil)}
                className="flex-1 py-2 text-sm font-medium bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50"
              >
                Blokiraj
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
