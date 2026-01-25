import { useState } from 'react';
import { Header } from '../components/common/Header';
import {
  AdminLayout,
  UserManagement,
  EditSuggestions,
  LocationModeration,
} from '../components/admin';

export function AdminPage() {
  const [activeTab, setActiveTab] = useState('users');

  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return <UserManagement />;
      case 'suggestions':
        return <EditSuggestions />;
      case 'locations':
        return <LocationModeration />;
      default:
        return <UserManagement />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
        {renderContent()}
      </AdminLayout>
    </div>
  );
}
