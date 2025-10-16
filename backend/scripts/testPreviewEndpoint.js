const axios = require('axios');
const cheerio = require('cheerio');
const { fetchLinkPreview } = require('../src/services/linkPreviewService');

const testUrl = 'https://shopee.ph/HONOR-X9c-5G-Smartphone-All-Angle-Triple-Defense-i.66540358.28421218886';

console.log('Testing preview endpoint with real Shopee link...\n');
console.log('URL:', testUrl);
console.log('='.repeat(80));

// First, test direct scraping to see what we get
async function testDirectScraping() {
  console.log('\n1. Testing DIRECT HTML scraping:');
  console.log('-'.repeat(80));
  
  try {
    const response = await axios.get(testUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      timeout: 10000,
      maxRedirects: 5,
    });

    const html = response.data;
    const $ = cheerio.load(html);
    
    console.log('✓ Successfully fetched HTML');
    console.log('HTML length:', html.length, 'characters');
    
    // Look for meta tags
    const ogImage = $('meta[property="og:image"]').attr('content');
    const ogTitle = $('meta[property="og:title"]').attr('content');
    const twitterImage = $('meta[name="twitter:image"]').attr('content');
    const title = $('title').text();
    
    console.log('\nMeta tags found:');
    console.log('  og:image:', ogImage || '❌ NOT FOUND');
    console.log('  og:title:', ogTitle || '❌ NOT FOUND');
    console.log('  twitter:image:', twitterImage || '❌ NOT FOUND');
    console.log('  <title>:', title || '❌ NOT FOUND');
    
    // Check for data in script tags (Shopee likely uses JSON-LD or embedded data)
    const jsonLdScripts = $('script[type="application/ld+json"]');
    console.log('\nJSON-LD scripts found:', jsonLdScripts.length);
    
    if (jsonLdScripts.length > 0) {
      jsonLdScripts.each((i, elem) => {
        try {
          const data = JSON.parse($(elem).html());
          console.log(`\nJSON-LD #${i + 1}:`, JSON.stringify(data, null, 2).substring(0, 500));
          if (data.image) {
            console.log('  ✓ Image found in JSON-LD:', data.image);
          }
        } catch (e) {
          console.log(`  ❌ Failed to parse JSON-LD #${i + 1}`);
        }
      });
    }
    
    // Look for any script containing "image" data
    const allScripts = $('script');
    console.log('\nTotal <script> tags:', allScripts.length);
    
    let foundImageInScript = false;
    allScripts.each((i, elem) => {
      const content = $(elem).html();
      if (content && content.includes('"image"') && content.includes('http')) {
        if (!foundImageInScript) {
          console.log('\n✓ Found image data in script tag:');
          foundImageInScript = true;
        }
        // Try to extract image URL
        const imageMatch = content.match(/"image"\s*:\s*"([^"]+)"/);
        if (imageMatch) {
          console.log('  Image URL:', imageMatch[1].substring(0, 100));
        }
      }
    });
    
    if (!foundImageInScript) {
      console.log('❌ No image data found in any script tag');
    }
    
  } catch (error) {
    console.error('❌ Direct scraping failed:', error.message);
  }
}

// Test the Puppeteer-based service directly
async function testService() {
  console.log('\n\n2. Testing Puppeteer-based preview service:');
  console.log('-'.repeat(80));

  try {
    const preview = await fetchLinkPreview(testUrl);
    console.log('✓ Service returned a response');
    console.log('\nPreview data:');
    console.log(JSON.stringify(preview, null, 2));

    if (preview.image) {
      console.log('\n✅ SUCCESS! Image acquired.');
      console.log('Image type:', preview.image.startsWith('data:image') ? 'Inlined screenshot' : 'Remote URL');
    } else {
      console.log('\n❌ FAILED: No image in preview response');
    }
  } catch (error) {
    console.error('❌ Service test failed:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

// Run both tests
(async () => {
  await testDirectScraping();
  await testService();
  
  console.log('\n' + '='.repeat(80));
  console.log('TEST COMPLETE');
  console.log('='.repeat(80));
})();
