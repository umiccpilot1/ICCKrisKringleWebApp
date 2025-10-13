const { db } = require('../config/database');

function adminAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const employee = db.prepare('SELECT is_admin, is_super_admin FROM employees WHERE id = ?').get(req.user.id);
  if (!employee || (!employee.is_admin && !employee.is_super_admin)) {
    return res.status(403).json({ message: 'Admin access required' });
  }

  req.user.isAdmin = !!employee.is_admin;
  req.user.isSuperAdmin = !!employee.is_super_admin;
  return next();
}

module.exports = adminAuth;
