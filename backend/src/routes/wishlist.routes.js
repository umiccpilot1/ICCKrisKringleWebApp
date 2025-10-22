const express = require('express');
const authMiddleware = require('../middleware/auth');
const { db } = require('../config/database');
const { validateWishlistItems } = require('../utils/validators');

const router = express.Router();

router.use(authMiddleware);

router.get('/', (req, res) => {
  const wishlist = db.prepare('SELECT items, pending_items, is_confirmed FROM wishlists WHERE employee_id = ?').get(req.user.id);
  
  // Check if deadline has passed
  const deadlineSetting = db.prepare('SELECT value FROM settings WHERE key = ?').get('wishlist_deadline');
  let deadlinePassed = false;
  let deadline = null;
  
  if (deadlineSetting && deadlineSetting.value) {
    deadline = deadlineSetting.value;
    const deadlineDate = new Date(deadline);
    const now = new Date();
    deadlinePassed = now > deadlineDate;
  }
  
  if (!wishlist) {
    return res.json({ 
      wishlist: null,
      deadlinePassed,
      deadline
    });
  }
  
  return res.json({
    wishlist: {
      items: wishlist.items ? JSON.parse(wishlist.items) : [],
      pendingItems: wishlist.pending_items ? JSON.parse(wishlist.pending_items) : [],
      isConfirmed: !!wishlist.is_confirmed
    },
    deadlinePassed,
    deadline
  });
});

router.post('/', (req, res) => {
  // Check if wishlist deadline has passed
  const deadlineSetting = db.prepare('SELECT value FROM settings WHERE key = ?').get('wishlist_deadline');
  if (deadlineSetting && deadlineSetting.value) {
    const deadline = new Date(deadlineSetting.value);
    const now = new Date();
    
    if (now > deadline) {
      return res.status(403).json({ 
        message: 'Wishlist deadline has passed. You can no longer update your wishlist.',
        deadlinePassed: true 
      });
    }
  }

  const { items } = req.body;
  if (!validateWishlistItems(items)) {
    return res.status(400).json({ message: 'Wishlist must have 1-3 items. Each item needs a description (max 120 chars) and optional link (valid URL)' });
  }

  const existing = db.prepare('SELECT id FROM wishlists WHERE employee_id = ?').get(req.user.id);
  if (existing) {
    db.prepare(`
      UPDATE wishlists
      SET items = ?, pending_items = NULL, confirmation_token = NULL, token_expiry = NULL, is_confirmed = 1, confirmed_at = datetime('now'), updated_at = datetime('now')
      WHERE employee_id = ?
    `).run(JSON.stringify(items), req.user.id);
  } else {
    db.prepare(`
      INSERT INTO wishlists (employee_id, items, pending_items, confirmation_token, token_expiry, is_confirmed, confirmed_at)
      VALUES (?, ?, NULL, NULL, NULL, 1, datetime('now'))
    `).run(req.user.id, JSON.stringify(items));
  }

  return res.json({ message: 'Wishlist saved.' });
});

router.post('/confirm', (req, res) => {
  return res.json({ message: 'Wishlist confirmation no longer required.' });
});

module.exports = router;
