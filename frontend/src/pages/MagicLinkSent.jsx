import { Link } from 'react-router-dom';

export default function MagicLinkSent() {
  return (
    <div className="mx-auto max-w-lg rounded-3xl border border-white/60 bg-white p-10 text-center shadow-card">
      <h1 className="text-3xl font-bold text-icc-gray-900">Magic link on its way ✨</h1>
      <p className="mt-4 text-sm text-icc-gray-600">
        We emailed you a secure sign-in link. It expires within a few hours—open it from this device for the smoothest experience.
      </p>
      <Link className="mt-6 inline-block text-sm font-semibold text-icc-blue hover:text-icc-blue-light transition-smooth" to="/login">
        Back to login
      </Link>
    </div>
  );
}
