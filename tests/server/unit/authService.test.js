import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../server/db/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

import bcrypt from 'bcryptjs';
import { prisma } from '../../../server/db/prisma.js';
import { createUser, findUserByEmail, verifyPassword, findUserById, listUsers } from '../../../server/services/authService.js';

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createUser', () => {
    it('creates user with normalized email and trimmed name', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashed-pass');
      prisma.user.create.mockResolvedValue({
        id: 'u1',
        email: 'test@example.com',
        name: 'Yuval',
      });

      const out = await createUser({
        email: '  TEST@EXAMPLE.COM ',
        password: 'secret123',
        name: '  Yuval ',
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(bcrypt.hash).toHaveBeenCalledWith('secret123', 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          passwordHash: 'hashed-pass',
          name: 'Yuval',
        },
      });
      expect(out).toEqual({ id: 'u1', email: 'test@example.com', name: 'Yuval' });
    });

    it('throws EMAIL_IN_USE when email already exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        createUser({ email: 'test@example.com', password: 'secret123' })
      ).rejects.toThrow('EMAIL_IN_USE');
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('findUserByEmail', () => {
    it('searches by normalized email', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
      await findUserByEmail('  A@B.COM ');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'a@b.com' } });
    });
  });

  describe('verifyPassword', () => {
    it('returns safe user when password is valid', async () => {
      bcrypt.compare.mockResolvedValue(true);
      const out = await verifyPassword({ id: 'u1', email: 'a@b.com', name: 'A', passwordHash: 'x' }, '123456');
      expect(out).toEqual({ id: 'u1', email: 'a@b.com', name: 'A' });
    });

    it('throws INVALID_CREDENTIALS when password is invalid', async () => {
      bcrypt.compare.mockResolvedValue(false);
      await expect(
        verifyPassword({ id: 'u1', email: 'a@b.com', name: 'A', passwordHash: 'x' }, 'wrong')
      ).rejects.toThrow('INVALID_CREDENTIALS');
    });
  });

  describe('findUserById', () => {
    it('uses select to return safe fields only', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'a@b.com', name: 'A', createdAt: new Date() });
      await findUserById('u1');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'u1' },
        select: { id: true, email: true, name: true, createdAt: true },
      });
    });
  });

  describe('listUsers', () => {
    it('returns ordered user list with safe fields', async () => {
      prisma.user.findMany.mockResolvedValue([{ id: 'u1', email: 'a@b.com' }]);
      const out = await listUsers();
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        select: { id: true, email: true, name: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      });
      expect(out).toEqual([{ id: 'u1', email: 'a@b.com' }]);
    });
  });
});
