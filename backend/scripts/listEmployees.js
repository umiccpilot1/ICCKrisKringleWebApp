const Database = require('better-sqlite3');

const db = new Database('database.sqlite');
const rows = db.prepare('SELECT id, name, email, is_admin, is_super_admin FROM employees').all();
console.log(rows);
