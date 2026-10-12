import { PrismaClient } from '@prisma/client';
import net from 'net';

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var isPostgresAvailableGlobal: boolean | null | undefined;
  // eslint-disable-next-line no-var
  var lastPostgresCheckGlobal: number | undefined;
}

/**
 * Fast circuit-breaker check for PostgreSQL availability.
 * If DATABASE_URL points to a remote database (e.g. Neon, Supabase),
 * it tests connectivity to that remote host/port.
 * If DATABASE_URL points to localhost, it does a fast 100ms local check.
 * If PostgreSQL is down, returns false immediately to avoid blocking timeouts.
 */
export async function isDatabaseAvailable(): Promise<boolean> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return false;

  const now = Date.now();
  const lastCheck = globalThis.lastPostgresCheckGlobal ?? 0;

  // Cache availability state for 30 seconds
  if (
    globalThis.isPostgresAvailableGlobal !== undefined &&
    globalThis.isPostgresAvailableGlobal !== null &&
    now - lastCheck < 30000
  ) {
    return globalThis.isPostgresAvailableGlobal;
  }

  // Parse host and port from DATABASE_URL
  let host = '127.0.0.1';
  let port = 5432;
  let isRemote = false;

  try {
    const parsed = new URL(dbUrl);
    host = parsed.hostname || '127.0.0.1';
    port = parsed.port ? parseInt(parsed.port, 10) : 5432;
    isRemote = host !== 'localhost' && host !== '127.0.0.1' && !host.startsWith('192.168.') && !host.startsWith('10.');
  } catch {
    // Keep defaults
  }

  // Fast TCP socket ping to host:port
  // Remote databases get 1500ms timeout; localhost gets 100ms timeout
  const timeoutMs = isRemote ? 1500 : 100;

  const isPortOpen = await new Promise<boolean>((resolve) => {
    try {
      const socket = new net.Socket();
      socket.setTimeout(timeoutMs);
      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });
      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });
      socket.on('error', () => {
        socket.destroy();
        resolve(false);
      });
      socket.connect(port, host);
    } catch {
      resolve(false);
    }
  });

  globalThis.isPostgresAvailableGlobal = isPortOpen;
  globalThis.lastPostgresCheckGlobal = now;
  return isPortOpen;
}

const rawPrisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    log: ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = rawPrisma;
}

/**
 * Transparent Circuit Breaker Proxy for Prisma.
 * Bypasses connection hangs whenever PostgreSQL is unreachable,
 * immediately failing with a catchable error so the resolver falls back to memoryDb.
 */
function createCircuitBreakerPrisma(client: PrismaClient): PrismaClient {
  return new Proxy(client, {
    get(target: any, modelProp: string | symbol) {
      const model = target[modelProp];
      if (typeof model !== 'object' || model === null) {
        if (typeof model === 'function') {
          return model.bind(target);
        }
        return model;
      }

      return new Proxy(model, {
        get(modelTarget: any, actionProp: string | symbol) {
          const action = modelTarget[actionProp];
          if (typeof action !== 'function') return action;

          return async function (...args: any[]) {
            const available = await isDatabaseAvailable();
            if (!available) {
              const err = new Error('Database unreachable: circuit-breaker active');
              err.name = 'PrismaClientInitializationError';
              throw err;
            }
            return action.apply(modelTarget, args);
          };
        },
      });
    },
  });
}

export const prisma = createCircuitBreakerPrisma(rawPrisma);

export default prisma;
