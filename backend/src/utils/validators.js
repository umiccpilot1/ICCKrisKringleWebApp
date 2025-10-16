function validateWishlistItems(items) {
  if (!Array.isArray(items)) return false;
  if (items.length === 0 || items.length > 3) return false;

  return items.every((item) => {
    // Each item should be an object with description and optional link
    if (typeof item !== 'object' || item === null) return false;

    // Description is required and must be a non-empty string (max 120 chars)
    if (typeof item.description !== 'string' || item.description.trim().length === 0 || item.description.length > 120) {
      return false;
    }

    // Link is optional, but if provided must be a valid URL format
    if (item.link !== undefined && item.link !== null && item.link !== '') {
      if (typeof item.link !== 'string') return false;

      // Basic URL validation
      try {
        const url = new URL(item.link);
        // Must be http or https
        if (!['http:', 'https:'].includes(url.protocol)) return false;
      } catch {
        return false;
      }
    }

    return true;
  });
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

module.exports = {
  validateWishlistItems,
  validateEmail
};
