import express from 'express';
import axios from 'axios';

const router = express.Router();

// Search YouTube videos
router.get('/search', async (req, res) => {
  try {
    const { q, maxResults = 10 } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      console.error('YouTube API key not configured');
      return res.status(500).json({ error: 'YouTube API not configured' });
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
    }));

    res.json({ videos });
  } catch (error: any) {
    console.error('YouTube search error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to search YouTube' });
  }
});

export default router;
