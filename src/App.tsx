import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { MapProvider } from './contexts/MapContext';
import { AuthGuard, RoleGuard } from './components/auth';
import { LoginPage, MapPage, AdminPage } from './pages';

// Handle GitHub Pages SPA redirect
function GitHubPagesRedirect() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const redirectPath = searchParams.get('p');
    if (redirectPath) {
      // Remove the query parameter and navigate to the actual path
      navigate(redirectPath, { replace: true });
    }
  }, [navigate, searchParams]);

  return null;
}

function AppRoutes() {
  return (
    <>
      <GitHubPagesRedirect />
      <Routes>
        {/* Public route - Login (optional, for users who want to edit) */}
        <Route path="/login" element={<LoginPage />} />

        {/* Public route - Map (anonymous viewing allowed) */}
        <Route
          path="/"
          element={
            <MapProvider>
              <MapPage />
            </MapProvider>
          }
        />

        {/* Admin route - requires admin or superadmin role */}
        <Route
          path="/admin"
          element={
            <AuthGuard>
              <RoleGuard allowedRoles={['admin', 'superadmin']}>
                <AdminPage />
              </RoleGuard>
            </AuthGuard>
          }
        />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  const basePath = import.meta.env.VITE_BASE_PATH || '/';

  return (
    <BrowserRouter basename={basePath}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
