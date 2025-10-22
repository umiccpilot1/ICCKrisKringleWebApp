const express = require('express');
const authMiddleware = require('../middleware/auth');
const { db } = require('../config/database');

const router = express.Router();

router.use(authMiddleware);

router.get('/me', (req, res) => {
  const employee = db.prepare('SELECT id, name, email, is_admin, is_super_admin, recipient_id FROM employees WHERE id = ?').get(req.user.id);
  if (!employee) {
    return res.status(404).json({ message: 'Employee not found' });
  }
  return res.json({ employee: { ...employee, is_admin: !!employee.is_admin, is_super_admin: !!employee.is_super_admin } });
});

router.get('/recipient', (req, res) => {
  const recipient = db.prepare(`
    SELECT r.id, r.name, r.email, r.photo_filename, w.items
    FROM employees e
    LEFT JOIN employees r ON e.recipient_id = r.id
    LEFT JOIN wishlists w ON w.employee_id = r.id AND w.is_confirmed = 1
    WHERE e.id = ?
  `).get(req.user.id);

  if (!recipient || !recipient.id) {
    return res.status(404).json({ message: 'Assignment not ready' });
  }

  return res.json({
    recipient: {
      id: recipient.id,
      name: recipient.name,
      email: recipient.email,
      photoFilename: recipient.photo_filename,
      wishlist: recipient.items ? JSON.parse(recipient.items) : []
    }
  });
});

router.get('/wishlists', (req, res) => {
  const setting = db.prepare("SELECT value FROM settings WHERE key = 'show_all_wishlists'").get();
  if (!setting || setting.value !== '1') {
    return res.json({ wishlists: [], allowed: false });
  }
  const wishlists = db.prepare(`
    SELECT e.name, e.email, w.items
    FROM wishlists w
    JOIN employees e ON e.id = w.employee_id
    WHERE w.is_confirmed = 1
    ORDER BY e.name
  `).all();
  return res.json({
    allowed: true,
    wishlists: wishlists.map((row) => ({ name: row.name, email: row.email, items: JSON.parse(row.items) }))
  });
});

module.exports = router;
