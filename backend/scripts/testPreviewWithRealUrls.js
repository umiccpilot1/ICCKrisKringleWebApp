const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

const testUrls = {
  shopee: 'https://shopee.ph/iPhoneCase-For11-13-15-16Camera-Protection-Shockproof-Dalawang-Lilang-May-Maliliit-na-Butil-7-8PLUS-i.1423983018.25296280253',
  lazada: 'https://www.lazada.com.ph/products/pdp-i290392423-s470854510.html?scm=1007.17760.398138.0&pvid=8688060b-ff27-4252-a1de-5556d50ae61e&search=flashsale&spm=a2o4l.homepage.FlashSale.d_290392423',
  amazon: 'https://www.amazon.com/CyberPowerPC-i5-13400F-GeForce-Windows-GXiVR8060A40/dp/B0DW4BY993/ref=sr_1_2?_encoding=UTF8&content-id=amzn1.sym.edf433e2-b6d4-408e-986d-75239a5ced10&dib=eyJ2IjoiMSJ9.Z1gXDy0H8dNKp8LlcdArduU58EKQ8sevgGyT7P6vNHxEixE4tYotXnT8v41STxah3t26qehZ10Gqh-EtersHtA_rPmdrEX0MSv4kfbdOB8cjmRpMBe664g9mBUaeTyIJtxZyGqVLc77EhcbmsdV9KA5wnQMyACLWIOgIRV3_wLV4CKtng80qqEr2g6kMHPHvjMPL39KmhszeMSGxmK7feLPCIHJPWy71B-lPCijiL9NWe7ufmEUic97KciOtBqUgzBYsXZWPQ_RlPePR9u4yJw0tK1_ZZfoQ-4BGbNTyGz4.e2vPkolQfm9DYtb7UN-HowxjPYjtX1qrE3xTK9tEl1Y&dib_tag=se&keywords=gaming&pd_rd_r=c3d1265b-c865-4568-97b2-69106106ab12&pd_rd_w=ekCXd&pd_rd_wg=VgtPV&qid=1761114265&sr=8-2'
};

async function testPreviewEndpoint() {
  console.log('\n=== TESTING LINK PREVIEW ENDPOINT WITH REAL E-COMMERCE URLs ===\n');

  for (const [platform, url] of Object.entries(testUrls)) {
    console.log(`\n--- Testing ${platform.toUpperCase()} ---`);
    console.log(`URL: ${url.substring(0, 80)}...`);
    
    try {
      const startTime = Date.now();
      const response = await axios.get(`${API_BASE}/preview/link-preview`, {
        params: { url },
        timeout: 30000 // 30 second timeout
      });
      const endTime = Date.now();
      
      console.log(`✅ Request completed in ${((endTime - startTime) / 1000).toFixed(2)}s`);
      console.log(`Response status: ${response.status}`);
      console.log('\nData received:');
      console.log(`  Image: ${response.data.image ? (response.data.isScreenshot ? 'Screenshot (base64)' : response.data.image.substring(0, 60) + '...') : 'NULL'}`);
      console.log(`  Title: ${response.data.title || 'NULL'}`);
      console.log(`  Description: ${response.data.description ? response.data.description.substring(0, 80) + '...' : 'NULL'}`);
      console.log(`  Domain: ${response.data.domain}`);
      console.log(`  Is Screenshot: ${response.data.isScreenshot}`);
      console.log(`  Cached: ${response.data.cached}`);
      
      if (!response.data.image) {
        console.log('⚠️ WARNING: No image found!');
      } else if (response.data.isScreenshot) {
        console.log('⚠️ WARNING: Fell back to screenshot (no product image extracted)');
      } else {
        console.log('✅ SUCCESS: Product image extracted!');
      }
      
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Data:`, error.response.data);
      } else if (error.code === 'ECONNABORTED') {
        console.log('   Request timeout (30s exceeded)');
      }
    }
  }

  console.log('\n=== TEST COMPLETE ===\n');
}

testPreviewEndpoint().catch(console.error);
