const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const adminAuth = require('../middleware/adminAuth');
const excelService = require('../services/excelService');
const assignmentService = require('../services/assignmentService');
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
