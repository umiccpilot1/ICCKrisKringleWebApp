import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-24">
      <div className="rounded-full bg-brand-100 px-6 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand-600">
        404
      </div>
      <div className="max-w-xl text-center">
        <h1 className="text-3xl font-bold text-gray-900">We can’t find that page</h1>
        <p className="mt-4 text-sm text-muted-700">
          The link you followed might be broken or the page may have been removed. Head back to the login screen to access the Kris Kringle hub.
        </p>
      </div>
      <Link
        to="/login"
        className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-brand-600"
      >
        Go to Login
      </Link>
    </div>
  );
}
