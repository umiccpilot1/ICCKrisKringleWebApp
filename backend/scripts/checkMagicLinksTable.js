const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../database.sqlite');
const db = new Database(dbPath);

try {
  console.log('Checking magic_links table structure...');
  const columns = db.pragma('table_info(magic_links)');
  console.log('Current columns:', columns);
  
  const hasToken = columns.some(col => col.name === 'token');
  const hasExpiresAt = columns.some(col => col.name === 'expires_at');
  const hasUsed = columns.some(col => col.name === 'used');
  
  console.log('\nColumn check:');
  console.log('- token:', hasToken);
  console.log('- expires_at:', hasExpiresAt);
  console.log('- used:', hasUsed);
  
  db.close();
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}
