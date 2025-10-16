const axios = require('axios');

const token = process.argv[2];

if (!token) {
  throw new Error('Usage: node testNewWishlistFormat.js <token>');
}

const wishlistItems = [
  {
    description: 'Wireless Mechanical Keyboard',
    link: 'https://www.amazon.com/Logitech-Wireless-Mechanical-Gaming-Keyboard/dp/B07NY9ZT92'
  },
  {
    description: 'Coffee Mug with Funny Programming Quote',
    link: 'https://www.amazon.com/There-Place-Like-127-0-0-1/dp/B07PFXJN13'
  },
  {
    description: 'Office plant (succulent or small cactus)',
    link: ''  // No link for this item
  }
];

console.log('\n🧪 Testing New Wishlist Format with Descriptions and Links...\n');
console.log('Items to save:');
wishlistItems.forEach((item, idx) => {
  console.log(`  ${idx + 1}. ${item.description}`);
  if (item.link) {
    console.log(`     🔗 ${item.link}`);
  } else {
    console.log(`     (no link)`);
  }
});
console.log('');

axios.post(
  'http://localhost:3000/api/wishlist',
  { items: wishlistItems },
  { headers: { Authorization: `Bearer ${token}` } }
).then((res) => {
  console.log('✅ Success:', res.data);
  console.log('\n📋 Now fetching the saved wishlist...\n');

  return axios.get(
    'http://localhost:3000/api/wishlist',
    { headers: { Authorization: `Bearer ${token}` } }
  );
}).then((res) => {
  console.log('✅ Fetched wishlist:');
  if (res.data.wishlist && res.data.wishlist.items) {
    res.data.wishlist.items.forEach((item, idx) => {
      console.log(`  ${idx + 1}. ${item.description}`);
      if (item.link) {
        console.log(`     🔗 ${item.link}`);
      }
    });
    console.log(`\n✓ Is Confirmed: ${res.data.wishlist.isConfirmed}`);
  }
  console.log('\n✨ Test completed successfully!\n');
}).catch((error) => {
  if (error.response) {
    console.error('❌ Error response:', error.response.status, error.response.data);
  } else {
    console.error('❌ Request failed:', error.message);
  }
});
