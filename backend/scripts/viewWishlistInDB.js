const { db } = require('../src/config/database');

console.log('\nðŸ“‹ Wishlists in Database:\n');

const wishlists = db.prepare(`
  SELECT
    w.id,
    w.employee_id,
    e.name,
    e.email,
    w.items,
    w.is_confirmed,
    w.confirmed_at
  FROM wishlists w
  JOIN employees e ON w.employee_id = e.id
  ORDER BY w.id
`).all();

if (wishlists.length === 0) {
  console.log('No wishlists found in database.\n');
} else {
  wishlists.forEach(wishlist => {
    console.log(`Employee: ${wishlist.name} (${wishlist.email})`);
    console.log(`Wishlist ID: ${wishlist.id}`);
    console.log(`Confirmed: ${wishlist.is_confirmed ? 'Yes' : 'No'}`);

    try {
      const items = JSON.parse(wishlist.items);
      console.log('Items:');
      items.forEach((item, idx) => {
        if (typeof item === 'string') {
          console.log(`  ${idx + 1}. ${item} (legacy format)`);
        } else {
          console.log(`  ${idx + 1}. ${item.description}`);
          if (item.link) {
            console.log(`     ðŸ”— ${item.link}`);
          }
        }
      });
    } catch (e) {
      console.log('  Error parsing items:', wishlist.items);
    }

    console.log('');
  });
}
