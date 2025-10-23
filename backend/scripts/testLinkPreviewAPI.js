const axios = require('axios');

const testUrl = 'https://shopee.ph/HONOR-X9c-5G-Smartphone-All-Angle-Triple-Defense-i.66540358.28421218886';

console.log('Testing LinkPreview.net API with real Shopee link...\n');
console.log('URL:', testUrl);
console.log('='.repeat(80));

async function testLinkPreviewAPI() {
  try {
    const apiUrl = `https://api.linkpreview.net/?q=${encodeURIComponent(testUrl)}`;
    
    console.log('\nCalling LinkPreview.net API...');
    console.log('API URL:', apiUrl);
    
    const response = await axios.get(apiUrl, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    console.log('\nâœ… SUCCESS! API responded');
    console.log('\nResponse data:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.image) {
      console.log('\nâœ… IMAGE FOUND:', response.data.image);
      console.log('âœ… TITLE:', response.data.title);
    } else {
      console.log('\nâŒ No image in response');
    }
    
  } catch (error) {
    console.error('\nâŒ API test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

async function testOurEndpoint() {
  console.log('\n' + '='.repeat(80));
  console.log('Testing OUR backend endpoint...\n');
  
  try {
    const response = await axios.get('http://localhost:3060/api/preview/link-preview', {
      params: { url: testUrl },
      timeout: 15000
    });
    
    console.log('âœ… Endpoint responded');
    console.log('\nResponse:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.image) {
      console.log('\nâœ…âœ…âœ… SUCCESS! Our endpoint returns image!');
    } else {
      console.log('\nâŒ Our endpoint returns no image');
    }
    
  } catch (error) {
    console.error('\nâŒ Endpoint failed:', error.message);
  }
}

(async () => {
  await testLinkPreviewAPI();
  await testOurEndpoint();
  
  console.log('\n' + '='.repeat(80));
  console.log('TESTING COMPLETE');
  console.log('='.repeat(80));
})();
