import Redis from "ioredis";

const redisClientSingleton = () => {
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
  console.log(`[Redis] Connecting to ${redisUrl}`);
  const client = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
  });
  
  // Handle connection errors gracefully without throwing unhandled exceptions
  client.on("error", (err) => {
    console.error(`[Redis] Connection error: ${err.message}`);
  });

  return client;
};

declare const globalThis: {
  redisGlobal: ReturnType<typeof redisClientSingleton>;
} & typeof global;

const redis = globalThis.redisGlobal ?? redisClientSingleton();

export default redis;

if (process.env.NODE_ENV !== "production") globalThis.redisGlobal = redis;

// Cache helper functions
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    return data ? (JSON.parse(data) as T) : null;
  } catch (err) {
    console.error(`[Redis Cache] Get Error for key ${key}:`, err);
    return null;
  }
}

export async function setCache(key: string, value: any, ttlSeconds = 3600): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (err) {
    console.error(`[Redis Cache] Set Error for key ${key}:`, err);
  }
}

export async function invalidateCache(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (err) {
    console.error(`[Redis Cache] Invalidate Error for key ${key}:`, err);
  }
}
