const emailService = require('../src/services/emailService');

async function testAssignmentEmail() {
  const giver = {
    id: 1,
    name: 'Charles Daitol',
    email: 'charles.daitol@infosoft.com.ph'
  };

  const recipient = {
    name: 'Arbill Aque',
    email: 'arbill.aque@infosoft.com.ph'
  };

  const magicLinkToken = 'test-token-12345abcdef';

  try {
    console.log('Sending test assignment email...');
    await emailService.sendAssignmentEmail(giver, recipient, magicLinkToken);
    console.log('✅ Assignment email sent successfully!');
    console.log(`\nEmail details:`);
    console.log(`To: ${giver.email}`);
    console.log(`Subject: 🎄 Your INFOSOFT Kris Kringle Assignment 🎅`);
    console.log(`Recipient: ${recipient.name}`);
    console.log(`Magic Link Token: ${magicLinkToken}`);
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
  }
}

testAssignmentEmail();
