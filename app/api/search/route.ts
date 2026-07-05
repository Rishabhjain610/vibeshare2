import { NextResponse } from "next/server"; // Next.js server response helpers ko import kar rahe hain.
import prisma from "@/lib/prisma"; // PostgreSQL se interact karne ke liye Prisma client import kiya.
import redis from "@/lib/redis"; // Redis memory cache use karne ke liye.

// GET request handler jo explore page ke query data ko search karega
export async function GET(request: Request) {
  try {
    // 1. Request URL se Search Query parse karenge
    const { searchParams } = new URL(request.url); // Request URL path details parse kiya.
    const query = searchParams.get("q")?.trim() || ""; // Parameter 'q' (search text) get kiya aur spaces trim kiye.

    // Best Practice: Agar query empty hai ya sirf 1 character ki hai, toh heavy DB queries chalane ki koi zaroori nahi hai.
    // Direct empty arrays return kar denge client load bachane ke liye.
    if (query.length < 2) {
      return NextResponse.json({ users: [], posts: [] }, { status: 200 });
    }

    const cacheKey = `search:cache:${query.toLowerCase()}`; // Unique cache key generate kiya lower-case query ke basis par.

    // 2. Try to fetch search results from Redis Cache
    try {
      const cachedData = await redis.get(cacheKey); // Redis check kiya.
      if (cachedData) {
        console.log(`[API_SEARCH] Cache HIT for query: "${query}"`);
        return NextResponse.json(JSON.parse(cachedData), { status: 200 }); // Cached data mil gaya toh direct return kiya.
      }
    } catch (cacheError) {
      console.error("[API_SEARCH] Redis cache read error:", cacheError);
    }

    console.log(`[API_SEARCH] Cache MISS for query: "${query}". Database read starting...`);

    // 3. Parallel Database Queries Execution (Best Practice)
    // Promise.all ke through hum dono (Users aur Posts) queries ko database par concurrently (parallaly) run kar rahe hain,
    // jo sequential await ke mukable load-time aadha kar deta hai.
    const [users, posts] = await Promise.all([
      // Query A: Users search
      prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } }, // Name matching check (case-insensitive LIKE)
            { username: { contains: query, mode: "insensitive" } }, // Username matching check (case-insensitive LIKE)
          ],
        },
        select: {
          id: true,
          name: true,
          username: true,
          imageUrl: true,
          bio: true,
          postsCount: true,
        },
        take: 10, // Maximum 10 user results return karenge.
      }),

      // Query B: Posts aur Tags search
      prisma.post.findMany({
        where: {
          isDeleted: false,
          isReported: false,
          OR: [
            { caption: { contains: query, mode: "insensitive" } }, // Caption text ke andar search query match karna
            { location: { contains: query, mode: "insensitive" } }, // Location matching check
            {
              Tag: {
                some: {
                  name: { contains: query, mode: "insensitive" }, // Hashtags database table ke andar match karna
                },
              },
            },
          ],
        },
        orderBy: {
          createdAt: "desc", // Latest posts ko sabse upar order karenge.
        },
        include: {
          User: { // Post author avatar details get karne ke liye join
            select: {
              name: true,
              username: true,
              imageUrl: true,
            },
          },
          Like: { // Current user check ke liye likes get join
            select: {
              userId: true,
            },
          },
        },
        take: 10, // Maximum 10 post results return karenge.
      }),
    ]);

    const result = { users, posts };

    // 4. Store results in Redis Cache with 10 seconds TTL
    // 10 seconds cache se popular keywords search spamming par database lock hone se bachega.
    try {
      await redis.set(cacheKey, JSON.stringify(result), "EX", 10);
      console.log(`[API_SEARCH] Saved query results to Redis for key: ${cacheKey}`);
    } catch (cacheError) {
      console.error("[API_SEARCH] Redis cache write error:", cacheError);
    }

    return NextResponse.json(result, { status: 200 }); // final search output return kiya.
  } catch (error: any) {
    console.error("[API_SEARCH] Database search error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute search" },
      { status: 500 }
    );
  }
}
