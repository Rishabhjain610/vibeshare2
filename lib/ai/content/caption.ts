import { tool } from "ai";
import { z } from "zod";

export const generateCaptionTool = tool({
  description: "Formats post description templates for captions.",
  inputSchema: z.object({
    topic: z.string().describe("Theme or content topic."),
    tone: z.enum(["professional", "funny", "engaging", "casual"]).optional().default("engaging"),
  }),
  execute: async ({ topic, tone }:{topic:string, tone:string}) => {
    return {
      topic,
      tone,
      formatOptions: {
        lineSpacing: "readable",
        emojiLevel: "high",
        ctaNeeded: true,
      },
    };
  },
} as any);
