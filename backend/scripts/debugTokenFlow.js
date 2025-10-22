const { db } = require('../src/config/database');
const bcrypt = require('bcrypt');
const { generateSecureToken } = require('../src/utils/tokenGenerator');

async function testTokenFlow() {
  console.log('\n=== Testing Complete Magic Link Flow ===\n');
  
  // Step 1: Get the most recent magic link from DB
  const recentLink = db.prepare(`
    SELECT ml.*, e.email, e.name
    FROM magic_links ml
    JOIN employees e ON ml.employee_id = e.id
    ORDER BY ml.created_at DESC 
    LIMIT 1
  `).get();
  
  console.log('Step 1: Most recent magic link from DB');
  console.log('  Employee:', recentLink.email);
  console.log('  Stored token (first 40 chars):', recentLink.token.substring(0, 40));
  console.log('  Token starts with $2b$10$:', recentLink.token.startsWith('$2b$10$'));
  console.log('  Full token length:', recentLink.token.length);
  console.log('  Is bcrypt hash:', recentLink.token.startsWith('$2b$'));
  console.log();
  
  // Step 2: Simulate what SHOULD be in the email
  console.log('Step 2: What the email URL SHOULD contain');
  console.log('  The email should have a plain 64-character hex token');
  console.log('  Example: abc123def456...(64 chars total)');
  console.log();
  
  // Step 3: Test if we can compare
  console.log('Step 3: Testing bcrypt comparison');
  console.log('  ❌ Problem: We CANNOT test the plain token because we only have the hash!');
  console.log('  ❌ The email was sent, but we didn\'t log the plain token anywhere');
  console.log();
  
  // Step 4: Demonstrate the correct flow
  console.log('Step 4: Demonstrating CORRECT flow');
  const testEmployee = db.prepare('SELECT * FROM employees LIMIT 1').get();
  const plainToken = generateSecureToken();
  console.log('  Generated plain token:', plainToken);
  console.log('  Plain token length:', plainToken.length);
  
  const hashedToken = await bcrypt.hash(plainToken, 10);
  console.log('  Hashed token:', hashedToken);
  console.log('  Hashed token length:', hashedToken.length);
  
  // Simulate validation
  const isValid = await bcrypt.compare(plainToken, hashedToken);
  console.log('  bcrypt.compare(plainToken, hashedToken):', isValid ? '✅ MATCH' : '❌ NO MATCH');
  
  // Test with wrong token
  const wrongToken = generateSecureToken();
  const isWrong = await bcrypt.compare(wrongToken, hashedToken);
  console.log('  bcrypt.compare(wrongToken, hashedToken):', isWrong ? '✅ MATCH' : '❌ NO MATCH (expected)');
  console.log();
  
  // Step 5: Check what backend validation does
  console.log('Step 5: Backend validation logic (from auth.routes.js)');
  console.log('  1. Frontend sends: { token: "plain64chartoken", email: "..." }');
  console.log('  2. Backend finds magic_link by employee_id');
  console.log('  3. Backend does: bcrypt.compare(plainToken, hashedTokenFromDB)');
  console.log('  4. If match: ✅ Success');
  console.log('  5. If no match: ❌ "Invalid magic link token"');
  console.log('  6. If expired: ❌ "Magic link expired"');
  console.log();
  
  // Step 6: Diagnosis
  console.log('Step 6: DIAGNOSIS');
  console.log('  The code looks CORRECT in admin.routes.js');
  console.log('  The issue must be:');
  console.log('  A) Email URL actually contains the HASHED token (unlikely, but check the email)');
  console.log('  B) Frontend is modifying the token before sending');
  console.log('  C) Multiple magic links exist and wrong one is being checked');
  console.log('  D) There\'s a character encoding issue with the token');
  console.log();
  
  // Step 7: Check for duplicate magic links
  console.log('Step 7: Checking for duplicate magic links per employee');
  const duplicates = db.prepare(`
    SELECT employee_id, COUNT(*) as count, GROUP_CONCAT(id) as link_ids
    FROM magic_links
    WHERE used = 0 AND datetime(expires_at) > datetime('now')
    GROUP BY employee_id
    HAVING COUNT(*) > 1
  `).all();
  
  if (duplicates.length > 0) {
    console.log('  ⚠️ Found employees with multiple valid magic links:');
    console.table(duplicates);
  } else {
    console.log('  ✅ No duplicate magic links found');
  }
}

testTokenFlow().catch(console.error);
