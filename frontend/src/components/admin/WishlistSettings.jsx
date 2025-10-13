import { useState } from 'react';
import toast from 'react-hot-toast';
import Button from '../common/Button.jsx';
import { updateSettings } from '../../services/api.js';

export default function WishlistSettings({ settings, onRefresh }) {
  const [showAll, setShowAll] = useState(settings.show_all_wishlists === '1');
  const [deadline, setDeadline] = useState(settings.wishlist_deadline || '');

  async function handleSave(event) {
    event.preventDefault();
    try {
      await updateSettings({
        show_all_wishlists: showAll ? '1' : '0',
        wishlist_deadline: deadline
      });
      toast.success('Settings saved');
      onRefresh?.();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to save settings');
    }
  }

  return (
    <form onSubmit={handleSave} className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-soft backdrop-blur">
      <h2 className="text-lg font-semibold text-white">Wishlist settings</h2>
      <div className="mt-4 space-y-5 text-sm text-slate-200">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={showAll}
            onChange={(event) => setShowAll(event.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-white/10 text-aurora focus:ring-aurora/60"
          />
          Allow employees to view all confirmed wishlists
        </label>
        <label className="block">
          Wishlist deadline
          <input
            type="datetime-local"
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white focus:border-aurora/60 focus:outline-none"
            value={deadline}
            onChange={(event) => setDeadline(event.target.value)}
          />
        </label>
      </div>
      <div className="mt-6">
        <Button type="submit">Save settings</Button>
      </div>
    </form>
  );
}
