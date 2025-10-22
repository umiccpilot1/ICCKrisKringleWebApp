const express = require('express');
const bcrypt = require('bcrypt');
const { db } = require('../config/database');
const emailService = require('../services/emailService');
const { generateMagicLinkToken, generateJWT } = require('../utils/tokenGenerator');
const { validateEmail } = require('../utils/validators');

const router = express.Router();

router.post('/magic-link', async (req, res) => {
  const { email } = req.body;
  if (!validateEmail(email)) {
    return res.status(400).json({ message: 'Valid email required' });
  }

  const employee = db.prepare('SELECT id, name FROM employees WHERE lower(email) = lower(?)').get(email);
  if (!employee) {
    return res.status(404).json({ message: 'Employee not found' });
  }

  // Invalidate any existing unused magic links for this employee
  db.prepare('UPDATE magic_links SET used = 1 WHERE employee_id = ? AND used = 0')
    .run(employee.id);

  const { token, expiresAt } = generateMagicLinkToken();
  const hashedToken = await bcrypt.hash(token, 10);

  db.prepare('INSERT INTO magic_links (employee_id, token, expires_at) VALUES (?, ?, ?)')
    .run(employee.id, hashedToken, expiresAt.toISOString());

  await emailService.sendMagicLink(email, employee.name, token);
  return res.json({ message: 'Magic link sent' });
});

router.post('/callback', async (req, res) => {
  const { token, email } = req.body;
  if (!token || !email) {
    return res.status(400).json({ message: 'Token and email required' });
  }

  const employee = db.prepare('SELECT id, name, email, is_admin, is_super_admin FROM employees WHERE lower(email) = lower(?)').get(email);
  if (!employee) {
    return res.status(404).json({ message: 'Employee not found' });
  }

  // Get ALL valid (unused, non-expired) magic links for this employee
  const magicLinks = db.prepare(
    'SELECT id, token, expires_at, used FROM magic_links WHERE employee_id = ? AND used = 0 AND datetime(expires_at) > datetime(\'now\') ORDER BY created_at DESC'
  ).all(employee.id);
  
  if (!magicLinks || magicLinks.length === 0) {
    return res.status(400).json({ message: 'Magic link expired' });
  }

  // Try to match the token against any of the valid magic links
  let matchedLink = null;
  for (const link of magicLinks) {
    const isMatch = await bcrypt.compare(token, link.token);
    if (isMatch) {
      matchedLink = link;
      break;
    }
  }

  if (!matchedLink) {
    return res.status(400).json({ message: 'Invalid magic link token' });
  }

  // Mark the matched link as used
  db.prepare('UPDATE magic_links SET used = 1 WHERE id = ?').run(matchedLink.id);

  const sessionToken = generateJWT({ id: employee.id, email: employee.email, isAdmin: employee.is_admin });
  const sessionExpiryDays = parseInt(process.env.SESSION_EXPIRY_DAYS || '7', 10);
  const expiresAt = new Date(Date.now() + sessionExpiryDays * 24 * 60 * 60 * 1000);
  db.prepare('DELETE FROM sessions WHERE employee_id = ?').run(employee.id);
  db.prepare('INSERT INTO sessions (employee_id, token, expires_at) VALUES (?, ?, ?)')
    .run(employee.id, sessionToken, expiresAt.toISOString());

  return res.json({
    token: sessionToken,
    employee: {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      isAdmin: !!employee.is_admin,
      isSuperAdmin: !!employee.is_super_admin
    }
  });
});

router.post('/logout', (req, res) => {
  const { token } = req.body;
  if (token) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  }
  return res.json({ message: 'Logged out' });
});

module.exports = router;
