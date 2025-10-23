require('dotenv').config();
const emailService = require('../src/services/emailService');

async function test() {
  try {
    console.log('Testing wishlist reminder email...');
    await emailService.sendWishlistReminder(
      'charles.daitol@infosoft.com.ph',
      'Charles Daitol',
      'test-token-123'
    );
    console.log('âœ“ Email sent successfully!');
  } catch (error) {
    console.error('âœ— Email failed:', error.message);
    console.error('Full error:', error);
  }
}

test();
