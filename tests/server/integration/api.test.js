import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../../server/app.js';

describe('API', () => {
  describe('GET /api', () => {
    it('returns 200 and lists endpoints', async () => {
      const res = await request(app).get('/api');
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('RE Investor Pro – Server API');
      expect(res.body.endpoints).toBeDefined();
      expect(res.body.endpoints.auth).toBeDefined();
      expect(res.body.endpoints.assets).toBeDefined();
      expect(res.body.endpoints.ai).toBeDefined();
    });
  });

  describe('Protected routes require Bearer token', () => {
    it('GET /api/assets returns 401 without Authorization', async () => {
      const res = await request(app).get('/api/assets');
      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/auth|required|invalid/i);
    });

    it('GET /api/assets returns 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/assets')
        .set('Authorization', 'Bearer invalid-token');
      expect(res.status).toBe(401);
    });

    it('GET /api/transactions returns 401 without token', async () => {
      const res = await request(app).get('/api/transactions');
      expect(res.status).toBe(401);
    });
  });

  describe('Fallback route and error handling', () => {
    it('serves SPA fallback for unknown non-API route', async () => {
      const res = await request(app).get('/some/random/path');
      // In production build this will be index.html; in tests we at least expect HTML content or a 503 with HTML.
      expect([200, 503]).toContain(res.status);
      expect(res.text).toMatch(/<!DOCTYPE html>/i);
    });

    it('returns JSON 404 for unknown API routes', async () => {
      const res = await request(app).get('/api/does-not-exist');
      expect(res.status).toBe(404);
      expect(res.headers['content-type']).toMatch(/application\/json/i);
      expect(typeof res.body).toBe('object');
      expect(typeof res.body.error).toBe('string');
    });

    it('keeps existing JSON shape for auth validation errors', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .set('Content-Type', 'application/json')
        .send({});
      expect(res.status).toBe(400);
      expect(typeof res.body).toBe('object');
      // The controller still returns { error: string } and should not be wrapped differently by errorHandler
      expect(typeof res.body.error).toBe('string');
    });
  });

  describe('POST /api/auth/register', () => {
    it('returns 400 when email and password missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .set('Content-Type', 'application/json')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/email|password|required/i);
    });

    it('returns 400 when password too short', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .set('Content-Type', 'application/json')
        .send({ email: 'a@b.com', password: '12345' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/6|character/i);
    });
  });

  describe('POST /api/auth/login', () => {
    it('returns 400 when body missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send({});
      expect(res.status).toBe(400);
    });
  });
});
