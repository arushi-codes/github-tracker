require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Redis = require('ioredis');
const axios = require('axios');

const app = express();
app.use(cors({
  origin: 'https://github-trackerrr.vercel.app',
  exposedHeaders: ['X-Cache'],
}));
app.use(express.json());

const redis = new Redis(process.env.REDIS_URL);

redis.on('connect', () => console.log('Connected to Redis Cloud'));
redis.on('error', (err) => {
  console.error('Redis connection error. Caching disabled.');
});

// Helper: fetch and shape GitHub data
async function fetchGitHubData(username) {
  const headers = { Authorization: `token ${process.env.GITHUB_TOKEN}` };

  const [userRes, reposRes] = await Promise.all([
    axios.get(`https://api.github.com/users/${username}`, { headers }),
    axios.get(`https://api.github.com/users/${username}/repos?per_page=100`, { headers })
  ]);

  const repos = reposRes.data;

  // Language breakdown
  const languageCount = {};
  repos.forEach(repo => {
    if (repo.language) {
      languageCount[repo.language] = (languageCount[repo.language] || 0) + 1;
    }
  });

  // Commit frequency (approximated via pushed_at dates)
  const commitFrequency = {};
  repos.forEach(repo => {
    const date = new Date(repo.pushed_at).toISOString().split('T')[0];
    commitFrequency[date] = (commitFrequency[date] || 0) + 1;
  });

  // Repo list
  const repoList = repos.map(repo => ({
    name: repo.name,
    html_url: repo.html_url,
    description: repo.description,
    language: repo.language,
    stargazers_count: repo.stargazers_count,
    forks_count: repo.forks_count,
    updated_at: repo.updated_at,
  }));

  // Total stars
  const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
  const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);

  return {
    profile: userRes.data,
    repoCount: repos.length,
    languageBreakdown: languageCount,
    commitFrequency,
    repoList,
    totalStars,
    totalForks,
    lastUpdated: new Date().toISOString()
  };
}

// Single user endpoint
app.get('/api/user/:username', async (req, res) => {
  const { username } = req.params;
  const cacheKey = `github_user:${username}`;

  try {
    const cached = await redis.get(cacheKey);

    if (cached) {
      console.log(`Cache HIT for ${username}`);
      res.set('X-Cache', 'HIT');
      return res.json(JSON.parse(cached));
    }

    console.log(`Cache MISS for ${username}`);
    const data = await fetchGitHubData(username);

    await redis.setex(cacheKey, 300, JSON.stringify(data));

    res.set('X-Cache', 'MISS');
    return res.json(data);

  } catch (error) {
    if (error.response?.status === 403 || error.response?.status === 429) {
      console.log(`Rate limited. Checking stale cache for ${username}`);
      const stale = await redis.get(cacheKey);

      if (stale) {
        const parsed = JSON.parse(stale);
        parsed.stale = true;
        res.set('X-Cache', 'STALE');
        return res.json(parsed);
      }

      return res.status(429).json({ error: 'Rate limited. No cached data available. Try again later.' });
    }

    if (error.response?.status === 404) {
      return res.status(404).json({ error: 'GitHub user not found' });
    }

    console.error(error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
});

// Comparison endpoint
app.get('/api/compare/:user1/:user2', async (req, res) => {
  const { user1, user2 } = req.params;
  const cacheKey = `compare:${user1}:${user2}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log(`Cache HIT for compare ${user1} vs ${user2}`);
      res.set('X-Cache', 'HIT');
      return res.json(JSON.parse(cached));
    }

    console.log(`Cache MISS for compare ${user1} vs ${user2}`);
    const [data1, data2] = await Promise.all([
      fetchGitHubData(user1),
      fetchGitHubData(user2),
    ]);

    const result = {
      user1: { ...data1, username: user1 },
      user2: { ...data2, username: user2 },
      lastUpdated: new Date().toISOString(),
    };

    await redis.setex(cacheKey, 300, JSON.stringify(result));

    res.set('X-Cache', 'MISS');
    return res.json(result);

  } catch (error) {
    if (error.response?.status === 404) {
      return res.status(404).json({ error: 'One or both users not found' });
    }
    if (error.response?.status === 403 || error.response?.status === 429) {
      const stale = await redis.get(cacheKey);
      if (stale) {
        const parsed = JSON.parse(stale);
        parsed.stale = true;
        res.set('X-Cache', 'STALE');
        return res.json(parsed);
      }
      return res.status(429).json({ error: 'Rate limited. Try again later.' });
    }
    console.error(error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
});

app.get('/', (req, res) => {
  res.send('GitHub Tracker API is running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});