import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { fetchRecipient, fetchAllWishlists } from '../../services/api.js';
import WishlistForm from './WishlistForm.jsx';
import RecipientCard from './RecipientCard.jsx';
import AllWishlistsView from './AllWishlistsView.jsx';
import LoadingSpinner from '../common/LoadingSpinner.jsx';

export default function EmployeeDashboard() {
  const [recipient, setRecipient] = useState(null);
  const [wishlists, setWishlists] = useState([]);
  const [wishlistsAllowed, setWishlistsAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [wishlistsLoading, setWishlistsLoading] = useState(true);

  useEffect(() => {
    async function loadRecipient() {
      try {
        const { data } = await fetchRecipient();
        setRecipient(data.recipient);
      } catch {
        setRecipient(null);
      } finally {
        setLoading(false);
      }
    }
    async function loadWishlists() {
      try {
        const { data } = await fetchAllWishlists();
        setWishlists(data.wishlists || []);
        setWishlistsAllowed(data.allowed !== false);
      } catch (error) {
        toast.error('Unable to load wishlists');
      } finally {
        setWishlistsLoading(false);
      }
    }
    loadRecipient();
    loadWishlists();
  }, []);

  return (
    <div className="space-y-12 text-slate-200">
      <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <article className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-soft backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Wishlist</p>
              <h1 className="mt-2 font-display text-3xl font-semibold text-white">Curate your wishlist</h1>
              <p className="mt-3 max-w-xl text-sm text-slate-300">List up to three thoughtful ideas. Changes save instantly and stay private to your Kris Kringle.</p>
            </div>
            <div className="rounded-2xl border border-aurora/20 bg-aurora/10 px-4 py-3 text-xs uppercase tracking-wide text-white shadow-glow">
              Season {new Date().getFullYear()}
            </div>
          </div>
          <div className="mt-6">
            <WishlistForm />
          </div>
        </article>

        <aside className="rounded-3xl border border-white/10 bg-gradient-to-br from-iris/20 via-nightfall to-nightfall p-8 shadow-soft backdrop-blur">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Assignment status</p>
          {loading ? <div className="mt-6"><LoadingSpinner label="Loading assignment…" /></div> : <RecipientCard recipient={recipient} />}
        </aside>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-soft backdrop-blur">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Community inspiration</p>
            <h2 className="font-display text-2xl font-semibold text-white">Browse confirmed wishlists</h2>
          </div>
          <span className="text-xs text-slate-400">Visibility depends on admin settings</span>
        </div>
        <div className="mt-6">
          {wishlistsLoading ? (
            <LoadingSpinner label="Checking availability…" />
          ) : wishlistsAllowed ? (
            <AllWishlistsView wishlists={wishlists} />
          ) : (
            <p className="text-sm text-slate-400">Admins currently have the shared wishlist view turned off.</p>
          )}
        </div>
      </section>
    </div>
  );
}
