﻿const axios = require('axios');

const token = process.argv[2];

if (!token) {
  throw new Error('Usage: node testWishlistValidation.js <token>');
}

const baseUrl = 'http://localhost:3060/api/wishlist';
const headers = { Authorization: `Bearer ${token}` };

console.log('\nðŸ§ª Testing Wishlist Validation...\n');

// Test 1: Invalid URL
console.log('Test 1: Invalid URL format');
axios.post(baseUrl, {
  items: [
    { description: 'Test Item', link: 'not-a-valid-url' }
  ]
}, { headers })
  .then(() => console.log('  âŒ FAILED: Should have rejected invalid URL'))
  .catch(err => {
    if (err.response?.status === 400) {
      console.log('  âœ… PASSED: Rejected invalid URL');
      console.log(`     Message: ${err.response.data.message}`);
    } else {
      console.log('  âŒ FAILED: Unexpected error');
    }
  })
  .then(() => {
    // Test 2: Missing description
    console.log('\nTest 2: Missing description');
    return axios.post(baseUrl, {
      items: [
        { description: '', link: 'https://example.com' }
      ]
    }, { headers });
  })
  .then(() => console.log('  âŒ FAILED: Should have rejected empty description'))
  .catch(err => {
    if (err.response?.status === 400) {
      console.log('  âœ… PASSED: Rejected empty description');
      console.log(`     Message: ${err.response.data.message}`);
    } else {
      console.log('  âŒ FAILED: Unexpected error');
    }
  })
  .then(() => {
    // Test 3: Description too long
    console.log('\nTest 3: Description exceeds 120 characters');
    return axios.post(baseUrl, {
      items: [
        {
          description: 'A'.repeat(121),
          link: 'https://example.com'
        }
      ]
    }, { headers });
  })
  .then(() => console.log('  âŒ FAILED: Should have rejected long description'))
  .catch(err => {
    if (err.response?.status === 400) {
      console.log('  âœ… PASSED: Rejected description over 120 chars');
      console.log(`     Message: ${err.response.data.message}`);
    } else {
      console.log('  âŒ FAILED: Unexpected error');
    }
  })
  .then(() => {
    // Test 4: Valid item without link
    console.log('\nTest 4: Valid item without link');
    return axios.post(baseUrl, {
      items: [
        { description: 'Simple gift without link', link: '' }
      ]
    }, { headers });
  })
  .then(res => {
    console.log('  âœ… PASSED: Accepted item without link');
  })
  .catch(err => {
    console.log('  âŒ FAILED: Should accept item without link');
    console.log(`     Error: ${err.response?.data?.message || err.message}`);
  })
  .then(() => {
    // Test 5: Multiple valid items
    console.log('\nTest 5: Multiple valid items (mix with and without links)');
    return axios.post(baseUrl, {
      items: [
        { description: 'Item with link', link: 'https://amazon.com/product1' },
        { description: 'Item without link', link: '' },
        { description: 'Another item', link: 'https://example.com/product2' }
      ]
    }, { headers });
  })
  .then(res => {
    console.log('  âœ… PASSED: Accepted multiple valid items');
  })
  .catch(err => {
    console.log('  âŒ FAILED: Should accept multiple valid items');
    console.log(`     Error: ${err.response?.data?.message || err.message}`);
  })
  .then(() => {
    console.log('\nâœ¨ Validation tests completed!\n');
  });
