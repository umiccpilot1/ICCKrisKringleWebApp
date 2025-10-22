const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const adminAuth = require('../middleware/adminAuth');
const excelService = require('../services/excelService');
const assignmentService = require('../services/assignmentService');
const emailService = require('../services/emailService');
const { generateSecureToken } = require('../utils/tokenGenerator');
const { db } = require('../config/database');

const upload = multer({ dest: path.join(__dirname, '../../uploads') });
const router = express.Router();

router.use(adminAuth);

router.post('/employees/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'File required' });
  }

  try {
    const employees = excelService.parseEmployees(req.file.path);
    excelService.saveEmployees(employees);
    excelService.cleanup(req.file.path);
    return res.json({ message: 'Employees imported', count: employees.length });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(400).json({ message: error.message });
  }
});

router.get('/employees', (req, res) => {
  const employees = db.prepare('SELECT id, name, email, is_admin, is_super_admin, recipient_id FROM employees ORDER BY name').all();
  return res.json({ employees });
});

router.post('/assignments/generate', (req, res) => {
  try {
    const assignments = assignmentService.generateAssignments();
    return res.json({ message: 'Assignments generated', assignments });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.post('/assignments/notify', async (req, res) => {
  try {
    await assignmentService.notifyAssignments();
    return res.json({ message: 'Assignment emails sent' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get('/wishlists/incomplete', (req, res) => {
  try {
    // Get employees with no wishlist OR empty/unconfirmed wishlists (exclude admins)
    const incompleteEmployees = db.prepare(`
      SELECT e.id, e.name, e.email,
             CASE 
               WHEN w.id IS NULL THEN 'no_wishlist'
               WHEN w.is_confirmed = 0 THEN 'unconfirmed'
               WHEN w.items = '[]' OR w.items IS NULL THEN 'empty'
               ELSE 'complete'
             END as status
      FROM employees e
      LEFT JOIN wishlists w ON w.employee_id = e.id
      WHERE e.is_admin = 0
        AND (w.id IS NULL 
         OR w.is_confirmed = 0 
         OR w.items = '[]' 
         OR w.items IS NULL)
      ORDER BY e.name
    `).all();
    
    return res.json({ 
      count: incompleteEmployees.length,
      employees: incompleteEmployees 
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post('/wishlists/send-reminders', async (req, res) => {
  try {
    // Get employees with incomplete wishlists (exclude admins)
    const incompleteEmployees = db.prepare(`
      SELECT e.id, e.name, e.email
      FROM employees e
      LEFT JOIN wishlists w ON w.employee_id = e.id
      WHERE e.is_admin = 0
        AND (w.id IS NULL 
         OR w.is_confirmed = 0 
         OR w.items = '[]' 
         OR w.items IS NULL)
      ORDER BY e.name
    `).all();
    
    if (incompleteEmployees.length === 0) {
      return res.json({ 
        message: 'No employees need reminders',
        sent: 0,
        results: []
      });
    }
    
    const results = [];
    const insertMagicLink = db.prepare(
      "INSERT INTO magic_links (employee_id, token, expires_at) VALUES (?, ?, datetime('now', '+4 hours'))"
    );
    
    // Mark old unused magic links as used to prevent confusion
    const invalidateOldLinks = db.prepare(
      "UPDATE magic_links SET used = 1 WHERE employee_id = ? AND used = 0"
    );
    
    for (const employee of incompleteEmployees) {
      try {
        // Invalidate any existing unused magic links for this employee
        invalidateOldLinks.run(employee.id);
        
        const token = generateSecureToken();
        const hashedToken = await bcrypt.hash(token, 10);
        insertMagicLink.run(employee.id, hashedToken);
        
        await emailService.sendWishlistReminder(employee.email, employee.name, token);
        
        results.push({
          email: employee.email,
          name: employee.name,
          status: 'sent',
          error: null
        });
      } catch (error) {
        console.error(`Failed to send reminder to ${employee.email}:`, error);
        results.push({
          email: employee.email,
          name: employee.name,
          status: 'failed',
          error: error.message
        });
      }
    }
    
    const sentCount = results.filter(r => r.status === 'sent').length;
    const failedCount = results.filter(r => r.status === 'failed').length;
    
    return res.json({ 
      message: `Sent ${sentCount} reminder emails (${failedCount} failed)`,
      sent: sentCount,
      failed: failedCount,
      results 
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get('/settings', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = rows.reduce((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});
  return res.json({ settings });
});

router.put('/settings', (req, res) => {
  const updates = req.body || {};
  const updateStatement = db.prepare("UPDATE settings SET value = ?, updated_at = datetime('now') WHERE key = ?");

  const transaction = db.transaction((entries) => {
    entries.forEach(([key, value]) => {
      updateStatement.run(String(value), key);
    });
  });

  transaction(Object.entries(updates));
  return res.json({ message: 'Settings updated' });
});

module.exports = router;
