import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function PortalHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/portal" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-icc-blue to-icc-blue-light rounded-lg blur opacity-75 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-icc-blue to-icc-blue-light text-white text-lg font-bold shadow-lg">
                🎁
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-semibold text-icc-gray-600 uppercase tracking-wider">Kris Kringle</div>
              <div className="text-sm font-bold text-icc-gray-900">Gift Exchange Hub</div>
            </div>
          </Link>

          {user ? (
            <div className="flex items-center space-x-4">
              <span className="hidden md:inline-flex text-sm text-icc-gray-600">
                <span className="font-semibold text-icc-gray-900">{user.name}</span>
              </span>
              {(user.isAdmin || user.isSuperAdmin) && (
                <Link
                  to="/portal/admin"
                  className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-medium text-icc-gray-700 hover:text-icc-gray-900 hover:bg-icc-gray-100 rounded-lg transition-smooth"
                >
                  Admin
                </Link>
              )}
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-icc-blue rounded-lg shadow-md hover:shadow-lg transition-smooth hover:-translate-y-0.5"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center px-4 py-2 text-sm font-semibold text-icc-blue border-2 border-icc-blue rounded-lg hover:bg-icc-gray-100 transition-smooth"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
