const { db } = require('../src/config/database');

console.log('\n=== Time Analysis ===\n');
console.log('JavaScript Date.now():', new Date().toISOString());
console.log('JavaScript local time:', new Date().toString());

const dbTime = db.prepare("SELECT datetime('now') as db_time").get();
console.log('SQLite datetime(\'now\'):', dbTime.db_time);

const dbTimeLocal = db.prepare("SELECT datetime('now', 'localtime') as db_time_local").get();
console.log('SQLite local time:', dbTimeLocal.db_time_local);

console.log('\n=== Recent Magic Link Expiry ===\n');
const recentLink = db.prepare(`
  SELECT 
    expires_at,
    datetime('now') as current_time,
    datetime(expires_at) as expiry_time,
    CASE 
      WHEN datetime(expires_at) < datetime('now') THEN 'EXPIRED'
      ELSE 'VALID'
    END as status,
    (julianday(expires_at) - julianday('now')) * 24 as hours_until_expiry
  FROM magic_links 
  ORDER BY created_at DESC 
  LIMIT 1
`).get();

console.table(recentLink);

console.log('\n=== Problem Diagnosis ===');
if (recentLink.hours_until_expiry < 0) {
  console.log('❌ Token has EXPIRED');
  console.log(`   Expired ${Math.abs(recentLink.hours_until_expiry).toFixed(2)} hours ago`);
} else {
  console.log('✅ Token is still VALID');
  console.log(`   Expires in ${recentLink.hours_until_expiry.toFixed(2)} hours`);
}
