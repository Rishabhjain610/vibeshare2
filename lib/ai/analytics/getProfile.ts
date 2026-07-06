import { tool } from "ai";
import { z } from "zod";
import prisma from "../../prisma";
import { getCache, setCache } from "../../redis";

export const getProfileTool = tool({
  description: "Fetches user profile details, total followers, following count, bio, and post stats. ALWAYS pass the userId from your system context.",
  inputSchema: z.object({
    userId: z.string().describe("The database user ID from your system context. This is REQUIRED. Use the value provided in the system prompt."),
  }),
  execute: async ({ userId }: { userId: string }) => {
    const cacheKey = `user:profile:${userId}`;
    const cachedData = await getCache<any>(cacheKey);
    if (cachedData) return cachedData;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        followersCount: true,
        followingCount: true,
        postsCount: true,
        imageUrl: true,
      },
    });

    if (!user) return { error: "User not found." };
    await setCache(cacheKey, user, 600);
    return user;
  },
} as any);
