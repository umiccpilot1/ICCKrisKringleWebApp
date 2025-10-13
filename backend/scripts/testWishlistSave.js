const axios = require('axios');

const token = process.argv[2];
const items = process.argv.slice(3);

if (!token) {
  throw new Error('Usage: node testWishlistSave.js <token> <item1> [item2] [item3]');
}

axios.post(
  'http://localhost:3000/api/wishlist',
  { items: items.length ? items : ['Test Item'] },
  { headers: { Authorization: `Bearer ${token}` } }
).then((res) => {
  console.log('Success:', res.data);
}).catch((error) => {
  if (error.response) {
    console.error('Error response:', error.response.status, error.response.data);
  } else {
    console.error('Request failed:', error.message);
  }
});
