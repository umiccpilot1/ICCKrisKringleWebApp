const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { db } = require('../config/database');
const { validateEmail } = require('../utils/validators');

class ExcelService {
  parseEmployees(filePath) {
    const fileBuffer = fs.readFileSync(filePath);
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(worksheet);

    const employees = rows.map((row, index) => {
      const name = row.Name || row.name;
      const email = row.Email || row.email;
      const isAdmin = row.Admin === 'Yes' || row.is_admin === true || row.is_admin === 1;

      if (!name || !email) {
        throw new Error(`Row ${index + 2}: missing name or email`);
      }

      if (!validateEmail(email)) {
        throw new Error(`Row ${index + 2}: invalid email ${email}`);
      }

      return { name: String(name).trim(), email: String(email).toLowerCase().trim(), is_admin: isAdmin ? 1 : 0 };
    });

    return employees;
  }

  saveEmployees(employees) {
    const insert = db.prepare('INSERT OR IGNORE INTO employees (name, email, is_admin) VALUES (?, ?, ?)');
    const transaction = db.transaction((list) => {
      list.forEach(({ name, email, is_admin }) => {
        insert.run(name, email, is_admin);
      });
    });
    transaction(employees);
  }

  cleanup(filePath) {
    const resolved = path.resolve(filePath);
    if (fs.existsSync(resolved)) {
      fs.unlinkSync(resolved);
    }
  }
}

module.exports = new ExcelService();
