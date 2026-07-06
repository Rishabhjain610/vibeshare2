import { tool } from "ai";
import { z } from "zod";
import axios from "axios";
import { getCache, setCache } from "../../redis";

export const searchLatestNewsTool = tool({
  description:
    "Searches the web for latest news, topics, and trends. Only use this when the user explicitly asks about trending topics, news, or recent events - NOT for greetings or general conversation.",
  inputSchema: z.object({
    query: z.string().min(1).describe("Specific search query about a topic, trend, or news item."),
  }),
  execute: async (args: any) => {
    try {
      const query: string = args?.query || args;
      if (!query || typeof query !== "string") {
        return { error: "No search query provided." };
      }

      const cacheKey = `tavily:search:${query.replace(/\s+/g, "_").substring(0, 80)}`;
      const cached = await getCache(cacheKey);
      if (cached) return cached;

      const apiKey = process.env.TAVILY_API_KEY;
      if (!apiKey) {
        return { error: "Search API key not configured. Skipping search." };
      }

      const res = await axios.post("https://api.tavily.com/search", {
        api_key: apiKey,
        query,
        search_depth: "basic",
        include_images: false,
        max_results: 5,
      });
      const results = res.data?.results || [];
      await setCache(cacheKey, results, 1800);
      return results;
    } catch (err: any) {
      console.error("[searchLatestNews] error:", err?.message);
      return { error: `Search failed: ${err?.message || "Unknown error"}` };
    }
  },
} as any);
