import { useState } from 'react';
import LinkPreviewTooltip from '../common/LinkPreviewTooltip.jsx';

export default function AllWishlistsView({ wishlists }) {
  const [isVisible, setIsVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewsEnabled, setPreviewsEnabled] = useState(true);

  if (!wishlists?.length) {
    return (
      <div className="flex flex-col items-center gap-3 p-8 text-muted-700">
        <span className="text-4xl opacity-50">📋</span>
        <p className="text-sm">Wishlists are hidden or not yet confirmed.</p>
      </div>
    );
  }

  // Filter wishlists based on search query
  const filteredWishlists = wishlists.filter((wishlist) =>
    wishlist.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Toggle and Search Controls */}
      <div className="flex flex-col gap-4 items-center p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 w-full items-center justify-between">
          <button
            onClick={() => setIsVisible(!isVisible)}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-infosoft-red-500 text-white rounded-lg hover:bg-infosoft-red-600 transition-colors font-medium shadow-sm w-full sm:w-auto"
          >
            {isVisible ? (
              <>
                <span className="text-lg">🙈</span>
                <span>Hide Wishlists</span>
              </>
            ) : (
              <>
                <span className="text-lg">📋</span>
                <span>Show Wishlists</span>
              </>
            )}
          </button>

          {isVisible && (
            <button
              onClick={() => setPreviewsEnabled(!previewsEnabled)}
              className={`
                flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold
                transition-all duration-200 shadow-sm hover:shadow w-full sm:w-auto
                ${previewsEnabled 
                  ? 'bg-brand-500 text-white hover:bg-brand-600' 
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }
              `}
              title={previewsEnabled ? 'Hide link previews' : 'Show link previews on hover'}
            >
              <span>{previewsEnabled ? '�️' : '�'}</span>
              <span>{previewsEnabled ? 'Previews ON' : 'Previews OFF'}</span>
            </button>
          )}
        </div>

        {isVisible && (
          <div className="relative w-full sm:w-auto sm:min-w-[400px]">
            <input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:border-infosoft-red-500 focus:outline-none focus:ring-2 focus:ring-infosoft-red-500/20 text-sm"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          </div>
        )}
      </div>

      {/* Wishlists Table */}
      {isVisible && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-card animate-fade-in-up">
          {filteredWishlists.length === 0 ? (
            <div className="flex flex-col items-center gap-3 p-8 text-muted-700">
              <span className="text-4xl opacity-50">🔍</span>
              <p className="text-sm">No wishlists found matching "{searchQuery}"</p>
            </div>
          ) : (
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
                  {filteredWishlists.map((wishlist, idx) => (
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
                        <ul className="space-y-3">
                          {wishlist.items.map((item, idx) => {
                            // Handle both legacy (string) and new (object) formats
                            const description = typeof item === 'string' ? item : item.description;
                            const link = typeof item === 'object' ? item.link : null;

                            return (
                              <li key={idx} className="flex items-start justify-center gap-2">
                                <span className="text-brand-500 mt-0.5 font-bold">{idx + 1}.</span>
                                <div className="flex-1 space-y-1.5 max-w-xs">
                                  <span className="block text-sm">{description}</span>
                                  {link && (
                                    <LinkPreviewTooltip url={link} description={description} enabled={previewsEnabled}>
                                      <a
                                        href={link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-white border border-brand-500/30 text-brand-600 rounded-lg hover:bg-brand-50 hover:border-brand-500 transition-all font-medium shadow-sm hover:shadow"
                                      >
                                        <span>🔗</span>
                                        <span>View Online</span>
                                        <span className="text-[10px]">↗</span>
                                      </a>
                                    </LinkPreviewTooltip>
                                  )}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
