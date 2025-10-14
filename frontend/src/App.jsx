import { Route, Routes, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import PortalLayout from './components/layout/PortalLayout.jsx';
import Login from './pages/Login.jsx';
import MagicLinkSent from './pages/MagicLinkSent.jsx';
import AuthCallback from './pages/AuthCallback.jsx';
import ConfirmWishlist from './pages/ConfirmWishlist.jsx';
import NotFound from './pages/NotFound.jsx';
import EmployeeDashboard from './components/employee/EmployeeDashboard.jsx';
import AdminPanel from './components/admin/AdminPanel.jsx';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (adminOnly && !user.isAdmin && !user.isSuperAdmin) {
    return <Navigate to="/portal" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route
        path="/login"
        element={(
          <PortalLayout>
            <Login />
          </PortalLayout>
        )}
      />
      <Route
        path="/magic-link-sent"
        element={(
          <PortalLayout>
            <MagicLinkSent />
          </PortalLayout>
        )}
      />
      <Route
        path="/auth/callback"
        element={(
          <PortalLayout>
            <AuthCallback />
          </PortalLayout>
        )}
      />
      <Route
        path="/confirm-wishlist"
        element={(
          <PortalLayout>
            <ConfirmWishlist />
          </PortalLayout>
        )}
      />

      <Route
        path="/portal"
        element={(
          <ProtectedRoute>
            <PortalLayout>
              <EmployeeDashboard />
            </PortalLayout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/portal/admin"
        element={(
          <ProtectedRoute adminOnly>
            <PortalLayout>
              <AdminPanel />
            </PortalLayout>
          </ProtectedRoute>
        )}
      />

      <Route
        path="*"
        element={(
          <PortalLayout>
            <NotFound />
          </PortalLayout>
        )}
      />
    </Routes>
  );
}
