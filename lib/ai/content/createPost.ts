import { tool } from "ai";
import { z } from "zod";
import prisma from "../../prisma";
import crypto from "crypto";

export const createPostTool = tool({
  description: "Publishes a new post in the database with a caption and optional media URL. ALWAYS pass the authorId from your system context.",
  inputSchema: z.object({
    authorId: z.string().describe("The database user ID from your system context. This is REQUIRED. Use the value provided in the system prompt."),
    caption: z.string().describe("The content copy or caption of the post."),
    mediaUrl: z.string().nullable().optional().describe("Optional URL to an image or video asset."),
    location: z.string().nullable().optional().describe("Optional check-in location name."),
  }),
  execute: async ({ authorId, caption, mediaUrl, location }: { authorId: string; caption: string; mediaUrl?: string; location?: string }) => {
    try {
      const newPost = await prisma.post.create({
        data: {
          id: crypto.randomUUID(),
          authorId,
          caption,
          mediaUrl: mediaUrl || null,
          location: location || null,
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        message: "Post successfully published to VibeShare.",
        postId: newPost.id,
      };
    } catch (err: any) {
      return {
        success: false,
        error: `Database insertion failed: ${err.message}`,
      };
    }
  },
} as any);
