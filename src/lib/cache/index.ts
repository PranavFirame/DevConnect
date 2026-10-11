import { Redis } from '@upstash/redis';

// In-memory fallback cache for when Redis credentials are not configured or when operating locally
class MemoryCache {
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
}

interface CacheInterface {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, options?: { ex?: number }): Promise<unknown>;
  del(key: string): Promise<unknown>;
}

const hasUpstash = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

let cacheInstance: CacheInterface;

if (hasUpstash) {
  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    cacheInstance = redis;
  } catch (err) {
    console.warn('[Cache] Failed to initialize Upstash Redis, falling back to MemoryCache:', err);
    cacheInstance = new MemoryCache();
  }
} else {
  cacheInstance = new MemoryCache();
}

export const cache = cacheInstance;
export const isRedisEnabled = hasUpstash;
