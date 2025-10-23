const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

const rows = db.prepare('SELECT id, employee_id, token, expires_at FROM sessions').all();
console.log(rows);
