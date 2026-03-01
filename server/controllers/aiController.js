import { isRateLimitAllowed } from '../services/rateLimiterService.js';
import { generateText, generateTextStream } from '../services/aiService.js';

export async function handleAiRequest(req, res) {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';

  if (!isRateLimitAllowed(ip)) {
    return res
      .status(429)
      .json({ error: 'Too many requests. Please try again in a minute.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    return res.status(503).json({ error: 'AI service not configured' });
  }

  const { prompt = '', systemInstruction, stream = false } = req.body || {};

  try {
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      for await (const text of generateTextStream(apiKey, { prompt, systemInstruction })) {
        res.write('data: ' + JSON.stringify({ text }) + '\n\n');
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      const out = await generateText(apiKey, { prompt, systemInstruction });
      res.json(out);
    }
  } catch (err) {
    res
      .status(500)
      .json({ error: err?.message || 'Server error' });
  }
}

