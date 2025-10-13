import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg rounded-3xl border border-white/10 bg-white/5 p-10 text-center shadow-soft backdrop-blur">
      <h1 className="font-display text-3xl font-semibold text-white">You’ve reached the edge of the aurora</h1>
      <p className="mt-4 text-sm text-slate-300">We couldn’t find that page. Return to the dashboard to continue the festivities.</p>
      <Link className="mt-6 inline-block text-sm text-aurora transition hover:text-white" to="/">
        Back to dashboard
      </Link>
    </div>
  );
}
