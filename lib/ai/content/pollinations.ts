import { tool } from "ai";
import { z } from "zod";

export const generateAIImageTool = tool({
  description: "Generates high quality art/illustrations using Pollinations AI based on prompt text.",
  inputSchema: z.object({
    prompt: z.string().describe("Detailed description of the image to generate."),
  }),
  execute: async ({ prompt }:{prompt:string}) => {
    const encoded = encodeURIComponent(prompt);
    // Pollinations AI uses direct URL paths for image generation
    const imageUrl = `https://image.pollinations.ai/p/${encoded}?width=1024&height=1024&nologo=true`;
    return {
      url: imageUrl,
      prompt,
      engine: "Pollinations AI",
    };
  },
} as any);
