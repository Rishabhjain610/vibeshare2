import { tool } from "ai";
import { z } from "zod";

export const generateHashtagsTool = tool({
  description: "Provides sets of popular hashtags for specific social media domains.",
  inputSchema: z.object({
    topic: z.string().describe("Topic keyword for hashtags."),
    platform: z.enum(["instagram", "linkedin", "twitter"]).optional().default("instagram"),
  }),
  execute: async ({ topic, platform }: { topic: string, platform: string }) => {
    const base = topic.toLowerCase().replace(/\s+/g, "");
    if (platform === "linkedin") {
      return [`#${base}`, `#${base}insights`, `#business`, `#strategy`, `#networking`];
    }
    return [`#${base}`, `#instadaily`, `#explorepage`, `#vibe`, `#trending`];
  },
} as any);
