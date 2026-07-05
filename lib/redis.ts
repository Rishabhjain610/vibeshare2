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
