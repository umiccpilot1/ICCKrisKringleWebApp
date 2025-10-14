import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { requestMagicLink } from '../services/api.js';
import Button from '../components/common/Button.jsx';

const features = [
  { label: 'No passwords', description: 'Magic link authentication keeps access secure.' },
  { label: 'Instant access', description: 'Log in within seconds from any device.' },
  { label: 'Easy coordination', description: 'Manage wishlists and assignments in one hub.' }
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      await requestMagicLink(email);
      toast.success('Magic link sent!');
      navigate('/magic-link-sent');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to send magic link');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
      <div className="space-y-8">
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-icc-gray-100 border border-icc-gray-200 text-sm font-semibold text-icc-blue">
          <span className="flex h-2 w-2 rounded-full bg-icc-orange animate-pulse" aria-hidden="true" />
          Seamless gift coordination
        </span>
        <h1 className="text-5xl lg:text-6xl font-bold leading-tight text-icc-gray-900">
          Secure access to the Kris Kringle portal
        </h1>
        <p className="text-lg text-icc-gray-600 leading-relaxed max-w-xl">
          Manage wishlists, review assignments, and keep your holiday exchange running smoothly—all through a secure magic link delivered to your inbox.
        </p>
        <div className="grid sm:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div key={feature.label} className="bg-white border border-icc-gray-200 rounded-2xl p-5 shadow-card">
              <h3 className="text-base font-semibold text-icc-gray-900 mb-2">{feature.label}</h3>
              <p className="text-sm text-icc-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-white/60 rounded-3xl shadow-card p-10">
        <h2 className="text-2xl font-semibold text-icc-gray-900 mb-2">Sign in with a magic link</h2>
        <p className="text-icc-gray-600 mb-8">Enter your work email and we&apos;ll send a secure link to access the employee portal.</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-icc-gray-700 mb-2">
              Work Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-icc-gray-200 px-4 py-3 text-sm focus:border-icc-blue focus:outline-none focus:ring-2 focus:ring-icc-blue/20"
              placeholder="you@company.com"
            />
          </div>
          <Button type="submit" variant="primary" size="md" className="w-full" disabled={loading}>
            {loading ? 'Sending…' : 'Send magic link'}
          </Button>
          <p className="text-xs text-icc-gray-500 text-center">
            By signing in you agree to keep your Kris Kringle assignment confidential until reveal day.
          </p>
        </form>
      </div>
    </div>
  );
}
