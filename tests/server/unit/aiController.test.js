import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../server/services/rateLimiterService.js', () => ({
  isRateLimitAllowed: vi.fn(),
}));

vi.mock('../../../server/services/aiService.js', () => ({
  generateText: vi.fn(),
  generateTextStream: vi.fn(),
}));

import { isRateLimitAllowed } from '../../../server/services/rateLimiterService.js';
import { generateText, generateTextStream } from '../../../server/services/aiService.js';
import { handleAiRequest } from '../../../server/controllers/aiController.js';

function makeRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
    setHeader: vi.fn(),
    write: vi.fn(),
    end: vi.fn(),
  };
}

async function* makeStream(chunks) {
  for (const chunk of chunks) {
    yield chunk;
  }
}

describe('aiController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-key';
  });

  it('returns 429 when rate limit blocks request', async () => {
    isRateLimitAllowed.mockReturnValue(false);
    const req = { ip: '127.0.0.1', body: {} };
    const res = makeRes();

    await handleAiRequest(req, res);

    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({ error: 'Too many requests. Please try again in a minute.' });
  });

  it('returns 503 when GEMINI_API_KEY is missing', async () => {
    isRateLimitAllowed.mockReturnValue(true);
    process.env.GEMINI_API_KEY = '';
    const req = { ip: '127.0.0.1', body: {} };
    const res = makeRes();

    await handleAiRequest(req, res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({ error: 'AI service not configured' });
  });

  it('returns JSON when stream is false', async () => {
    isRateLimitAllowed.mockReturnValue(true);
    generateText.mockResolvedValue({ text: 'ok' });
    const req = { ip: '127.0.0.1', body: { prompt: 'hello', stream: false } };
    const res = makeRes();

    await handleAiRequest(req, res);

    expect(generateText).toHaveBeenCalledWith('test-key', { prompt: 'hello', systemInstruction: undefined });
    expect(res.json).toHaveBeenCalledWith({ text: 'ok' });
  });

  it('streams SSE response when stream=true', async () => {
    isRateLimitAllowed.mockReturnValue(true);
    generateTextStream.mockReturnValue(makeStream(['first', 'second']));
    const req = { ip: '127.0.0.1', body: { prompt: 'hello', stream: true } };
    const res = makeRes();

    await handleAiRequest(req, res);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
    expect(res.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive');
    expect(res.write).toHaveBeenCalledWith('data: {"text":"first"}\n\n');
    expect(res.write).toHaveBeenCalledWith('data: {"text":"second"}\n\n');
    expect(res.write).toHaveBeenCalledWith('data: [DONE]\n\n');
    expect(res.end).toHaveBeenCalled();
  });

  it('returns 500 when service throws', async () => {
    isRateLimitAllowed.mockReturnValue(true);
    generateText.mockRejectedValue(new Error('boom'));
    const req = { ip: '127.0.0.1', body: { prompt: 'hello' } };
    const res = makeRes();

    await handleAiRequest(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'boom' });
  });
});
