import express from 'express';
import axios from 'axios';

const router = express.Router();

// Search YouTube videos
// Supports both YouTube API and AI fallback
router.get('/search', async (req, res) => {
  try {
    const { q, maxResults = 10, useAI = 'false' } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    // If useAI is requested, return empty
    // The frontend will handle AI search directly
    if (useAI === 'true') {
      return res.json({
        videos: [],
        message: 'Use AI search on the client side',
        useAI: true
      });
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      console.warn('YouTube API key not configured, AI search should be used instead');
      return res.json({
        videos: [],
        message: 'YouTube API not configured. Use AI search instead.',
        useAI: true
      });
    }

    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q,
        maxResults,
        type: 'video',
        key: apiKey,
      }
    });

    const videos = response.data.items.map((item: any) => ({
      title: item.snippet.title,
      url: item.id.videoId,
      thumbnail: item.snippet.thumbnails.default.url,
      description: item.snippet.description,
      channelTitle: item.snippet.channelTitle,
    }));

    res.json({ videos, useAI: false });
  } catch (error: any) {
    console.error('YouTube search error:', error.response?.data || error.message);

    // If YouTube API fails, suggest using AI
    if (error.response?.status === 403 || error.response?.status === 429) {
      return res.json({
        videos: [],
        message: 'YouTube API quota exceeded. Use AI search instead.',
        useAI: true
      });
    }

    res.status(500).json({ error: 'Failed to search YouTube' });
  }
});

export default router;
