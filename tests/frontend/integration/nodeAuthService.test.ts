import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getToken,
  setToken,
  clearToken,
  register,
  login,
  getMe,
} from '../../../services/nodeAuthService';

describe('nodeAuthService', () => {
  const mockStorage: Record<string, string> = {};
  beforeEach(() => {
    vi.stubGlobal(
      'localStorage',
      {
        getItem: (key: string) => mockStorage[key] ?? null,
        setItem: (key: string, value: string) => {
          mockStorage[key] = value;
        },
        removeItem: (key: string) => {
          delete mockStorage[key];
        },
        clear: () => {
          Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
        },
        length: 0,
        key: () => null,
      }
    );
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
    vi.clearAllMocks();
  });

  describe('token storage', () => {
    it('getToken returns null when empty', () => {
      expect(getToken()).toBeNull();
    });
    it('setToken and getToken roundtrip', () => {
      setToken('abc');
      expect(getToken()).toBe('abc');
    });
    it('clearToken removes token', () => {
      setToken('abc');
      clearToken();
      expect(getToken()).toBeNull();
    });
  });

  describe('register', () => {
    it('throws on API error', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        statusText: 'Conflict',
        json: async () => ({ error: 'This email is already registered' }),
      }));
      await expect(register('a@b.com', '123456')).rejects.toThrow(/already registered|Conflict/i);
    });
    it('returns user and token on success', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          user: { id: '1', email: 'a@b.com', name: 'A' },
          token: 'jwt-xyz',
        }),
      }));
      const result = await register('a@b.com', '123456');
      expect(result.user.email).toBe('a@b.com');
      expect(result.token).toBe('jwt-xyz');
    });
  });

  describe('login', () => {
    it('returns user and token on success', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          user: { id: '1', email: 'a@b.com', name: null },
          token: 'jwt-abc',
        }),
      }));
      const result = await login('a@b.com', '123456');
      expect(result.user.id).toBe('1');
      expect(result.token).toBe('jwt-abc');
    });
    it('throws on invalid credentials', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Invalid email or password' }),
      }));
      await expect(login('a@b.com', 'wrong')).rejects.toThrow(/invalid|password/i);
    });
  });

  describe('getMe', () => {
    it('returns null when no token', async () => {
      const res = await getMe();
      expect(res).toBeNull();
    });
    it('returns null when request fails', async () => {
      setToken('some-token');
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
      const res = await getMe();
      expect(res).toBeNull();
    });
    it('returns user when token valid', async () => {
      setToken('some-token');
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: '1', email: 'a@b.com', name: 'A' }),
      }));
      const res = await getMe();
      expect(res).not.toBeNull();
      expect(res!.email).toBe('a@b.com');
    });
  });
});
