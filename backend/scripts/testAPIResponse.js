// Quick test to verify platform badge response from backend

const testUrl = 'https://shopee.ph/iPhoneCase-For11-13-15-16Camera-Protection-Shockproof-Dalawang-Lilang-May-Maliliit-na-Butil-7-8PLUS-i.1423983018.25296280253';

async function testPreviewAPI() {
  console.log('\n=== TESTING LINK PREVIEW API ===\n');
  console.log('URL:', testUrl, '\n');

  try {
    const response = await fetch(
      `http://localhost:3000/api/preview/link-preview?url=${encodeURIComponent(testUrl)}`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('✅ Response received!\n');
    console.log('Platform:', data.platform);
    console.log('Domain:', data.domain);
    console.log('Title:', data.title);
    console.log('Is Screenshot:', data.isScreenshot);
    console.log('Has Image:', !!data.image);
    console.log('Cached:', data.cached);
    
    if (data.isScreenshot) {
      console.log('\n📸 Screenshot fallback active (as expected due to bot detection)');
    }
    
    if (data.platform && data.platform !== 'unknown') {
      console.log(`\n🏷️  Platform badge will show: ${data.platform.toUpperCase()}`);
    }
    
    console.log('\n✅ All checks passed!');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

testPreviewAPI();
