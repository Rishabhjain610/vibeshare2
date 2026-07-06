import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getCache, setCache } from "@/lib/redis";

export async function GET() {
  try {
    const clerkUser = await currentUser();
    const currentUserId = clerkUser?.id;

    const cacheKey = currentUserId
      ? `users:suggestions:cache:${currentUserId}`
      : "users:suggestions:cache:guest";

    // 1. Try to fetch from Redis Cache
    const cachedSuggestions = await getCache<any[]>(cacheKey);
    if (cachedSuggestions) {
      console.log(`[API_USERS_SUGGESTIONS] Cache HIT for key: ${cacheKey}`);
      return NextResponse.json(cachedSuggestions);
    }

    console.log(`[API_USERS_SUGGESTIONS] Cache MISS for key: ${cacheKey}. Querying database...`);
    let suggestedUsers = [];

    if (currentUserId) {
      // 1. Get ids of users current user is already following
      const following = await prisma.followers.findMany({
        where: { followerId: currentUserId },
        select: { followingId: true },
      });
      const followingIds = following.map((f) => f.followingId);

      // Exclude self and already followed users
      const excludeIds = [currentUserId, ...followingIds];

      // Query suggestions
      suggestedUsers = await prisma.user.findMany({
        where: {
          id: { notIn: excludeIds },
        },
        select: {
          id: true,
          name: true,
          username: true,
          imageUrl: true,
          bio: true,
          followersCount: true,
        },
        orderBy: {
          followersCount: "desc", // suggest popular users first
        },
        take: 5,
      });
    } else {
      // Unauthenticated fallback: return most popular users
      suggestedUsers = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          username: true,
          imageUrl: true,
          bio: true,
          followersCount: true,
        },
        orderBy: {
          followersCount: "desc",
        },
        take: 5,
      });
    }

    const formattedSuggestions = suggestedUsers.map((u) => ({
      id: u.id,
      name: u.name || u.username,
      username: u.username,
      avatarUrl: u.imageUrl,
      status: u.bio ? u.bio : "Suggested for you",
      isFollowing: false, // by definition of suggestions, we aren't following them yet
    }));

    // 2. Save result in Redis Cache for 60 seconds (1 minute)
    await setCache(cacheKey, formattedSuggestions, 60);
    console.log(`[API_USERS_SUGGESTIONS] Saved suggestions to Redis cache: ${cacheKey}`);

    return NextResponse.json(formattedSuggestions);
  } catch (error) {
    console.error("[API_USERS_SUGGESTIONS] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
