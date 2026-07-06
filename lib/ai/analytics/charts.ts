import { tool } from "ai";
import { z } from "zod";
import prisma from "../../prisma";

export const generateChartDataTool = tool({
  description: "Formats and returns structured chart data (last 7 posts) for frontend chart rendering. ALWAYS pass the userId from your system context.",
  inputSchema: z.object({
    userId: z.string().describe("The database user ID from your system context. This is REQUIRED. Use the value provided in the system prompt."),
  }),
  execute: async ({ userId }: { userId: string }) => {
    const posts = await prisma.post.findMany({
      where: { authorId: userId, isDeleted: false },
      take: 7,
      orderBy: { createdAt: "desc" },
      select: {
        caption: true,
        likesCount: true,
        commentsCount: true,
        createdAt: true,
      },
    });

    return posts.map((p) => ({
      date: new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      caption: p.caption ? p.caption.substring(0, 20) + "..." : "No Caption",
      likes: p.likesCount,
      comments: p.commentsCount,
    }));
  },
} as any);
