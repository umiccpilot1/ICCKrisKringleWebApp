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
    return <p className="text-center text-sm text-icc-gray-500">Confirming your wishlist…</p>;
  }

  if (status === 'success') {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-white/60 bg-white p-10 text-center shadow-card">
        <h1 className="text-3xl font-bold text-icc-gray-900">No confirmation needed</h1>
        <p className="mt-4 text-sm text-icc-gray-600">Your wishlist is already saved. You can return to the dashboard at any time.</p>
  <Button onClick={() => navigate('/portal')}>Back to dashboard</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg rounded-3xl border border-white/60 bg-white p-10 text-center shadow-card">
      <h1 className="text-3xl font-bold text-icc-gray-900">Link issue</h1>
      <p className="mt-4 text-sm text-icc-gray-600">The confirmation link is not valid. Please update your wishlist from the dashboard instead.</p>
  <Button onClick={() => navigate('/portal')}>Return to dashboard</Button>
    </div>
  );
}
