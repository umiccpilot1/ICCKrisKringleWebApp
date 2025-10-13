import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-nightfall/70 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
        <Link to="/" className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-iris via-orchid to-aurora text-lg font-semibold text-white shadow-glow">
            KK
          </span>
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Kris Kringle</p>
            <p className="font-display text-lg font-semibold text-white">Gift Exchange Hub</p>
          </div>
        </Link>
        {user ? (
          <div className="flex items-center gap-4 text-sm text-slate-300">
            <span className="hidden sm:inline text-slate-400">Hello, <span className="text-white">{user.name}</span></span>
            {user.isAdmin || user.isSuperAdmin ? (
              <Link className="rounded-full border border-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-slate-200 transition hover:border-aurora/60 hover:text-white" to="/admin">
                Admin Console
              </Link>
            ) : null}
            <button
              type="button"
              onClick={logout}
              className="rounded-full bg-gradient-to-r from-aurora/90 via-iris/90 to-orchid/90 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white shadow-glow transition hover:shadow-lg hover:shadow-aurora/40"
            >
              Logout
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="rounded-full border border-white/20 px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-white transition hover:border-aurora/50"
          >
            Login
          </Link>
        )}
      </div>
    </header>
  );
}
