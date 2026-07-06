import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// 📈 Connection Pool Configuration
// Set explicit connection pool limit (max: 10) and query timeout (5000ms)
// to prevent thread starvation/locking in postgres connection pool under heavy write load.
const pgPool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,                        // Enforce a strict connection limit per server instance
  connectionTimeoutMillis: 5000,  // Fail/Timeout fast on connection freeze instead of blocking the event loop
  idleTimeoutMillis: 10000,       // Close idle connections after 10 seconds to release resources
});

const prismaClientSingleton = () => {
  const adapter = new PrismaPg(pgPool);
  return new PrismaClient({ adapter });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

// Always store on globalThis to enforce a strict singleton pattern, 
// even in production environments across route bundles.
globalThis.prismaGlobal = prisma;
