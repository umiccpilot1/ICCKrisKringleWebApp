const crypto = require('crypto');
const jwt = require('jsonwebtoken');

function generateSecureToken() {
  return crypto.randomBytes(32).toString('hex');
}

function generateJWT(payload, expiresIn = '7d') {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}

function verifyJWT(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}

function generateMagicLinkToken() {
  const token = generateSecureToken();
  const expiryHours = parseInt(process.env.MAGIC_LINK_EXPIRY_HOURS || '4', 10);
  const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
  return { token, expiresAt };
}

function generateConfirmationToken() {
  return generateSecureToken();
}

module.exports = {
  generateSecureToken,
  generateJWT,
  verifyJWT,
  generateMagicLinkToken,
  generateConfirmationToken
};
