import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function PortalHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/portal" className="flex items-center space-x-3 group">
            <img 
              src="/images/infosoft-logo.png" 
              alt="Infosoft Consulting Corporation" 
              className="h-10 w-auto transition-transform group-hover:scale-105"
            />
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
                className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-gray-900 rounded-lg shadow-md hover:shadow-lg hover:bg-black transition-smooth hover:-translate-y-0.5"
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
