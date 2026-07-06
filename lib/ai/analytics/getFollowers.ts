import { tool } from "ai";
import { z } from "zod";
import prisma from "../../prisma";

export const getFollowersTool = tool({
  description: "Lists follower names, IDs, and usernames for a user. ALWAYS pass the userId from your system context.",
  inputSchema: z.object({
    userId: z.string().describe("The database user ID from your system context. This is REQUIRED. Use the value provided in the system prompt."),
  }),
  execute: async ({ userId }: { userId: string }) => {
    const followers = await prisma.followers.findMany({
      where: { followingId: userId },
      take: 20,
      include: {
        User_Followers_followerIdToUser: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });
    const followerList = followers.map((f: any) => f.User_Followers_followerIdToUser);
    return {
      totalFollowers: followerList.length,
      followers: followerList,
    };
  },
} as any);
