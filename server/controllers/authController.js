import * as authService from '../services/authService.js';
import * as authMiddleware from '../middleware/authMiddleware.js';

export async function register(req, res) {
  try {
    const { email, password, name } = req.body || {};
    if (!email?.trim() || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const user = await authService.createUser({ email, password, name });
    const token = await authMiddleware.createToken({ userId: user.id, email: user.email });
    res.status(201).json({ user, token });
  } catch (err) {
    if (err.message === 'EMAIL_IN_USE') {
      return res.status(409).json({ error: 'This email is already registered' });
    }
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email?.trim() || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const dbUser = await authService.findUserByEmail(email);
    if (!dbUser) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const user = await authService.verifyPassword(dbUser, password);
    const token = await authMiddleware.createToken({ userId: user.id, email: user.email });
    res.json({ user, token });
  } catch (err) {
    if (err.message === 'INVALID_CREDENTIALS') {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

export async function me(req, res) {
  try {
    const user = await authService.findUserById(req.userId);
    if (!user) return res.status(401).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

/** List users – only in development */
export async function listUsers(req, res) {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not available in production' });
  }
  try {
    const users = await authService.listUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
}
