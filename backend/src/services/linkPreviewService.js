const puppeteer = require('puppeteer');

const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes
const MIN_IMAGE_DIMENSION = 200;

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
      timeout: 20000,
    });

    // Wait a little longer for dynamic content to settle and ensure images render
    await new Promise((resolve) => setTimeout(resolve, 1200));
    try {
      await page.waitForSelector('img', { timeout: 5000 });
    } catch (error) {
      // continue even if no image selector is found within timeout
    }

    const preview = await page.evaluate(
      (minimumDimension) => {
        const doc = document;

        const getMetaContent = (selector) => {
          const el = doc.querySelector(selector);
          if (!el) return null;
          return el.content || el.getAttribute('content');
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

        const imageCandidates = [
          getMetaContent('meta[property="og:image:secure_url"]'),
          getMetaContent('meta[property="og:image"]'),
          getMetaContent('meta[name="twitter:image:src"]'),
          getMetaContent('meta[name="twitter:image"]'),
          getMetaContent('meta[itemprop="image"]'),
          getMetaContent('link[rel="image_src"]'),
          pickImageFromImages(),
        ].filter(Boolean);

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
      MIN_IMAGE_DIMENSION
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
    };

    // If we still do not have an image, fall back to screenshot of viewport
    if (!result.image) {
      const screenshot = await page.screenshot({ type: 'jpeg', quality: 70, fullPage: false });
      result.image = `data:image/jpeg;base64,${screenshot.toString('base64')}`;
      result.isScreenshot = true;
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
