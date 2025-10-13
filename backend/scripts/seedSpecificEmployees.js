const Database = require('better-sqlite3');

const employees = [
  { name: 'Charles Daitol', email: 'charles.daitol@infosoft.com.ph', is_admin: 1, is_super_admin: 1 },
  { name: 'Arbill Aque', email: 'charles.daitol+arbill@infosoft.com.ph', is_admin: 0, is_super_admin: 0 }
];

function seed() {
  const db = new Database('database.sqlite');
  const insert = db.prepare(`
    INSERT OR IGNORE INTO employees (name, email, is_admin, is_super_admin)
    VALUES (@name, lower(@email), @is_admin, @is_super_admin)
  `);

  const transaction = db.transaction((rows) => {
    rows.forEach((row) => insert.run(row));
  });

  transaction(employees);
  console.log(`Inserted ${employees.length} employees (existing records skipped).`);
}

seed();
