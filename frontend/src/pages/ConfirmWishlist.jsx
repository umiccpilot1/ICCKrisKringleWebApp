import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { confirmWishlist } from '../services/api.js';
import Button from '../components/common/Button.jsx';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function ConfirmWishlist() {
  const [status, setStatus] = useState('pending');
  const query = useQuery();
  const navigate = useNavigate();

  useEffect(() => {
    const token = query.get('token');
    async function confirm() {
      try {
        const { data } = await confirmWishlist(token);
        if (data?.message) {
          toast.success(data.message);
        }
        setStatus('success');
      } catch (error) {
        setStatus('error');
        toast.error(error.response?.data?.message || 'Confirmation failed');
      }
    }
    confirm();
  }, [query]);

  if (status === 'pending') {
    return <p className="text-center text-sm text-slate-400">Confirming your wishlist…</p>;
  }

  if (status === 'success') {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-white/10 bg-white/5 p-10 text-center shadow-soft backdrop-blur">
        <h1 className="font-display text-3xl font-semibold text-white">No confirmation needed</h1>
        <p className="mt-4 text-sm text-slate-300">Your wishlist is already saved. You can return to the dashboard at any time.</p>
        <Button onClick={() => navigate('/')}>Back to dashboard</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg rounded-3xl border border-white/10 bg-white/5 p-10 text-center shadow-soft backdrop-blur">
      <h1 className="font-display text-3xl font-semibold text-white">Link issue</h1>
      <p className="mt-4 text-sm text-slate-300">The confirmation link is not valid. Please update your wishlist from the dashboard instead.</p>
      <Button onClick={() => navigate('/')}>Return home</Button>
    </div>
  );
}
