import { tool, generateText } from "ai";
import { z } from "zod";
import { groqModel } from "@/lib/ai/models";

export const generateCaptionTool = tool({
  description: "Generates high-quality, creative caption options for a post on VibeShare based on a topic and tone.",
  inputSchema: z.object({
    topic: z.string().describe("Theme or content topic for the caption."),
    tone: z.enum(["professional", "funny", "engaging", "casual"]).optional().default("engaging"),
  }),
  execute: async ({ topic, tone }: { topic: string; tone: string }) => {
    try {
      const response = await generateText({
        model: groqModel,
        system: "You are an expert copywriter. Write a highly engaging, creative post caption for the social media platform VibeShare. Use formatting, line breaks, emojis, and a clear call-to-action (CTA). Keep it focused on the provided topic and match the requested tone.",
        prompt: `Write a post caption. Topic: "${topic}", Tone: "${tone}".`,
      });

      return {
        success: true,
        caption: response.text,
        topic,
        tone,
      };
    } catch (err: any) {
      console.error("[generateCaptionTool] Error:", err);
      return {
        success: false,
        error: err?.message || "Failed to generate caption",
        caption: `Here is a custom caption on "${topic}" in an ${tone} tone! #VibeShare`,
      };
    }
  },
} as any);
