// Test script to inspect what's actually available on a Shopee page

const puppeteer = require('puppeteer');

const testUrl = 'https://shopee.ph/iPhoneCase-For11-13-15-16Camera-Protection-Shockproof-Dalawang-Lilang-May-Maliliit-na-Butil-7-8PLUS-i.1423983018.25296280253';

async function inspectPage() {
  console.log('\n=== INSPECTING SHOPEE PAGE ===\n');
  console.log('URL:', testUrl, '\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  try {
    await page.setViewport({ width: 1280, height: 720 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
    );

    console.log('Loading page...');
    await page.goto(testUrl, {
      waitUntil: ['domcontentloaded', 'networkidle2'],
      timeout: 30000,
    });

    console.log('Waiting for content...');
    await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds

    // Scroll
    await page.evaluate(() => window.scrollTo(0, 300));
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log('\n--- Page Title ---');
    const title = await page.title();
    console.log(title);

    console.log('\n--- All IMG tags (first 10) ---');
    const images = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs.slice(0, 10).map(img => ({
        src: img.src?.substring(0, 100) + '...',
        alt: img.alt,
        width: img.width,
        height: img.height,
        className: img.className,
        id: img.id
      }));
    });
    console.log(JSON.stringify(images, null, 2));

    console.log('\n--- Meta Tags ---');
    const metaTags = await page.evaluate(() => {
      const metas = Array.from(document.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"]'));
      return metas.map(meta => ({
        property: meta.getAttribute('property') || meta.getAttribute('name'),
        content: meta.content?.substring(0, 100) + (meta.content?.length > 100 ? '...' : '')
      }));
    });
    console.log(JSON.stringify(metaTags, null, 2));

    console.log('\n--- Testing Platform Selectors ---');
    const selectorTests = await page.evaluate(() => {
      const selectors = [
        'div[class*="page-product"] img[class*="product-image"]',
        'button[class*="product-carousel"] img',
        'div[class*="ProductCarousel"] img',
        'div[class*="product-briefing"] img',
        'div[class*="ProductCover"] img',
        'img[class*="ProductCoverImage"]',
        'div._2JJbPR img',
        'button._3z-pLR img',
        'div[style*="background-image"]',
        'div[class*="product"] img[src*="shopee"]',
        'img[src*="product"]'
      ];

      return selectors.map(selector => {
        try {
          const element = document.querySelector(selector);
          if (element) {
            return {
              selector,
              found: true,
              src: element.src?.substring(0, 80) || 'no src',
              tag: element.tagName
            };
          }
          return { selector, found: false };
        } catch (e) {
          return { selector, found: false, error: e.message };
        }
      });
    });

    console.log(JSON.stringify(selectorTests, null, 2));

  } finally {
    await browser.close();
  }
}

inspectPage().catch(console.error);
