import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { isRedisEnabled } from '@/lib/cache';

export async function GET() {
  const startTime = Date.now();
  let dbStatus = 'disconnected';
  let dbLatencyMs = 0;

  try {
    const dbStart = Date.now();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Connection timed out')), 2000)
    );
    await Promise.race([prisma.$queryRaw`SELECT 1`, timeoutPromise]);
    dbLatencyMs = Date.now() - dbStart;
    dbStatus = 'connected';
  } catch (err: unknown) {
    dbStatus = `offline (${(err as Error).message})`;
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
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
      cache: {
        provider: isRedisEnabled ? 'upstash-redis' : 'in-memory',
        status: 'active',
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
