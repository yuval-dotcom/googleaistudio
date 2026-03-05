import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as authController from './authController.js';

vi.mock('../services/authService.js', () => ({
  createUser: vi.fn(),
  findUserByEmail: vi.fn(),
  verifyPassword: vi.fn(),
  findUserById: vi.fn(),
  listUsers: vi.fn(),
}));
vi.mock('../middleware/authMiddleware.js', () => ({
  createToken: vi.fn(() => Promise.resolve('fake-jwt')),
}));

import * as authService from '../services/authService.js';
import * as authMiddleware from '../middleware/authMiddleware.js';

function mockRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  };
}

describe('authController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('returns 400 when email missing', async () => {
      const req = { body: { password: '123456' } };
      const res = mockRes();
      await authController.register(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email and password are required' });
      expect(authService.createUser).not.toHaveBeenCalled();
    });

    it('returns 400 when password too short', async () => {
      const req = { body: { email: 'a@b.com', password: '12345' } };
      const res = mockRes();
      await authController.register(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Password must be at least 6 characters' });
    });

    it('returns 201 and user+token on success', async () => {
      authService.createUser.mockResolvedValue({ id: '1', email: 'a@b.com', name: null });
      const req = { body: { email: 'a@b.com', password: '123456' } };
      const res = mockRes();
      await authController.register(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ user: { id: '1', email: 'a@b.com', name: null }, token: 'fake-jwt' });
    });

    it('returns 409 when EMAIL_IN_USE', async () => {
      authService.createUser.mockRejectedValue(new Error('EMAIL_IN_USE'));
      const req = { body: { email: 'a@b.com', password: '123456' } };
      const res = mockRes();
      await authController.register(req, res);
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ error: 'This email is already registered' });
    });
  });

  describe('login', () => {
    it('returns 400 when email or password missing', async () => {
      const res = mockRes();
      await authController.login({ body: {} }, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email and password are required' });
    });

    it('returns 401 when user not found', async () => {
      authService.findUserByEmail.mockResolvedValue(null);
      const req = { body: { email: 'a@b.com', password: '123456' } };
      const res = mockRes();
      await authController.login(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid email or password' });
    });

    it('returns 401 on invalid password', async () => {
      authService.findUserByEmail.mockResolvedValue({ id: '1', passwordHash: 'x' });
      authService.verifyPassword.mockRejectedValue(new Error('INVALID_CREDENTIALS'));
      const req = { body: { email: 'a@b.com', password: 'wrong' } };
      const res = mockRes();
      await authController.login(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid email or password' });
    });

    it('returns user and token on success', async () => {
      authService.findUserByEmail.mockResolvedValue({ id: '1', passwordHash: 'x' });
      authService.verifyPassword.mockResolvedValue({ id: '1', email: 'a@b.com', name: 'A' });
      const req = { body: { email: 'a@b.com', password: '123456' } };
      const res = mockRes();
      await authController.login(req, res);
      expect(res.status).not.toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ user: { id: '1', email: 'a@b.com', name: 'A' }, token: 'fake-jwt' });
    });
  });

  describe('me', () => {
    it('returns 401 when user not found', async () => {
      authService.findUserById.mockResolvedValue(null);
      const req = { userId: 'u1' };
      const res = mockRes();
      await authController.me(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('returns user when found', async () => {
      const user = { id: 'u1', email: 'a@b.com', name: 'A', createdAt: new Date() };
      authService.findUserById.mockResolvedValue(user);
      const req = { userId: 'u1' };
      const res = mockRes();
      await authController.me(req, res);
      expect(res.json).toHaveBeenCalledWith(user);
    });
  });

  describe('listUsers', () => {
    it('returns 404 in production', async () => {
      const prev = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      const req = {};
      const res = mockRes();
      await authController.listUsers(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Not available in production' });
      process.env.NODE_ENV = prev;
    });

    it('returns users list in non-production', async () => {
      const prev = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';
      authService.listUsers.mockResolvedValue([{ id: '1', email: 'a@b.com' }]);
      const req = {};
      const res = mockRes();
      await authController.listUsers(req, res);
      expect(res.json).toHaveBeenCalledWith([{ id: '1', email: 'a@b.com' }]);
      process.env.NODE_ENV = prev;
    });
  });
});
