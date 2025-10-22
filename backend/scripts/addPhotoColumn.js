const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../database.sqlite');
const db = new Database(dbPath);

try {
  // Check if column already exists
  const columns = db.pragma('table_info(employees)');
  const hasPhotoColumn = columns.some(col => col.name === 'photo_filename');
  
  if (!hasPhotoColumn) {
    console.log('Adding photo_filename column to employees table...');
    db.exec(`ALTER TABLE employees ADD COLUMN photo_filename TEXT;`);
    console.log('✓ Successfully added photo_filename column');
  } else {
    console.log('✓ photo_filename column already exists');
  }
  
  db.close();
} catch (error) {
  console.error('Error adding column:', error);
  process.exit(1);
}
