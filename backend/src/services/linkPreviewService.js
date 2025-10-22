const puppeteer = require('puppeteer');

const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes
const MIN_IMAGE_DIMENSION = 200;

// Platform detection
function detectPlatform(url) {
  const hostname = new URL(url).hostname.toLowerCase();
  if (hostname.includes('shopee')) return 'shopee';
  if (hostname.includes('lazada')) return 'lazada';
  if (hostname.includes('amazon')) return 'amazon';
  return 'unknown';
}

// Platform-specific selectors
const PLATFORM_SELECTORS = {
  shopee: {
    image: [
      // Main product image containers
      'div[class*="page-product"] img[class*="product-image"]',
      'button[class*="product-carousel"] img',
      'div[class*="ProductCarousel"] img',
      'div[class*="product-briefing"] img',
      'div[class*="ProductCover"] img',
      'img[class*="ProductCoverImage"]',
      // Legacy/fallback selectors
      'div._2JJbPR img',
      'button._3z-pLR img',
      'div[style*="background-image"]',
      // Generic product page image
      'div[class*="product"] img[src*="shopee"]',
      'img[src*="product"]'
    ],
    title: [
      'div[class*="page-product"] span[class*="title"]',
      'div[class*="product-briefing"] span',
      'h1[class*="ProductCover"]',
      'span._1CTwYJ',
      'div._1K-cMO span',
      'div[class*="product-name"]',
      'h1[class*="product-title"]'
    ],
    description: [
      'div[class*="page-product"] div[class*="description"]',
      'div[class*="product-detail"] span',
      'div._1ATkXP',
      'div._2AxZF8 span',
      'div[class*="product-info"]'
    ]
  },
  lazada: {
    image: [
      'div[class*="gallery-preview-panel"] img',
      'img[class*="pdp-mod-common-image"]',
      'div.item-gallery__pic-wrap img',
      'div.pdp-mod-common-image img',
      'div[class*="next-slick-slide"] img'
    ],
    title: [
      'h1[class*="pdp-mod-product-badge-title"]',
      'span[class*="pdp-mod-product-badge-title"]',
      'h1.pdp-mod-product-badge-title',
      'div[class*="title-container"] h1'
    ],
    description: [
      'div[class*="pdp-product-desc"]',
      'div[class*="detail-content"] div',
      'div.pdp-product-desc div'
    ]
  },
  amazon: {
    image: [
      'img#landingImage',
      'img[data-old-hires]',
      'img.a-dynamic-image',
      'div#imgTagWrapperId img',
      'div#altImages img'
    ],
    title: [
      'span#productTitle',
      'h1#title span',
      'h1.a-size-large span'
    ],
    description: [
      'div#feature-bullets span',
      'div#productDescription p',
      'ul.a-unordered-list span'
    ]
  }
};

let browserPromise = null;
const previewCache = new Map();

async function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    // Ensure browser closes on process exit
    const browser = await browserPromise;
    const gracefulClose = async () => {
      try {
        await browser.close();
      } catch (error) {
        // ignore - browser might already be closed
      }
    };

    process.once('exit', gracefulClose);
    process.once('SIGINT', gracefulClose);
    process.once('SIGTERM', gracefulClose);
  }

  return browserPromise;
}

function fromCache(url) {
  const cached = previewCache.get(url);
  if (!cached) return null;
  if (Date.now() > cached.expiresAt) {
    previewCache.delete(url);
    return null;
  }
  return cached.data;
}

function toAbsoluteUrl(href, baseUrl) {
  try {
    return new URL(href, baseUrl).href;
  } catch (error) {
    return href;
  }
}

async function fetchLinkPreview(url) {
  const cached = fromCache(url);
  if (cached) {
    return { ...cached, cached: true };
  }

  const platform = detectPlatform(url);
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
    );

    await page.goto(url, {
      waitUntil: ['domcontentloaded', 'networkidle2'],
      timeout: 30000,
    });

    // Wait longer for dynamic content (especially for SPAs like Shopee/Lazada)
    await new Promise((resolve) => setTimeout(resolve, 3000));
    
    // Scroll down a bit to trigger lazy-loaded images
    await page.evaluate(() => {
      window.scrollTo(0, 300);
    });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Try to wait for platform-specific product image selectors
    if (platform === 'shopee') {
      try {
        await page.waitForSelector('div[class*="page-product"] img, button[class*="product-carousel"] img, div._2JJbPR img', { timeout: 5000 });
      } catch (error) {
        // continue
      }
    } else if (platform === 'lazada') {
      try {
        await page.waitForSelector('div.item-gallery__pic-wrap img, div[class*="gallery"] img', { timeout: 5000 });
      } catch (error) {
        // continue
      }
    } else {
      try {
        await page.waitForSelector('img', { timeout: 5000 });
      } catch (error) {
        // continue
      }
    }

    const preview = await page.evaluate(
      (minimumDimension, platformSelectors, detectedPlatform) => {
        const doc = document;

        const getMetaContent = (selector) => {
          const el = doc.querySelector(selector);
          if (!el) return null;
          return el.content || el.getAttribute('content');
        };

        // Try platform-specific selectors first
        const tryPlatformSelectors = (type) => {
          if (detectedPlatform !== 'unknown' && platformSelectors[detectedPlatform]) {
            const selectors = platformSelectors[detectedPlatform][type];
            if (selectors) {
              console.log(`Trying ${selectors.length} ${type} selectors for ${detectedPlatform}...`);
              for (const selector of selectors) {
                try {
                  const element = doc.querySelector(selector);
                  if (element) {
                    if (type === 'image') {
                      const src = element.currentSrc || element.src || 
                                 element.dataset?.src || element.getAttribute('data-src');
                      if (src && !src.startsWith('data:')) {
                        console.log(`✓ Found image with selector: ${selector}`);
                        return src;
                      }
                      // Check for background image
                      const bgImage = element.style.backgroundImage;
                      if (bgImage) {
                        const match = bgImage.match(/url\(["']?([^"')]*)["']?\)/);
                        if (match && match[1]) {
                          console.log(`✓ Found background image with selector: ${selector}`);
                          return match[1];
                        }
                      }
                    } else {
                      const text = element.textContent || element.innerText;
                      if (text && text.trim()) {
                        return text.trim();
                      }
                    }
                  }
                } catch (e) {
                  console.log('Selector error:', selector, e);
                }
              }
              console.log(`✗ No ${type} found with platform-specific selectors`);
            }
          }
          return null;
        };

        const pickImageFromImages = () => {
          const images = Array.from(doc.querySelectorAll('img'))
            .map((img) => {
              let src =
                img.currentSrc || img.src || img.dataset?.src || img.getAttribute('srcset');
              if (src && src.includes(' ')) {
                src = src.split(',')[0].trim().split(' ')[0];
              }
              const alt = img.alt || '';
              const width = img.naturalWidth || img.width || 0;
              const height = img.naturalHeight || img.height || 0;
              return { src, alt, width, height };
            })
            .filter(
              (img) =>
                img.src &&
                !img.src.startsWith('data:') &&
                (img.width >= minimumDimension || img.height >= minimumDimension)
            );

          if (!images.length) return null;

          // Sort by area descending to get largest product-like image
          images.sort((a, b) => b.width * b.height - a.width * a.height);
          return images[0].src;
        };

        // Try platform-specific image selectors first
        const platformImage = tryPlatformSelectors('image');
        
        const imageCandidates = [
          platformImage,
          getMetaContent('meta[property="og:image:secure_url"]'),
          getMetaContent('meta[property="og:image"]'),
          getMetaContent('meta[name="twitter:image:src"]'),
          getMetaContent('meta[name="twitter:image"]'),
          getMetaContent('meta[itemprop="image"]'),
          getMetaContent('link[rel="image_src"]'),
          pickImageFromImages(),
        ].filter(Boolean);

        // Try platform-specific title/description
        const platformTitle = tryPlatformSelectors('title');
        const platformDescription = tryPlatformSelectors('description');

        const textFromSelectors = (selectors) => {
          for (const selector of selectors) {
            const element = doc.querySelector(selector);
            if (element) {
              const text = element.textContent || element.innerText;
              if (text && text.trim()) {
                return text.trim();
              }
            }
          }
          return null;
        };

        const titleCandidates = [
          platformTitle,
          getMetaContent('meta[property="og:title"]'),
          getMetaContent('meta[name="twitter:title"]'),
          getMetaContent('meta[itemprop="name"]'),
          textFromSelectors([
            'h1',
            'h1 span',
            '[data-testid="pdp-product-title"]',
            '[data-sqe="name"]',
            'div.product-title',
            'div[class*="product"] h1',
          ]),
          doc.title,
        ].filter((value) => Boolean(value && value.trim()))
          .map((value) => value.trim());

        const descriptionCandidates = [
          platformDescription,
          getMetaContent('meta[property="og:description"]'),
          getMetaContent('meta[name="twitter:description"]'),
          getMetaContent('meta[name="description"]'),
          textFromSelectors([
            '[data-testid="pdp-description"]',
            '[data-sqe="description"]',
            'div[class*="description"]',
            '.product-briefing',
          ]),
        ].filter((value) => Boolean(value && value.trim()))
          .map((value) => value.trim());

        return {
          image: imageCandidates[0] || null,
          title: titleCandidates[0] || null,
          description: descriptionCandidates[0] || null,
          pageTitle: doc.title,
        };
      },
      MIN_IMAGE_DIMENSION,
      PLATFORM_SELECTORS,
      platform
    );

    let image = preview.image;
    if (image) {
      image = toAbsoluteUrl(image, page.url());
    }

    let title = preview.title || preview.pageTitle || null;
    if (title) {
      title = title.trim().replace(/\s+/g, ' ');
    }

    let description = preview.description || null;
    if (description) {
      description = description.trim().replace(/\s+/g, ' ');
    }

    const result = {
      image: image || null,
      title: title || null,
      description: description || null,
      domain: new URL(page.url()).hostname,
      platform: platform,
    };

    // If we still do not have an image, fall back to screenshot of viewport
    if (!result.image) {
      console.log(`No product image found for ${platform} URL, taking screenshot...`);
      const screenshot = await page.screenshot({ type: 'jpeg', quality: 70, fullPage: false });
      result.image = `data:image/jpeg;base64,${screenshot.toString('base64')}`;
      result.isScreenshot = true;
    } else {
      console.log(`Successfully extracted product image from ${platform}`);
    }

    previewCache.set(url, {
      data: result,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return result;
  } finally {
    await page.close().catch(() => {});
  }
}

module.exports = {
  fetchLinkPreview,
};
