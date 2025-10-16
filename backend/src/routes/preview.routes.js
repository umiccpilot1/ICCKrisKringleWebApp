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
      isScreenshot: Boolean(preview.isScreenshot),
      cached: Boolean(preview.cached),
    });
  } catch (error) {
    console.error('Preview fetch error:', error.message);
    
    // Fallback: return basic info
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
      isScreenshot: false,
      cached: false,
    });
  }
});

module.exports = router;
