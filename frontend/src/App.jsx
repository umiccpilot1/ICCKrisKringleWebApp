import { Route, Routes, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/layout/Layout.jsx';
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
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<ProtectedRoute><EmployeeDashboard /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPanel /></ProtectedRoute>} />
        <Route path="/login" element={<Login />} />
        <Route path="/magic-link-sent" element={<MagicLinkSent />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/confirm-wishlist" element={<ConfirmWishlist />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}
