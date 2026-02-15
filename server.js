/**
 * Production server: serves the built app and /api/ai (Gemini key stays on server).
 * Run: npm run build && node server.js
 * Set GEMINI_API_KEY in the environment.
 */
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { runGenerate, runGenerateStream } from './api/gemini.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Rate limit: 30 requests per minute per IP
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 30;
const rateLimitMap = new Map();
function rateLimitAllow(ip) {
  const now = Date.now();
  let entry = rateLimitMap.get(ip);
  if (!entry) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (now >= entry.resetAt) {
    entry = { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
    rateLimitMap.set(ip, entry);
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT_MAX;
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

app.post('/api/ai', async (req, res) => {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  if (!rateLimitAllow(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please try again in a minute.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey?.trim()) {
    return res.status(503).json({ error: 'AI service not configured' });
  }

  const { prompt = '', systemInstruction, stream = false } = req.body || {};

  try {
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      for await (const text of runGenerateStream(apiKey, { prompt, systemInstruction })) {
        res.write('data: ' + JSON.stringify({ text }) + '\n\n');
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      const out = await runGenerate(apiKey, { prompt, systemInstruction });
      res.json(out);
    }
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
