import { tool } from "ai";
import { z } from "zod";
import axios from "axios";

export const findImagesTool = tool({
  description: "Searches for public, high-quality images on Unsplash by keyword.",
  inputSchema: z.object({
    keyword: z.string().describe("Keyword search term (e.g. tech, nature)."),
  }),
  execute: async ({ keyword }: { keyword: string }) => {
    const clientID = process.env.UNSPLASH_ACCESS_KEY;
    if (!clientID) {
      return { error: "Unsplash Client ID key is missing." };
    }

    try {
      const res = await axios.get("https://api.unsplash.com/search/photos", {
        params: { query: keyword, per_page: 3 },
        headers: { Authorization: `Client-ID ${clientID}` },
      });
      return (res.data?.results || []).map((photo: any) => ({
        url: photo.urls?.regular,
        description: photo.alt_description,
        author: photo.user?.name,
      }));
    } catch (err: any) {
      return { error: `Unsplash search failed: ${err?.message}` };
    }
  },
} as any);
