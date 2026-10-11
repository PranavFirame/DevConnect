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
 * If PostgreSQL is down or unreachable, returns false immediately
 * to avoid 4,000ms+ connection timeout penalties on every GraphQL operation.
 */
export async function isDatabaseAvailable(): Promise<boolean> {
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

  // Fast TCP socket ping to localhost:5432 (returns in <1ms with ECONNREFUSED if PostgreSQL is not running)
  const isPortOpen = await new Promise<boolean>((resolve) => {
    try {
      const socket = new net.Socket();
      socket.setTimeout(100);
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
      socket.connect(5432, '127.0.0.1');
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
 * Bypasses 4,000ms+ TCP connect hangs whenever PostgreSQL is unreachable,
 * immediately failing with a catchable error so the resolver falls back to memoryDb in <0.1ms.
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
