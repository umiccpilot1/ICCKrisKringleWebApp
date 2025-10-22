const { db } = require('../src/config/database');

console.log('\n=== Recent Magic Links ===\n');
const links = db.prepare(`
  SELECT 
    ml.id,
    ml.employee_id,
    e.email,
    substr(ml.token, 1, 30) as token_preview,
    ml.expires_at,
    ml.used,
    ml.created_at,
    CASE 
      WHEN datetime(ml.expires_at) < datetime('now') THEN 'EXPIRED'
      WHEN ml.used = 1 THEN 'USED'
      ELSE 'VALID'
    END as status
  FROM magic_links ml
  JOIN employees e ON ml.employee_id = e.id
  ORDER BY ml.created_at DESC 
  LIMIT 10
`).all();

console.table(links);

console.log('\n=== Token Details ===\n');
links.forEach(link => {
  console.log(`ID: ${link.id}`);
  console.log(`Email: ${link.email}`);
  console.log(`Token preview: ${link.token_preview}...`);
  console.log(`Token length: ${link.token_preview.length} (showing first 30 chars)`);
  console.log(`Created: ${link.created_at}`);
  console.log(`Expires: ${link.expires_at}`);
  console.log(`Status: ${link.status}`);
  console.log(`---`);
});
