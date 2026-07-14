import { PrismaClient } from '@prisma/client';

if (typeof global !== 'undefined' && !(global as any).__fetchPatched) {
  (global as any).__fetchPatched = true;
  const originalFetch = global.fetch;
  (global as any).fetch = async function (
    input: any,
    init?: RequestInit
  ): Promise<Response> {
    const urlStr =
      typeof input === 'string'
        ? input
        : input instanceof URL
        ? input.toString()
        : input?.url || '';

    try {
      return await originalFetch(input, init);
    } catch (error: any) {
      if (urlStr.includes('.maas.aliyuncs.com')) {
        const fallbackUrl = urlStr.replace(
          /https:\/\/[^\/]+/,
          'https://dashscope.aliyuncs.com'
        );
        console.warn(
          `[Global Fetch Patch] Private Maas host failed: ${urlStr}. Retrying with public endpoint: ${fallbackUrl}`
        );
        try {
          return await originalFetch(fallbackUrl, init);
        } catch (innerErr) {
          // ignore fallback failure and throw original error
        }
      }
      throw error;
    }
  };
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
