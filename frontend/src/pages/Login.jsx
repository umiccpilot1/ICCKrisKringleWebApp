import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { requestMagicLink } from '../services/api.js';
import Button from '../components/common/Button.jsx';

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
    <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
      <div className="space-y-6">
        <p className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.35em] text-slate-300">
          Seamless holiday coordination
        </p>
        <h1 className="font-display text-4xl font-semibold text-white sm:text-5xl">
          A polished way to share gift ideas with your team.
        </h1>
        <p className="max-w-xl text-base text-slate-300">
          Use your company email to receive a secure magic link. Once inside, curate wishlists, view assignments, and manage the exchange with confidence.
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-soft backdrop-blur">
        <h2 className="text-lg font-semibold text-white">Sign in with magic link</h2>
        <p className="mt-2 text-sm text-slate-300">We’ll email you a one-time link—no passwords to remember.</p>
        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-200">
            Email address
            <input
              type="email"
              required
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white placeholder:text-slate-500 focus:border-aurora/60 focus:outline-none"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
            />
          </label>
          <Button type="submit" disabled={loading}>{loading ? 'Sending…' : 'Send magic link'}</Button>
          <p className="text-xs text-slate-500">By continuing you agree to keep your Kris Kringle assignment confidential until reveal day.</p>
        </form>
      </div>
    </div>
  );
}
