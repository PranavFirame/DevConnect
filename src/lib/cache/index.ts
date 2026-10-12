import { Redis } from '@upstash/redis';

interface CacheInterface {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, options?: { ex?: number }): Promise<unknown>;
  del(key: string): Promise<unknown>;
  ping?(): Promise<string>;
}

// In-memory fallback cache for development or when Redis is unconfigured
class MemoryCache implements CacheInterface {
  private store = new Map<string, { value: string; expiresAt: number | null }>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    try {
      return JSON.parse(entry.value) as T;
    } catch {
      return entry.value as unknown as T;
    }
  }

  async set(key: string, value: unknown, options?: { ex?: number }): Promise<'OK'> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    const expiresAt = options?.ex ? Date.now() + options.ex * 1000 : null;
    this.store.set(key, { value: serialized, expiresAt });
    return 'OK';
  }

  async del(key: string): Promise<number> {
    const existed = this.store.delete(key);
    return existed ? 1 : 0;
  }

  async flushall(): Promise<void> {
    this.store.clear();
  }

  async ping(): Promise<string> {
    return 'PONG';
  }
}

const isUpstashConfigured = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

let rawRedis: Redis | null = null;
let cacheInstance: CacheInterface;

if (isUpstashConfigured) {
  try {
    rawRedis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    // Resilient Redis proxy: if Upstash ever fails or times out,
    // it never throws fatal errors that could break queries or writes.
    cacheInstance = {
      async get<T>(key: string): Promise<T | null> {
        try {
          return await rawRedis!.get<T>(key);
        } catch (err) {
          console.warn('[Cache] Redis get error:', err);
          return null;
        }
      },
      async set(key: string, value: unknown, options?: { ex?: number }): Promise<unknown> {
        try {
          if (options && typeof options.ex === 'number') {
            return await rawRedis!.set(key, value, { ex: options.ex });
          }
          return await rawRedis!.set(key, value);
        } catch (err) {
          console.warn('[Cache] Redis set error:', err);
          return null;
        }
      },
      async del(key: string): Promise<unknown> {
        try {
          return await rawRedis!.del(key);
        } catch (err) {
          console.warn('[Cache] Redis del error:', err);
          return 0;
        }
      },
      async ping(): Promise<string> {
        return await rawRedis!.ping();
      },
    };
  } catch (err) {
    console.warn('[Cache] Failed to initialize Upstash Redis client:', err);
    cacheInstance = new MemoryCache();
  }
} else {
  cacheInstance = new MemoryCache();
}

export const cache = cacheInstance;
export const isRedisConfigured = isUpstashConfigured;
export { isUpstashConfigured as isRedisEnabled };
