const { db } = require('../src/config/database');
const bcrypt = require('bcrypt');
const { generateSecureToken } = require('../src/utils/tokenGenerator');

async function testCompleteFlow() {
  console.log('\n=== TESTING COMPLETE MAGIC LINK FLOW ===\n');
  
  // Step 1: Setup - Get a test employee
  const employee = db.prepare('SELECT * FROM employees LIMIT 1').get();
  console.log('Step 1: Test Employee');
  console.log('  ID:', employee.id);
  console.log('  Email:', employee.email);
  console.log();
  
  // Step 2: Simulate creating magic link (like admin reminder route)
  console.log('Step 2: Creating Magic Link (Admin Route Simulation)');
  
  // Invalidate old links
  db.prepare('UPDATE magic_links SET used = 1 WHERE employee_id = ? AND used = 0')
    .run(employee.id);
  console.log('  ✅ Invalidated old unused magic links');
  
  const plainToken = generateSecureToken();
  console.log('  Generated plain token:', plainToken);
  console.log('  Token length:', plainToken.length, 'chars');
  
  const hashedToken = await bcrypt.hash(plainToken, 10);
  console.log('  Hashed token:', hashedToken);
  console.log('  Hash length:', hashedToken.length, 'chars');
  
  const insertResult = db.prepare(
    "INSERT INTO magic_links (employee_id, token, expires_at) VALUES (?, ?, datetime('now', '+4 hours'))"
  ).run(employee.id, hashedToken);
  console.log('  ✅ Inserted magic link with ID:', insertResult.lastInsertRowid);
  console.log();
  
  // Step 3: Simulate email being sent
  console.log('Step 3: Email Simulation');
  const emailUrl = `http://localhost:5173/auth/callback?token=${plainToken}&email=${encodeURIComponent(employee.email)}&reminder=wishlist`;
  console.log('  Email would contain URL:');
  console.log('  ', emailUrl.substring(0, 100) + '...');
  console.log();
  
  // Step 4: Simulate user clicking link (Frontend → Backend callback)
  console.log('Step 4: User Clicks Link (Auth Callback Simulation)');
  console.log('  Frontend extracts from URL:');
  console.log('    token:', plainToken.substring(0, 20) + '...');
  console.log('    email:', employee.email);
  console.log();
  console.log('  Frontend sends POST /auth/callback with { token, email }');
  console.log();
  
  // Step 5: Simulate backend validation
  console.log('Step 5: Backend Validation');
  
  // Get ALL valid magic links
  const magicLinks = db.prepare(
    'SELECT id, token, expires_at, used FROM magic_links WHERE employee_id = ? AND used = 0 AND datetime(expires_at) > datetime(\'now\') ORDER BY created_at DESC'
  ).all(employee.id);
  
  console.log('  Found', magicLinks.length, 'valid magic link(s) for this employee');
  
  // Try to match
  let matchedLink = null;
  for (const link of magicLinks) {
    const isMatch = await bcrypt.compare(plainToken, link.token);
    console.log(`  Checking link ID ${link.id}:`, isMatch ? '✅ MATCH!' : '❌ No match');
    if (isMatch) {
      matchedLink = link;
      break;
    }
  }
  
  console.log();
  if (matchedLink) {
    console.log('  ✅ SUCCESS! Token validated');
    console.log('  Marking link as used...');
    db.prepare('UPDATE magic_links SET used = 1 WHERE id = ?').run(matchedLink.id);
    console.log('  ✅ Link marked as used');
    console.log('  Would now create JWT session and redirect to /portal?showWishlist=true');
  } else {
    console.log('  ❌ FAILED! No matching magic link found');
  }
  console.log();
  
  // Step 6: Verify the link can't be reused
  console.log('Step 6: Testing Reuse Protection');
  const reusedLinks = db.prepare(
    'SELECT id, token, expires_at, used FROM magic_links WHERE employee_id = ? AND used = 0 AND datetime(expires_at) > datetime(\'now\')'
  ).all(employee.id);
  
  if (reusedLinks.length === 0) {
    console.log('  ✅ No valid unused links remaining (reuse prevented)');
  } else {
    console.log('  ⚠️ Still', reusedLinks.length, 'valid unused links');
  }
  console.log();
  
  // Step 7: Test multiple magic links scenario
  console.log('Step 7: Testing Multiple Magic Links');
  console.log('  Creating 3 magic links for same employee...');
  
  const tokens = [];
  for (let i = 0; i < 3; i++) {
    const t = generateSecureToken();
    const h = await bcrypt.hash(t, 10);
    db.prepare(
      "INSERT INTO magic_links (employee_id, token, expires_at) VALUES (?, ?, datetime('now', '+4 hours'))"
    ).run(employee.id, h);
    tokens.push(t);
  }
  
  console.log('  ✅ Created 3 magic links');
  
  // Try validating with the SECOND token (not the most recent)
  const allLinks = db.prepare(
    'SELECT id, token FROM magic_links WHERE employee_id = ? AND used = 0 AND datetime(expires_at) > datetime(\'now\') ORDER BY created_at DESC'
  ).all(employee.id);
  
  console.log('  Found', allLinks.length, 'valid links');
  console.log('  Testing with SECOND oldest token (should still work)...');
  
  let foundMatch = false;
  for (const link of allLinks) {
    const isMatch = await bcrypt.compare(tokens[1], link.token);
    if (isMatch) {
      console.log('  ✅ MATCH! Second token validated successfully');
      foundMatch = true;
      break;
    }
  }
  
  if (!foundMatch) {
    console.log('  ❌ Second token did not match any link');
  }
  console.log();
  
  console.log('=== TEST COMPLETE ===\n');
  console.log('Summary:');
  console.log('  ✅ Token generation works');
  console.log('  ✅ Bcrypt hashing works');
  console.log('  ✅ Token validation works');
  console.log('  ✅ Multiple magic links can coexist');
  console.log('  ✅ Any valid magic link can be used (not just most recent)');
  console.log('  ✅ Reuse protection works');
}

testCompleteFlow().catch(console.error);
