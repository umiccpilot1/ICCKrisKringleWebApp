import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { fetchWishlist, submitWishlist } from '../../services/api.js';
import Button from '../common/Button.jsx';

export default function WishlistForm() {
  const [items, setItems] = useState(['', '', '']);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWishlist() {
      try {
        const { data } = await fetchWishlist();
        if (data.wishlist) {
          const savedItems = data.wishlist.items || [];
          setItems([...savedItems, '', ''].slice(0, 3));
          setIsConfirmed(data.wishlist.isConfirmed);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    loadWishlist();
  }, []);

  function updateItem(index, value) {
    setItems((prev) => prev.map((item, idx) => (idx === index ? value : item)));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const filtered = items.map((item) => item.trim()).filter(Boolean);
    if (filtered.length === 0) {
      toast.error('Add at least one gift idea');
      return;
    }
    try {
      await submitWishlist(filtered);
      toast.success('Wishlist saved!');
      setItems([...filtered, '', ''].slice(0, 3));
      setIsConfirmed(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save wishlist');
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-400">Loading wishlist…</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-4">
        {items.map((item, index) => (
          <label key={index} className="block text-sm text-slate-200">
            Item {index + 1}
            <input
              type="text"
              maxLength={120}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white placeholder:text-slate-500 focus:border-aurora/60 focus:outline-none"
              value={item}
              onChange={(event) => updateItem(index, event.target.value)}
              placeholder="Add a thoughtful idea"
            />
          </label>
        ))}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className={`text-xs ${isConfirmed ? 'text-emerald-400' : 'text-slate-400'}`}>
          {isConfirmed ? 'Latest wishlist saved.' : 'No saved wishlist yet.'}
        </span>
        <Button type="submit">Save wishlist</Button>
      </div>
    </form>
  );
}
