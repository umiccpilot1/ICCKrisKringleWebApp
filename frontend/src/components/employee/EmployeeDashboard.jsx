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
    <div className="space-y-12 flex flex-col items-center">
      <section className="grid w-full max-w-5xl gap-6 xl:grid-cols-[1.2fr_1fr] animate-fade-in-up">
        <article className="relative rounded-2xl border border-gray-200 bg-white p-8 shadow-card hover:shadow-soft transition-all">
          <div className="relative">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-center md:text-center md:gap-8">
              <div className="max-w-xl mx-auto">
                <p className="text-xs uppercase tracking-wider text-brand-500 font-semibold flex items-center gap-2">
                  Your Wishlist
                </p>
                <h1 className="mt-2 font-display text-3xl font-bold text-gray-900 flex items-center gap-3">
                  Curate your wishlist
                </h1>
                <p className="mt-3 max-w-xl text-sm text-muted-700">List up to three thoughtful ideas. Changes save instantly and stay private to your Kris Kringle.</p>
              </div>
              <div className="rounded-lg border border-brand-500/20 bg-brand-50 px-4 py-2 text-xs uppercase tracking-wide text-brand-600 font-semibold">
                Season {new Date().getFullYear()}
              </div>
            </div>
            <div className="mt-6">
              <WishlistForm />
            </div>
          </div>
        </article>

        <aside className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-brand-50 to-white p-8 shadow-card animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <p className="text-xs uppercase tracking-wider text-brand-500 font-semibold flex items-center justify-center gap-2">
            Assignment status
          </p>
          {loading ? <div className="mt-6"><LoadingSpinner label="Loading assignment…" /></div> : <RecipientCard recipient={recipient} />}
        </aside>
      </section>

      <section className="w-full max-w-5xl rounded-2xl border border-gray-200 bg-white p-8 shadow-card animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex flex-col items-center gap-4 text-center">
          <div>
            <p className="text-xs uppercase tracking-wider text-brand-500 font-semibold flex items-center justify-center gap-2">
              Community inspiration
            </p>
            <h2 className="font-display text-2xl font-bold text-gray-900 mt-2 flex items-center gap-2">
              Browse confirmed wishlists
            </h2>
          </div>
          <span className="text-xs text-muted-700 flex items-center justify-center gap-1.5">
            Visibility depends on admin settings
          </span>
        </div>
        <div className="mt-6">
          {wishlistsLoading ? (
            <LoadingSpinner label="Checking availability…" />
          ) : wishlistsAllowed ? (
            <AllWishlistsView wishlists={wishlists} />
          ) : (
            <p className="text-sm text-muted-700 flex items-center gap-2 p-6 rounded-lg border border-dashed border-gray-300 bg-gray-50">
              Admins currently have the shared wishlist view turned off.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}