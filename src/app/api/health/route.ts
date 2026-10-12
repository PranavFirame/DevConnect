import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { cache, isRedisConfigured } from '@/lib/cache';

export async function GET() {
  const startTime = Date.now();
  let dbStatus = 'disconnected';
  let dbLatencyMs = 0;

  // 1. Check Neon PostgreSQL
  try {
    const dbStart = Date.now();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Connection timed out')), 3000)
    );
    await Promise.race([prisma.$queryRaw`SELECT 1`, timeoutPromise]);
    dbLatencyMs = Date.now() - dbStart;
    dbStatus = 'connected';
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    dbStatus = `offline (${message})`;
  }

  // 2. Check Cache
  let cacheStatus = 'inactive';
  let cacheProvider = 'none';

  if (isRedisConfigured) {
    cacheProvider = 'upstash-redis';
    try {
      if (cache.ping) {
        await cache.ping();
        cacheStatus = 'connected';
      } else {
        cacheStatus = 'active';
      }
    } catch {
      cacheStatus = 'degraded';
    }
  } else {
    cacheProvider = 'in-memory-dev';
    cacheStatus = 'active';
  }

  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();

  return NextResponse.json(
    {
      status: dbStatus === 'connected' ? 'healthy' : 'degraded',
      service: 'DevConnect API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - startTime,
      database: {
        provider: 'neon-postgresql',
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
      cache: {
        provider: cacheProvider,
        status: cacheStatus,
        isUpstashConfigured: isRedisConfigured,
      },
      system: {
        uptimeSeconds: Math.floor(uptime),
        memoryRssMb: Math.round(memoryUsage.rss / 1024 / 1024),
        memoryHeapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      },
    },
    { status: dbStatus === 'connected' ? 200 : 503 }
  );
}
