function validateWishlistItems(items) {
  if (!Array.isArray(items)) return false;
  if (items.length === 0 || items.length > 3) return false;
  return items.every((item) => typeof item === 'string' && item.trim().length > 0 && item.length <= 120);
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

module.exports = {
  validateWishlistItems,
  validateEmail
};
