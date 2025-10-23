const axios = require('axios');

const token = process.argv[2];

if (!token) {
  throw new Error('Usage: node testRecipientView.js <token>');
}

console.log('\nðŸŽ Testing Recipient Wishlist View (Backward Compatibility)...\n');

axios.get('http://localhost:3060/api/employee/recipient', {
  headers: { Authorization: `Bearer ${token}` }
})
  .then(res => {
    const { recipient } = res.data;

    if (!recipient) {
      console.log('âŒ No recipient assigned yet.\n');
      return;
    }

    console.log(`Your recipient: ${recipient.name}`);
    console.log(`Email: ${recipient.email}\n`);

    if (recipient.wishlist && recipient.wishlist.length > 0) {
      console.log('Their wishlist:');
      recipient.wishlist.forEach((item, idx) => {
        // Check if it's new format (object) or legacy format (string)
        if (typeof item === 'string') {
          console.log(`  ${idx + 1}. ${item} (legacy format - string)`);
        } else if (typeof item === 'object' && item.description) {
          console.log(`  ${idx + 1}. ${item.description} (new format - object)`);
          if (item.link) {
            console.log(`     ðŸ”— ${item.link}`);
          }
        }
      });
    } else {
      console.log('No wishlist yet.');
    }

    console.log('\nâœ… Successfully fetched and displayed recipient wishlist!\n');
  })
  .catch(err => {
    console.error('âŒ Error:', err.response?.data || err.message);
  });
