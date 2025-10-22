const express = require('express');
const { fetchLinkPreview } = require('../services/linkPreviewService');

const router = express.Router();

router.get('/link-preview', async (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const preview = await fetchLinkPreview(url);

    return res.json({
      image: preview.image,
      title: preview.title,
      description: preview.description,
      domain: preview.domain,
      platform: preview.platform || 'unknown',
      isScreenshot: Boolean(preview.isScreenshot),
      cached: Boolean(preview.cached),
    });
  } catch (error) {
    console.error('Preview fetch error:', error.message);
    
    // Fallback: return basic info with platform detection
    let platform = 'unknown';
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      if (hostname.includes('shopee')) platform = 'shopee';
      else if (hostname.includes('lazada')) platform = 'lazada';
      else if (hostname.includes('amazon')) platform = 'amazon';
    } catch (e) {}
    
    return res.json({ 
      image: null,
      title: null,
      description: null,
      domain: (() => {
        try {
          return new URL(url).hostname;
        } catch {
          return 'unknown';
        }
      })(),
      platform: platform,
      isScreenshot: false,
      cached: false,
    });
  }
});

module.exports = router;
