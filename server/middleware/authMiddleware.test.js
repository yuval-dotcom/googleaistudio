import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createToken, verifyToken, requireAuth } from './authMiddleware.js';

describe('authMiddleware', () => {
  describe('createToken and verifyToken', () => {
    it('creates token and verifies payload', async () => {
      const payload = { userId: 'u1', email: 'a@b.com' };
      const token = await createToken(payload);
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
      const decoded = await verifyToken(token);
      expect(decoded.userId).toBe('u1');
      expect(decoded.email).toBe('a@b.com');
    });

    it('verifyToken throws on invalid token', async () => {
      await expect(verifyToken('invalid')).rejects.toThrow();
    });
  });

  describe('requireAuth', () => {
    it('returns 401 when no Authorization header', () => {
      const req = { headers: {} };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();
      requireAuth(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when token is not Bearer', () => {
      const req = { headers: { authorization: 'Basic x' } };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();
      requireAuth(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next and sets req.userId when token is valid', async () => {
      const token = await createToken({ userId: 'u2', email: 'u@x.com' });
      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();
      requireAuth(req, res, next);
      await new Promise((r) => setTimeout(r, 5));
      expect(next).toHaveBeenCalled();
      expect(req.userId).toBe('u2');
      expect(req.userEmail).toBe('u@x.com');
    });

    it('returns 401 when token is invalid', async () => {
      const req = { headers: { authorization: 'Bearer bad-token' } };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();
      requireAuth(req, res, next);
      await new Promise((r) => setImmediate(r));
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
