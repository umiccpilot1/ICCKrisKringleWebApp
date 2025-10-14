export default function AllWishlistsView({ wishlists }) {
  if (!wishlists?.length) {
    return (
      <div className="flex flex-col items-center gap-3 p-8 text-muted-700">
        <span className="text-4xl opacity-50">📋</span>
        <p className="text-sm">Wishlists are hidden or not yet confirmed.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm text-gray-900 text-center">
          <thead className="bg-gradient-to-r from-brand-50 to-brand-100 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-5 py-4 font-semibold text-brand-600">
                <div className="flex items-center justify-center gap-2">
                  Employee
                </div>
              </th>
              <th className="px-5 py-4 font-semibold text-brand-600">
                <div className="flex items-center justify-center gap-2">
                  Wishlist
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {wishlists.map((wishlist, idx) => (
              <tr 
                key={wishlist.email} 
                className="hover:bg-gray-50 transition-colors group"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <td className="px-5 py-4 font-semibold text-gray-900">
                  <div className="flex items-center justify-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-500 font-bold text-xs group-hover:bg-brand-100 transition-colors">
                      {wishlist.name.charAt(0)}
                    </span>
                    {wishlist.name}
                  </div>
                </td>
                <td className="px-5 py-4 text-muted-700">
                  <ul className="space-y-2">
                    {wishlist.items.map((item, idx) => (
                      <li key={idx} className="flex items-start justify-center gap-2">
                        <span className="text-brand-500 mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
