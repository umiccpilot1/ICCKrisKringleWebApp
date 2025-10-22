const { db } = require('../config/database');
const emailService = require('./emailService');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

class AssignmentService {
  generateAssignments() {
    const employees = db.prepare('SELECT id, name, email FROM employees WHERE is_admin = 0').all();
    if (employees.length < 2) {
      throw new Error('Not enough employees to generate assignments');
    }

    const shuffled = shuffle(employees);
    const assignments = [];

    shuffled.forEach((employee, index) => {
      const recipient = shuffled[(index + 1) % shuffled.length];
      assignments.push({ giverId: employee.id, recipientId: recipient.id });
    });

    const updateStatement = db.prepare('UPDATE employees SET recipient_id = ? WHERE id = ?');
    const transaction = db.transaction((pairs) => {
      pairs.forEach((pair) => {
        updateStatement.run(pair.recipientId, pair.giverId);
      });
    });

    transaction(assignments);

    db.prepare("UPDATE settings SET value = '1', updated_at = datetime('now') WHERE key = 'assignment_completed'").run();

    return assignments;
  }

  async notifyAssignments() {
    const rows = db.prepare(`
      SELECT e.id as giverId, e.name as giverName, e.email as giverEmail,
             r.name as recipientName, r.email as recipientEmail
      FROM employees e
      JOIN employees r ON e.recipient_id = r.id
      WHERE e.is_admin = 0
    `).all();

    for (const row of rows) {
      // Generate a 48-hour multi-use magic link token
      const token = crypto.randomBytes(32).toString('hex');
      const hashedToken = await bcrypt.hash(token, 10);
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

      // Insert magic link into database
      db.prepare(`
        INSERT INTO magic_links (employee_id, token, expires_at, used)
        VALUES (?, ?, ?, 0)
      `).run(row.giverId, hashedToken, expiresAt.toISOString());

      // Send email with magic link token
      await emailService.sendAssignmentEmail(
        { id: row.giverId, name: row.giverName, email: row.giverEmail },
        { name: row.recipientName, email: row.recipientEmail },
        token // Pass the plain token for the email link
      );
    }
  }
}

module.exports = new AssignmentService();
