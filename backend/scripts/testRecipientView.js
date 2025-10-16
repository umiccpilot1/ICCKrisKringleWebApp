const axios = require('axios');

const token = process.argv[2];

if (!token) {
  throw new Error('Usage: node testRecipientView.js <token>');
}

console.log('\n🎁 Testing Recipient Wishlist View (Backward Compatibility)...\n');

axios.get('http://localhost:3000/api/employee/recipient', {
  headers: { Authorization: `Bearer ${token}` }
})
  .then(res => {
    const { recipient } = res.data;

    if (!recipient) {
      console.log('❌ No recipient assigned yet.\n');
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
            console.log(`     🔗 ${item.link}`);
          }
        }
      });
    } else {
      console.log('No wishlist yet.');
    }

    console.log('\n✅ Successfully fetched and displayed recipient wishlist!\n');
  })
  .catch(err => {
    console.error('❌ Error:', err.response?.data || err.message);
  });
