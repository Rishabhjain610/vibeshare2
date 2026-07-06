import { tool } from "ai";
import { z } from "zod";
import prisma from "../../prisma";

export const getPostsTool = tool({
  description: "Fetches lists of posts by the user with likes and comments stats. ALWAYS pass the userId from your system context.",
  inputSchema: z.object({
    userId: z.string().describe("The database user ID from your system context. This is REQUIRED. Use the value provided in the system prompt."),
    limit: z.number().optional().default(5),
  }),
  execute: async ({ userId, limit }: { userId: string; limit: number }) => {
    const posts = await prisma.post.findMany({
      where: { authorId: userId, isDeleted: false },
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        caption: true,
        likesCount: true,
        commentsCount: true,
        createdAt: true,
      },
    });
    return posts.map((post) => ({
      ...post,
      createdAt: post.createdAt.toISOString(),
    }));
  },
} as any);
