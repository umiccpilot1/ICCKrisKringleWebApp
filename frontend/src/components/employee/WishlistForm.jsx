import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { fetchWishlist, submitWishlist } from '../../services/api.js';
import Button from '../common/Button.jsx';

export default function WishlistForm({ onConfirmationChange }) {
  const [items, setItems] = useState([
    { description: '', link: '' },
    { description: '', link: '' },
    { description: '', link: '' }
  ]);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deadlinePassed, setDeadlinePassed] = useState(false);
  const [deadline, setDeadline] = useState(null);

  useEffect(() => {
    async function loadWishlist() {
      try {
        const { data } = await fetchWishlist();
        
        // Check deadline status
        if (data.deadlinePassed !== undefined) {
          setDeadlinePassed(data.deadlinePassed);
        }
        if (data.deadline) {
          setDeadline(data.deadline);
        }
        
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
          const confirmed = data.wishlist.isConfirmed;
          setIsConfirmed(confirmed);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    loadWishlist();
  }, []); // Remove onConfirmationChange from dependencies

  function updateItem(index, field, value) {
    setItems((prev) => prev.map((item, idx) =>
      idx === index ? { ...item, [field]: value } : item
    ));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    
    if (deadlinePassed) {
      toast.error('Wishlist deadline has passed. Updates are no longer allowed.');
      return;
    }
    
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
      // Notify parent that wishlist is now confirmed
      if (onConfirmationChange) {
        onConfirmationChange(true);
      }
    } catch (error) {
      if (error.response?.data?.deadlinePassed) {
        toast.error('Wishlist deadline has passed. Updates are no longer allowed.');
        setDeadlinePassed(true);
      } else {
        toast.error(error.response?.data?.message || 'Could not save wishlist');
      }
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
      {/* Deadline Warning */}
      {deadlinePassed && (
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
          <div className="flex items-center justify-center gap-2 text-red-700 font-semibold mb-2">
            <span className="text-xl">🔒</span>
            <span>Wishlist Locked</span>
          </div>
          <p className="text-sm text-red-600">
            The wishlist deadline has passed. You can no longer make changes.
            {deadline && (
              <span className="block mt-1 font-medium">
                Deadline was: {new Date(deadline).toLocaleDateString()} at {new Date(deadline).toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
      )}
      
      {/* Deadline Countdown (if not passed) */}
      {!deadlinePassed && deadline && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center justify-center gap-2 text-amber-700 text-sm font-medium">
            <span>⏰</span>
            <span>Deadline: {new Date(deadline).toLocaleDateString()} at {new Date(deadline).toLocaleTimeString()}</span>
          </div>
        </div>
      )}
      
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
                disabled={deadlinePassed}
                className={`w-full max-w-lg mx-auto rounded-lg border bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all ${
                  deadlinePassed 
                    ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed' 
                    : 'border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 hover:border-brand-300'
                }`}
                value={item.description}
                onChange={(event) => updateItem(index, 'description', event.target.value)}
                placeholder="What would you like? (e.g., Coffee mug, Book, Gadget)"
              />

              <div className="relative">
                <input
                  type="url"
                  disabled={deadlinePassed}
                  className={`w-full max-w-lg mx-auto rounded-lg border bg-white px-4 py-3 pl-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all ${
                    deadlinePassed 
                      ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed' 
                      : 'border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 hover:border-brand-300'
                  }`}
                  value={item.link}
                  onChange={(event) => updateItem(index, 'link', event.target.value)}
                  placeholder="Optional: Link to product online"
                />
                <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-lg ${deadlinePassed ? 'text-gray-300' : 'text-gray-400'}`}>🔗</span>
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
        <Button type="submit" disabled={deadlinePassed}>
          {deadlinePassed ? '🔒 Locked' : 'Save wishlist'}
        </Button>
      </div>
    </form>
  );
}
