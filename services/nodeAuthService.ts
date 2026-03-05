/**
 * Auth against the Node backend (POST /api/auth/login, register, GET /api/auth/me).
 * Token is stored in localStorage under key node_auth_token.
 */

const TOKEN_KEY = 'node_auth_token';
const API = '/api/auth';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export interface NodeUser {
  id: string;
  email: string;
  name?: string | null;
}

export async function register(email: string, password: string, name?: string): Promise<{ user: NodeUser; token: string }> {
  const res = await fetch(API + '/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name: name || undefined }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export async function login(email: string, password: string): Promise<{ user: NodeUser; token: string }> {
  const res = await fetch(API + '/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export async function getMe(): Promise<NodeUser | null> {
  const token = getToken();
  if (!token) return null;
  const res = await fetch(API + '/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  return data;
}
