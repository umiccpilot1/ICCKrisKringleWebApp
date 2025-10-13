import { Link } from 'react-router-dom';

export default function MagicLinkSent() {
  return (
    <div className="mx-auto max-w-lg rounded-3xl border border-white/10 bg-white/5 p-10 text-center shadow-soft backdrop-blur">
      <h1 className="font-display text-3xl font-semibold text-white">Magic link on its way ✨</h1>
      <p className="mt-4 text-sm text-slate-300">
        We just emailed you a secure sign-in link. It expires within a few hours—open it from this device for the smoothest experience.
      </p>
      <Link className="mt-6 inline-block text-sm text-aurora transition hover:text-white" to="/login">
        Back to login
      </Link>
    </div>
  );
}
