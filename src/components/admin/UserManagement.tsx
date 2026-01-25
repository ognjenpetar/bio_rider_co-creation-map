import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getUsers, updateUserRole } from '../../lib/api/users';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../common/LoadingSpinner';
import type { Profile, UserRole } from '../../types';

const ROLES: UserRole[] = ['viewer', 'editor', 'admin', 'superadmin'];

export function UserManagement() {
  const { t } = useTranslation();
  const { isSuperAdmin, user } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        setIsLoading(true);
        const data = await getUsers();
        setUsers(data);
      } catch (err) {
        setError(t('common.error'));
      } finally {
        setIsLoading(false);
      }
    }
    fetchUsers();
  }, [t]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (!isSuperAdmin) return;

    try {
      setUpdatingUserId(userId);
      const updatedUser = await updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? updatedUser : u))
      );
    } catch (err) {
      setError(t('common.error'));
    } finally {
      setUpdatingUserId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        {t('admin.userManagement')}
      </h2>

      <div className="mb-4 text-sm text-gray-600">
        {t('admin.totalUsers')}: {users.length}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                User
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                Email
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                {t('admin.changeRole')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((profile) => (
              <tr key={profile.id} className="hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt=""
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-700">
                          {profile.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">
                        {profile.full_name || 'Unknown'}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {profile.email}
                </td>
                <td className="py-3 px-4">
                  {isSuperAdmin && profile.id !== user?.id ? (
                    <select
                      value={profile.role}
                      onChange={(e) =>
                        handleRoleChange(profile.id, e.target.value as UserRole)
                      }
                      disabled={updatingUserId === profile.id}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {t(`roles.${role}`)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        profile.role === 'superadmin'
                          ? 'bg-purple-100 text-purple-700'
                          : profile.role === 'admin'
                          ? 'bg-blue-100 text-blue-700'
                          : profile.role === 'editor'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {t(`roles.${profile.role}`)}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <p className="text-center py-8 text-gray-500">{t('admin.noUsers')}</p>
      )}
    </div>
  );
}
