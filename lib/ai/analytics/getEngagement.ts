import { tool } from "ai";
import { z } from "zod";
import prisma from "../../prisma";

export const getEngagementTool = tool({
  description: "Computes engagement rate based on total likes, comments, and followers count. ALWAYS pass the userId from your system context.",
  inputSchema: z.object({
    userId: z.string().describe("The database user ID from your system context. This is REQUIRED. Use the value provided in the system prompt."),
  }),
  execute: async ({ userId }: { userId: string }) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { followersCount: true },
    });

    if (!user || user.followersCount === 0) {
      return { error: "User has 0 followers, engagement rate is not applicable." };
    }

    const posts = await prisma.post.findMany({
      where: { authorId: userId, isDeleted: false },
      select: { likesCount: true, commentsCount: true },
    });

    const totalLikes = posts.reduce((sum: number, p: any) => sum + p.likesCount, 0);
    const totalComments = posts.reduce((sum: number, p: any) => sum + p.commentsCount, 0);
    const engagementScore = ((totalLikes + totalComments) / user.followersCount) * 100;

    return {
      totalPosts: posts.length,
      totalLikes,
      totalComments,
      engagementRate: `${engagementScore.toFixed(2)}%`,
    };
  },
} as any);
