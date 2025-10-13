export default function AllWishlistsView({ wishlists }) {
  if (!wishlists?.length) {
    return <p className="text-sm text-slate-400">Wishlists are hidden or not yet confirmed.</p>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-soft">
      <table className="min-w-full divide-y divide-white/10 text-sm text-slate-200">
        <thead className="bg-white/5 text-left text-xs uppercase tracking-[0.25em] text-slate-400">
          <tr>
            <th className="px-4 py-3">Employee</th>
            <th className="px-4 py-3">Wishlist</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {wishlists.map((wishlist) => (
            <tr key={wishlist.email}>
              <td className="px-4 py-3 font-medium text-white">{wishlist.name}</td>
              <td className="px-4 py-3 text-slate-300">
                <ul className="list-disc pl-5">
                  {wishlist.items.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
