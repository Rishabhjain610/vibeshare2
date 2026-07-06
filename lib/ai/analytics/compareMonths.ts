import { tool } from "ai";
import { z } from "zod";
import prisma from "../../prisma";

export const compareMonthsTool = tool({
  description: "Compares current month posting performance vs previous month. ALWAYS pass the userId from your system context.",
  inputSchema: z.object({
    userId: z.string().describe("The database user ID from your system context. This is REQUIRED. Use the value provided in the system prompt."),
  }),
  execute: async ({ userId }: { userId: string }) => {
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const currentMonthPosts = await prisma.post.count({
      where: { authorId: userId, createdAt: { gte: startOfCurrentMonth }, isDeleted: false },
    });

    const prevMonthPosts = await prisma.post.count({
      where: { authorId: userId, createdAt: { gte: startOfPrevMonth, lt: startOfCurrentMonth }, isDeleted: false },
    });

    return {
      currentMonthPostsCount: currentMonthPosts,
      previousMonthPostsCount: prevMonthPosts,
      growth: prevMonthPosts === 0 ? "100%" : `${(((currentMonthPosts - prevMonthPosts) / prevMonthPosts) * 100).toFixed(1)}%`,
    };
  },
} as any);
