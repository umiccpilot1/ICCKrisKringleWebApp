const { verifyJWT } = require('../utils/tokenGenerator');
const { db } = require('../config/database');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization required' });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyJWT(token);
  if (!payload) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  const session = db.prepare('SELECT * FROM sessions WHERE token = ? AND expires_at > datetime()').get(token);
  if (!session) {
    return res.status(401).json({ message: 'Session not found or expired' });
  }

  req.user = { id: session.employee_id, ...payload };
  return next();
}

module.exports = authMiddleware;
