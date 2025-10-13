const { db } = require('../config/database');
const emailService = require('./emailService');

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
      await emailService.sendAssignmentEmail(
        { id: row.giverId, name: row.giverName, email: row.giverEmail },
        { name: row.recipientName, email: row.recipientEmail }
      );
    }
  }
}

module.exports = new AssignmentService();
