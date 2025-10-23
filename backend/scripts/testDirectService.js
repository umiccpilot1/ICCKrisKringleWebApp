const { fetchLinkPreview } = require('../src/services/linkPreviewService');

const testUrl = 'https://shopee.ph/iPhoneCase-For11-13-15-16Camera-Protection-Shockproof-Dalawang-Lilang-May-Maliliit-na-Butil-7-8PLUS-i.1423983018.25296280253';

console.log('\n=== DIRECT SERVICE TEST ===\n');
console.log('Testing URL:', testUrl);
console.log('\nCalling fetchLinkPreview directly...\n');

fetchLinkPreview(testUrl)
  .then(result => {
    console.log('âœ… Success!');
    console.log('Result:', JSON.stringify(result, null, 2));
  })
  .catch(error => {
    console.log('âŒ Error caught:');
    console.log('Message:', error.message);
    console.log('Stack:', error.stack);
  })
  .finally(() => {
    process.exit(0);
  });

// Add timeout to force exit if it hangs
setTimeout(() => {
  console.log('\nâš ï¸ Timeout reached (60s), forcing exit...');
  process.exit(1);
}, 60000);
