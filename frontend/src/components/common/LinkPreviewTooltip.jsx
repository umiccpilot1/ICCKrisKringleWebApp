import { useState, useEffect, useRef } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const tooltipCache = new Map();

export default function LinkPreviewTooltip({ url, description, children }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef(null);

  useEffect(() => {
    setPreviewData(tooltipCache.get(url) || null);
  }, [url]);

  useEffect(() => {
    if (!showTooltip) return;

    if (tooltipCache.has(url)) {
      setPreviewData(tooltipCache.get(url));
      return;
    }

    const fetchPreview = async () => {
      setLoading(true);
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/preview/link-preview?url=${encodeURIComponent(url)}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch preview: ${response.status}`);
        }

        const data = await response.json();
        tooltipCache.set(url, data);
        setPreviewData(data);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Preview fetch error:', err);
          const fallback = {
            image: null,
            title: null,
            description: null,
            domain: getDomain(url).hostname,
            isScreenshot: false,
            cached: false,
            error: true,
          };
          tooltipCache.set(url, fallback);
          setPreviewData(fallback);
        }
      } finally {
        setLoading(false);
        abortRef.current = null;
      }
    };

    const timer = setTimeout(fetchPreview, 200);
    return () => {
      clearTimeout(timer);
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [showTooltip, url]);

  // Extract domain info
  const getDomain = (link) => {
    try {
      const urlObj = new URL(link);
      return {
        hostname: urlObj.hostname.replace('www.', ''),
        favicon: `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`
      };
    } catch {
      return { hostname: 'External Link', favicon: null };
    }
  };

  const domainInfo = getDomain(url);

  return (
    <div 
      className="relative inline-block group"
      onMouseEnter={() => setShowTooltip(true)}
  onMouseLeave={() => setShowTooltip(false)}
    >
      {children}
      
      {showTooltip && (
        <div className="absolute z-[100] bottom-full left-1/2 -translate-x-1/2 mb-3 w-96 pointer-events-none">
          <div className="bg-white rounded-xl shadow-2xl border-2 border-gray-300 overflow-hidden transform transition-all duration-200">
            {/* Product Preview Section */}
            <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 h-56 flex items-center justify-center border-b-2 border-gray-200">
              {loading ? (
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-500 border-t-transparent"></div>
                  <p className="text-sm text-gray-600 font-medium">Loading product preview...</p>
                </div>
              ) : previewData?.image ? (
                <img
                  src={previewData.image}
                  alt={previewData.title || description}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Hide image on error and show fallback
                    e.target.style.display = 'none';
                    const parent = e.target.parentElement;
                    parent.innerHTML = `
                      <div class="text-center p-6">
                        <div class="text-7xl mb-3 animate-bounce-slow">🎁</div>
                        <p class="text-sm text-gray-700 font-semibold px-4 line-clamp-2 leading-relaxed">${description}</p>
                        <p class="text-xs text-gray-500 mt-2 font-medium">Product Link</p>
                      </div>
                    `;
                  }}
                />
              ) : (
                <div className="text-center p-6">
                  <div className="text-7xl mb-3 animate-bounce-slow">🎁</div>
                  <p className="text-sm text-gray-700 font-semibold px-4 line-clamp-2 leading-relaxed">{description}</p>
                  <p className="text-xs text-gray-500 mt-2 font-medium">Product Link</p>
                </div>
              )}
            </div>
            
            {/* Details Section */}
            <div className="p-4 bg-white">
              <div className="flex items-start gap-3 mb-3">
                {domainInfo.favicon && (
                  <img 
                    src={domainInfo.favicon} 
                    alt="Site icon"
                    className="w-6 h-6 rounded flex-shrink-0 mt-0.5"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 line-clamp-2 mb-1">
                    {previewData?.title || description}
                  </p>
                  {previewData?.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                      {previewData.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-brand-500">🔗</span>
                    <span className="text-gray-600 font-medium truncate">
                      {previewData?.domain || domainInfo.hostname}
                    </span>
                  </div>
                  {(previewData?.isScreenshot || previewData?.cached) && (
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-[10px] uppercase tracking-wide">
                      {previewData?.isScreenshot && (
                        <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-semibold">
                          Live Screenshot
                        </span>
                      )}
                      {previewData?.cached && (
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-semibold">
                          Cached
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500 italic text-center">
                  💡 Click "View Online" to see full product details
                </p>
              </div>
            </div>
          </div>
          
          {/* Tooltip Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[2px]">
            <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[12px] border-t-white drop-shadow-md"></div>
          </div>
        </div>
      )}
    </div>
  );
}



