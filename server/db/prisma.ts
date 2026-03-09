import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  const isProd = process.env.NODE_ENV === 'production';
  return new PrismaClient(
    isProd
      ? undefined
      : {
          log: ['query', 'error', 'warn'],
        },
  );
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClientSingleton;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

