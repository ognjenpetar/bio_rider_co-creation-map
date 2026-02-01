import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MapProvider } from './contexts/MapContext';
import { LoginPage, MapPage, AdminPage } from './pages';
import { LoadingSpinner } from './components/common';

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

// Require authentication to access routes
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Admin guard - only allow admin users
function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <>
      <GitHubPagesRedirect />
      <Routes>
        {/* Login page */}
        <Route path="/login" element={<LoginPage />} />

        {/* Map page - requires login */}
        <Route
          path="/"
          element={
            <RequireAuth>
              <MapProvider>
                <MapPage />
              </MapProvider>
            </RequireAuth>
          }
        />

        {/* Admin page - requires admin */}
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <RequireAdmin>
                <AdminPage />
              </RequireAdmin>
            </RequireAuth>
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
