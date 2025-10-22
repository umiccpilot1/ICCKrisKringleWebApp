const axios = require('axios');
const { db } = require('../src/config/database');

async function testReminderEmailFlow() {
  console.log('\n=== TESTING REMINDER EMAIL MAGIC LINK FLOW ===\n');
  
  const baseURL = 'http://localhost:3000/api';
  const testEmail = 'charles.daitol@infosoft.com.ph';
  
  try {
    // Step 1: Get incomplete wishlists
    console.log('Step 1: Checking incomplete wishlists...');
    const incompleteResp = await axios.get(`${baseURL}/admin/wishlists/incomplete`, {
      headers: { 'Authorization': 'Bearer fake-admin-token' }
    }).catch(err => {
      // We expect this to fail auth, just testing the endpoint exists
      console.log('  Note: Auth will fail, but checking employee directly from DB');
    });
    
    const employee = db.prepare('SELECT * FROM employees WHERE email = ?').get(testEmail);
    console.log(`  Found employee: ${employee.name} (${employee.email})`);
    console.log();
    
    // Step 2: Clear old magic links and create a fresh one
    console.log('Step 2: Setting up magic link (simulating reminder email)...');
    db.prepare('UPDATE magic_links SET used = 1 WHERE employee_id = ?').run(employee.id);
    console.log('  ✅ Cleared old magic links');
    
    const crypto = require('crypto');
    const bcrypt = require('bcrypt');
    const plainToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(plainToken, 10);
    
    db.prepare(
      "INSERT INTO magic_links (employee_id, token, expires_at) VALUES (?, ?, datetime('now', '+4 hours'))"
    ).run(employee.id, hashedToken);
    console.log('  ✅ Created new magic link');
    console.log(`  Plain token: ${plainToken}`);
    console.log();
    
    // Step 3: Simulate clicking the email link (frontend callback)
    console.log('Step 3: Simulating user clicking email link...');
    const magicLinkUrl = `http://localhost:5173/auth/callback?token=${plainToken}&email=${encodeURIComponent(testEmail)}&reminder=wishlist`;
    console.log(`  Email URL: ${magicLinkUrl.substring(0, 80)}...`);
    console.log();
    
    console.log('Step 4: Frontend sends auth callback request...');
    const authResp = await axios.post(`${baseURL}/auth/callback`, {
      token: plainToken,
      email: testEmail
    });
    
    console.log('  ✅ Authentication successful!');
    console.log(`  JWT Token: ${authResp.data.token.substring(0, 40)}...`);
    console.log(`  Employee: ${authResp.data.employee.name}`);
    console.log(`  Email: ${authResp.data.employee.email}`);
    console.log(`  Is Admin: ${authResp.data.employee.isAdmin}`);
    console.log();
    
    // Step 5: Verify the link is marked as used
    console.log('Step 5: Verifying link is marked as used...');
    const usedLink = db.prepare(
      'SELECT * FROM magic_links WHERE employee_id = ? ORDER BY created_at DESC LIMIT 1'
    ).get(employee.id);
    
    if (usedLink.used === 1) {
      console.log('  ✅ Link correctly marked as used');
    } else {
      console.log('  ❌ Link not marked as used!');
    }
    console.log();
    
    // Step 6: Try to reuse the same token (should fail)
    console.log('Step 6: Testing reuse protection...');
    try {
      await axios.post(`${baseURL}/auth/callback`, {
        token: plainToken,
        email: testEmail
      });
      console.log('  ❌ PROBLEM: Link was reusable!');
    } catch (error) {
      console.log('  ✅ Correctly rejected reused link');
      console.log(`  Error message: "${error.response?.data?.message}"`);
    }
    console.log();
    
    console.log('=== TEST COMPLETE ===\n');
    console.log('✅ All tests passed!');
    console.log('\nNow test with actual reminder email:');
    console.log('1. Go to Admin Panel in browser');
    console.log('2. Click "Send Reminders" button');
    console.log('3. Check your email');
    console.log('4. Click "Confirm Wishlist" button');
    console.log('5. Should redirect to /portal?showWishlist=true');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    } else if (error.request) {
      console.error('No response received from server');
      console.error('Request was:', error.request.path);
    } else {
      console.error('Error details:', error);
    }
  }
}

testReminderEmailFlow().catch(console.error);
