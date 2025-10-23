const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const adminAuth = require('../middleware/adminAuth');
const excelService = require('../services/excelService');
const assignmentService = require('../services/assignmentService');
const notificationJobService = require('../services/notificationJobService');
const { db } = require('../config/database');

const upload = multer({ dest: path.join(__dirname, '../../uploads') });
const router = express.Router();

const employeePhotoDirectory = path.join(__dirname, '../../frontend/public/images/employees');

function ensureEmployeePhotoDirectory() {
  if (!fs.existsSync(employeePhotoDirectory)) {
    fs.mkdirSync(employeePhotoDirectory, { recursive: true });
  }
}

function listEmployeePhotoFiles() {
  ensureEmployeePhotoDirectory();
  const entries = fs.readdirSync(employeePhotoDirectory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === '.png')
    .map((entry) => ({
      filename: entry.name,
      baseName: path.parse(entry.name).name
    }));
}

function normalizeIdentifier(value) {
  if (!value) {
    return '';
  }

  return String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

function generateMatchIdentifiers(fullName) {
  if (!fullName) {
    return [];
  }

  const identifiers = new Set();
  const trimmed = String(fullName).trim();

  if (!trimmed) {
    return [];
  }

  const [primarySegment] = trimmed.split(',');
  const primary = primarySegment && primarySegment.trim().length ? primarySegment.trim() : trimmed;
  const primaryIdentifier = normalizeIdentifier(primary);

  if (primaryIdentifier) {
    identifiers.add(primaryIdentifier);
  }

  const tokens = trimmed.split(/\s+/).filter(Boolean);
  if (tokens.length) {
    const lastTokenIdentifier = normalizeIdentifier(tokens[tokens.length - 1]);
    if (lastTokenIdentifier) {
      identifiers.add(lastTokenIdentifier);
    }
  }

  return Array.from(identifiers);
}

const photoUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      try {
        ensureEmployeePhotoDirectory();
        cb(null, employeePhotoDirectory);
      } catch (error) {
        cb(error);
      }
    },
    filename: (req, file, cb) => {
      const sanitized = path.basename(file.originalname);
      cb(null, sanitized);
    }
  }),
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() !== '.png') {
      cb(new Error('Only PNG files are allowed'));
    } else {
      cb(null, true);
    }
  }
});

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

router.get('/employees/photo-files', (req, res) => {
  try {
    const files = listEmployeePhotoFiles();
    return res.json({ files });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to list employee photos' });
  }
});

router.post('/employees/photos/upload', (req, res) => {
  ensureEmployeePhotoDirectory();
  photoUpload.array('photos')(req, res, (error) => {
    if (error) {
      return res.status(400).json({ message: error.message || 'Failed to upload photos' });
    }

    const files = req.files || [];
    const filenames = files.map((file) => path.basename(file.filename || file.originalname));
    return res.json({
      message: `Uploaded ${files.length} photo${files.length === 1 ? '' : 's'}`,
      count: files.length,
      filenames
    });
  });
});

router.post('/employees/photos/map', (req, res) => {
  try {
    ensureEmployeePhotoDirectory();
    const files = listEmployeePhotoFiles();
    const normalizedFileMap = new Map();

    files.forEach((file) => {
      const identifier = normalizeIdentifier(file.baseName);
      if (!identifier) {
        return;
      }

      if (!normalizedFileMap.has(identifier)) {
        normalizedFileMap.set(identifier, new Set());
      }

      normalizedFileMap.get(identifier).add(file.filename);
    });

    const employees = db
      .prepare('SELECT id, name, email, is_admin, photo_filename FROM employees ORDER BY name')
      .all();

    const matchesByEmployee = new Map();
    const fileUsageCounts = new Map();

    employees.forEach((employee) => {
      const identifiers = generateMatchIdentifiers(employee.name);
      const matches = new Set();

      identifiers.forEach((identifier) => {
        const fileSet = normalizedFileMap.get(identifier);
        if (fileSet) {
          fileSet.forEach((filename) => {
            matches.add(filename);
          });
        }
      });

      const matchList = Array.from(matches);
      matchesByEmployee.set(employee.id, matchList);

      matchList.forEach((match) => {
        const usageKey = match.toUpperCase();
        fileUsageCounts.set(usageKey, (fileUsageCounts.get(usageKey) || 0) + 1);
      });
    });

    const updatePhotoStatement = db.prepare('UPDATE employees SET photo_filename = ? WHERE id = ?');
    const autoAssignedIds = new Set();

    const mapTransaction = db.transaction(() => {
      employees.forEach((employee) => {
        const matches = matchesByEmployee.get(employee.id) || [];
        if (matches.length === 1) {
          const match = matches[0];
          if ((fileUsageCounts.get(match.toUpperCase()) || 0) === 1) {
            updatePhotoStatement.run(match, employee.id);
            autoAssignedIds.add(employee.id);
          }
        }
      });
    });

    mapTransaction();

    const refreshedEmployees = db
      .prepare('SELECT id, name, email, is_admin, photo_filename FROM employees ORDER BY name')
      .all();

    const allFileSet = new Set(files.map((file) => file.filename.toUpperCase()));
    const assignedPhotoSet = new Set();

    const mappedEmployees = [];
    const conflicts = [];
    const missing = [];

    refreshedEmployees.forEach((employee) => {
      const matches = matchesByEmployee.get(employee.id) || [];
      const photoFilename = employee.photo_filename;
      const hasExistingPhoto = photoFilename && allFileSet.has(photoFilename.toUpperCase());

      if (hasExistingPhoto) {
        mappedEmployees.push({
          employeeId: employee.id,
          employeeName: employee.name,
          employeeEmail: employee.email,
          photoFilename,
          source: autoAssignedIds.has(employee.id) ? 'auto' : 'existing'
        });
        assignedPhotoSet.add(photoFilename.toUpperCase());
        return;
      }

      const availableMatches = matches.filter((match) => !assignedPhotoSet.has(match.toUpperCase()));

      if (availableMatches.length === 0) {
        const hadMatches = matches.length > 0;
        const reason =
          photoFilename && !allFileSet.has((photoFilename || '').toUpperCase())
            ? 'file-missing'
            : hadMatches
            ? 'no-available-match'
            : 'no-match';
        missing.push({
          employeeId: employee.id,
          employeeName: employee.name,
          employeeEmail: employee.email,
          currentPhotoFilename: photoFilename || null,
          reason
        });
        return;
      }

      let reason = 'manual';
      if (availableMatches.length > 1) {
        reason = 'multiple-candidates';
      } else if ((fileUsageCounts.get(availableMatches[0].toUpperCase()) || 0) > 1) {
        reason = 'duplicate-surname';
      }

      conflicts.push({
        employeeId: employee.id,
        employeeName: employee.name,
        employeeEmail: employee.email,
        matches: availableMatches,
        reason
      });
    });

    const totalEmployees = refreshedEmployees.length;
    const mappedCount = mappedEmployees.length;
    const autoMappedCount = autoAssignedIds.size;
    const unmappedCount = conflicts.length + missing.length;

    const availableFiles = files
      .map((file) => file.filename)
      .filter((filename) => !assignedPhotoSet.has(filename.toUpperCase()));

    const response = {
      files: files.map((file) => file.filename),
      availableFiles,
      mapped: mappedEmployees.sort((a, b) => a.employeeName.localeCompare(b.employeeName)),
      unmapped: {
        conflicts: conflicts.sort((a, b) => a.employeeName.localeCompare(b.employeeName)),
        missing: missing.sort((a, b) => a.employeeName.localeCompare(b.employeeName))
      },
      summary: {
        totalEmployees,
        mappedCount,
        autoMappedCount,
        unmappedCount
      }
    };

    return res.json(response);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to map employee photos', error: error.message });
  }
});

router.post('/employees/:id/photo', (req, res) => {
  const employeeId = Number(req.params.id);
  const { photoFilename } = req.body || {};

  if (!Number.isInteger(employeeId)) {
    return res.status(400).json({ message: 'Invalid employee id' });
  }

  if (!photoFilename || typeof photoFilename !== 'string') {
    return res.status(400).json({ message: 'photoFilename is required' });
  }

  const existingEmployee = db.prepare('SELECT id FROM employees WHERE id = ?').get(employeeId);
  if (!existingEmployee) {
    return res.status(404).json({ message: 'Employee not found' });
  }

  ensureEmployeePhotoDirectory();

  const sanitized = path.basename(photoFilename);
  if (sanitized.toLowerCase() !== photoFilename.toLowerCase()) {
    return res.status(400).json({ message: 'Invalid photo filename' });
  }

  const fileMatch = fs
    .readdirSync(employeePhotoDirectory)
    .find((file) => file.toLowerCase() === sanitized.toLowerCase());

  if (!fileMatch) {
    return res.status(400).json({ message: 'Photo file not found in directory' });
  }

  if (path.extname(fileMatch).toLowerCase() !== '.png') {
    return res.status(400).json({ message: 'Unsupported photo file type' });
  }

  const update = db.prepare('UPDATE employees SET photo_filename = ? WHERE id = ?');
  update.run(fileMatch, employeeId);

  return res.json({ message: 'Employee photo updated', photoFilename: fileMatch });
});

router.get('/employees', (req, res) => {
  const employees = db
    .prepare('SELECT id, name, email, is_admin, is_super_admin, recipient_id, photo_filename FROM employees ORDER BY name')
    .all();
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
    const job = await notificationJobService.startAssignmentEmailsJob();
    return res.json({ job });
  } catch (error) {
    const status = error.status || 500;
    const payload = { message: error.message };
    if (error.jobSnapshot) {
      payload.job = error.jobSnapshot;
    }
    return res.status(status).json(payload);
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
    const job = await notificationJobService.startWishlistRemindersJob();
    return res.json({ job });
  } catch (error) {
    const status = error.status || 500;
    const payload = { message: error.message };
    if (error.jobSnapshot) {
      payload.job = error.jobSnapshot;
    }
    return res.status(status).json(payload);
  }
});

router.get('/notifications/status', (req, res) => {
  return res.json({ job: notificationJobService.getJobStatus() });
});

router.post('/notifications/cancel', (req, res) => {
  try {
    const job = notificationJobService.requestCancellation();
    return res.json({ job });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ message: error.message });
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
