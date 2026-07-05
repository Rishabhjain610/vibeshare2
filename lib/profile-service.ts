import prisma from "./prisma";
import redis from "./redis";

export interface ProfileWithPosts {
  id: string;
  email: string;
  username: string;
  clerkId: string;
  name: string | null;
  bio: string | null;
  imageUrl: string | null;
  location: string | null;
  website: string | null;
  lastLoginAt: Date | null;
  lastActiveAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  likesReceived: number;
  role: string;
  Post: Array<{
    id: string;
    caption: string | null;
    mediaUrl: string | null;
    authorId: string;
    createdAt: Date;
    updatedAt: Date;
    location: string | null;
    isPinned: boolean;
    likesCount: number;
    commentsCount: number;
    isReported: boolean;
    isDeleted: boolean;
    deletedAt: Date | null;
    reportsInt: number;
  }>;
}

/**
 * Gets a user profile by username. Uses Redis cache-aside pattern.
 * @param username The username to fetch.
 */
export async function getProfileByUsername(username: string): Promise<ProfileWithPosts | null> {
  const normalizedUsername = username.toLowerCase();
  const cacheKey = `user:profile:${normalizedUsername}`;

  try {
    // 1. Try to fetch from Redis cache
    const cachedProfile = await redis.get(cacheKey);
    if (cachedProfile) {
      console.log(`[ProfileService] Cache HIT for ${normalizedUsername}`);
      // Parse the JSON. Dates will be parsed as strings, so we need to make sure the caller expects string or we convert them.
      // To be safe, we parse it directly. Next.js handles Date strings inside client/server component serialization nicely.
      return JSON.parse(cachedProfile) as ProfileWithPosts;
    }
  } catch (error) {
    console.error(`[ProfileService] Redis error during cache fetch:`, error);
  }

  // 2. Cache miss: Fetch from PostgreSQL via Prisma
  console.log(`[ProfileService] Cache MISS for ${normalizedUsername}. Querying database...`);
  try {
    const user = await prisma.user.findUnique({
      where: { username: normalizedUsername },
      include: {
        Post: {
          where: { isDeleted: false },
          orderBy: { createdAt: "desc" },
          take: 12,
        },
      },
    });

    if (!user) {
      return null;
    }

    // 3. Store in Redis cache (60 seconds TTL for dynamic sync, can be adjusted)
    try {
      await redis.set(
        cacheKey,
        JSON.stringify(user),
        "EX",
        60
      );
      console.log(`[ProfileService] Cached profile for ${normalizedUsername}`);
    } catch (cacheError) {
      console.error(`[ProfileService] Redis error during cache store:`, cacheError);
    }

    return user as unknown as ProfileWithPosts;
  } catch (dbError) {
    console.error(`[ProfileService] Database error:`, dbError);
    throw dbError;
  }
}

/**
 * Invalidates the Redis cache for a user profile.
 * @param username The username of the profile to invalidate.
 */
export async function invalidateProfileCache(username: string): Promise<void> {
  const normalizedUsername = username.toLowerCase();
  const cacheKey = `user:profile:${normalizedUsername}`;
  try {
    await redis.del(cacheKey);
    console.log(`[ProfileService] Invalidated cache for ${normalizedUsername}`);
  } catch (error) {
    console.error(`[ProfileService] Redis error during cache invalidation:`, error);
  }
}
