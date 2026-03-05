import bcrypt from 'bcryptjs';
import { prisma } from '../db/prisma.js';

const SALT_ROUNDS = 10;

export async function createUser({ email, password, name }) {
  const emailNorm = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: emailNorm } });
  if (existing) throw new Error('EMAIL_IN_USE');
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      email: emailNorm,
      passwordHash,
      name: name?.trim() || null,
    },
  });
  return { id: user.id, email: user.email, name: user.name };
}

export async function findUserByEmail(email) {
  const emailNorm = email.trim().toLowerCase();
  return prisma.user.findUnique({ where: { email: emailNorm } });
}

export async function verifyPassword(user, password) {
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new Error('INVALID_CREDENTIALS');
  return { id: user.id, email: user.email, name: user.name };
}

export async function findUserById(id) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, createdAt: true },
  });
  return user;
}

/** List all users (id, email, name, createdAt) – for dev/admin only */
export async function listUsers() {
  return prisma.user.findMany({
    select: { id: true, email: true, name: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
}
