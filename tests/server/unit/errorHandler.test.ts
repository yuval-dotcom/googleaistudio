import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { errorHandler } from '../../../server/middleware/errorHandler.ts';
import { HttpError } from '../../../server/errors/HttpError.ts';

function makeRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  };
}

describe('errorHandler middleware', () => {
  let originalEnv: string | undefined;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
    consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    consoleErrorSpy.mockRestore();
  });

  it('returns HttpError status and message', () => {
    const err = new HttpError(404, 'Not found');
    const req = {} as any;
    const res = makeRes();

    errorHandler(err, req, res as any, (() => {}) as any);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Not found',
    });
  });

  it('returns 500 with original message in non-production', () => {
    process.env.NODE_ENV = 'test';
    const err = new Error('boom');
    const req = {} as any;
    const res = makeRes();

    errorHandler(err, req, res as any, (() => {}) as any);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'boom',
    });
  });

  it('returns generic message in production', () => {
    process.env.NODE_ENV = 'production';
    const err = new Error('sensitive error');
    const req = {} as any;
    const res = makeRes();

    errorHandler(err, req, res as any, (() => {}) as any);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Internal server error',
    });
  });
});

