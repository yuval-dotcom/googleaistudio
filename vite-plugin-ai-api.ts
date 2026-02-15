import type { Plugin } from 'vite';
import path from 'path';
import { pathToFileURL } from 'url';

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 30; // requests per window per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function rateLimitAllow(ip: string): boolean {
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

function readBody(req: import('http').IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

export function aiApiPlugin(): Plugin {
  return {
    name: 'ai-api',
    configureServer: async (server) => {
      const geminiPath = path.resolve(process.cwd(), 'api', 'gemini.js');
      const { runGenerate, runGenerateStream } = await import(
        pathToFileURL(geminiPath).href
      );
      const apiKey = process.env.GEMINI_API_KEY;

      server.middlewares.use(async (req, res, next) => {
        const pathname = req.url?.split('?')[0];
        if (req.method !== 'POST' || pathname !== '/api/ai') {
          next();
          return;
        }

        const ip = req.socket?.remoteAddress ?? 'unknown';
        if (!rateLimitAllow(ip)) {
          res.statusCode = 429;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Too many requests. Please try again in a minute.' }));
          return;
        }

        if (!apiKey?.trim()) {
          res.statusCode = 503;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'AI service not configured' }));
          return;
        }

        let body: string;
        try {
          body = await readBody(req);
        } catch {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Invalid request body' }));
          return;
        }

        let data: { prompt?: string; systemInstruction?: string; stream?: boolean };
        try {
          data = JSON.parse(body);
        } catch {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
          return;
        }

        const prompt = data.prompt ?? '';
        const systemInstruction = data.systemInstruction;
        const stream = data.stream === true;

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
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(out));
          }
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Server error';
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: message }));
        }
      });
    },
  };
}
