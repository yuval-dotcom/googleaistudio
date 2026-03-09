import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd) {
    return new PrismaClient();
  }

  // In non-production, enable error and warn logs by default.
  // Set PRISMA_LOG_QUERIES=true to also log all queries.
  const log: ('query' | 'error' | 'warn')[] = ['error', 'warn'];
  if (process.env.PRISMA_LOG_QUERIES) {
    log.push('query');
  }

  return new PrismaClient({ log });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClientSingleton;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

