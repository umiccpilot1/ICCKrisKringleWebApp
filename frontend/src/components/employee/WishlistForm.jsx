import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { fetchWishlist, submitWishlist } from '../../services/api.js';
import Button from '../common/Button.jsx';

export default function WishlistForm() {
  const [items, setItems] = useState([
    { description: '', link: '' },
    { description: '', link: '' },
    { description: '', link: '' }
  ]);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWishlist() {
      try {
        const { data } = await fetchWishlist();
        if (data.wishlist) {
          const savedItems = data.wishlist.items || [];
          // Normalize saved items to have description and link fields
          const normalizedItems = savedItems.map(item => {
            if (typeof item === 'string') {
              // Handle legacy format (string items)
              return { description: item, link: '' };
            }
            return item;
          });
          // Pad with empty items to always have 3 slots
          const paddedItems = [...normalizedItems, { description: '', link: '' }, { description: '', link: '' }].slice(0, 3);
          setItems(paddedItems);
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

  function updateItem(index, field, value) {
    setItems((prev) => prev.map((item, idx) =>
      idx === index ? { ...item, [field]: value } : item
    ));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    // Filter out empty items (items with no description)
    const filtered = items
      .filter(item => item.description.trim().length > 0)
      .map(item => ({
        description: item.description.trim(),
        link: item.link.trim()
      }));

    if (filtered.length === 0) {
      toast.error('Add at least one gift idea');
      return;
    }
    try {
      await submitWishlist(filtered);
      toast.success('Wishlist saved!');
      // Pad the filtered items back to 3 slots
      const paddedItems = [...filtered, { description: '', link: '' }, { description: '', link: '' }].slice(0, 3);
      setItems(paddedItems);
      setIsConfirmed(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save wishlist');
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-slate-400 flex items-center gap-2">
        <span className="animate-spin">⏳</span>
        Loading wishlist…
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-center">
      <div className="space-y-6">
        {items.map((item, index) => (
          <div key={index} className="block group">
            <span className="text-sm font-medium text-gray-700 flex items-center justify-center gap-2 mb-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-50 text-brand-500 font-semibold group-hover:bg-brand-100 transition-colors">
                {index + 1}
              </span>
              Item {index + 1}
            </span>

            <div className="space-y-2">
              <input
                type="text"
                maxLength={120}
                className="w-full max-w-lg mx-auto rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-all hover:border-brand-300"
                value={item.description}
                onChange={(event) => updateItem(index, 'description', event.target.value)}
                placeholder="What would you like? (e.g., Coffee mug, Book, Gadget)"
              />

              <div className="relative">
                <input
                  type="url"
                  className="w-full max-w-lg mx-auto rounded-lg border border-gray-300 bg-white px-4 py-3 pl-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-all hover:border-brand-300"
                  value={item.link}
                  onChange={(event) => updateItem(index, 'link', event.target.value)}
                  placeholder="Optional: Link to product online"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔗</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col items-center gap-3 pt-2">
        <span className={`text-sm font-medium flex items-center justify-center gap-2 ${isConfirmed ? 'text-success' : 'text-muted-700'}`}>
          {isConfirmed ? (
            <>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success/20 text-success">✓</span>
              Latest wishlist saved.
            </>
          ) : (
            <>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-gray-500">📝</span>
              No saved wishlist yet.
            </>
          )}
        </span>
        <Button type="submit">
          Save wishlist
        </Button>
      </div>
    </form>
  );
}
