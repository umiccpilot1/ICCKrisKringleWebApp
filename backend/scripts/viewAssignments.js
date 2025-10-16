const { db } = require('../src/config/database');

console.log('\n🎁 Kris Kringle Assignments:\n');

const assignments = db.prepare(`
  SELECT
    e1.id as giver_id,
    e1.name as giver,
    e2.id as recipient_id,
    e2.name as recipient
  FROM employees e1
  LEFT JOIN employees e2 ON e1.recipient_id = e2.id
  ORDER BY e1.id
  LIMIT 10
`).all();

if (assignments.every(a => !a.recipient)) {
  console.log('No assignments have been made yet.\n');
} else {
  assignments.forEach(a => {
    if (a.recipient) {
      console.log(`${a.giver} (ID: ${a.giver_id}) → ${a.recipient} (ID: ${a.recipient_id})`);
    } else {
      console.log(`${a.giver} (ID: ${a.giver_id}) → Not assigned yet`);
    }
  });
  console.log('');
}
