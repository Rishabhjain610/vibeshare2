import { tool } from "ai";
import { z } from "zod";
import { getProfileTool } from "../../analytics/getProfile";
import { getPostsTool } from "../../analytics/getPosts";
import { getFollowersTool } from "../../analytics/getFollowers";
import { getEngagementTool } from "../../analytics/getEngagement";
import { compareMonthsTool } from "../../analytics/compareMonths";
import { generateChartDataTool } from "../../analytics/charts";
import { groqModel } from "@/lib/ai/models";

export const analyticsAgentTools = {
  getProfile: getProfileTool,
  getPosts: getPostsTool,
  getFollowers: getFollowersTool,
  getEngagement: getEngagementTool,
  compareMonths: compareMonthsTool,
  generateChartData: generateChartDataTool,
};

// Helper to bind the userId to the tool's execute function so it is foolproof even if Llama sends empty/null parameters
function bindToolUserId(originalTool: any, fallbackUserId: string) {
  const originalShape = originalTool.inputSchema?.shape || {};
  const mergedSchema = z.object({
    ...originalShape,
    userId: z.string().nullable().optional().describe("User ID. Optional - defaults to current logged in user.")
  });

  return tool({
    description: originalTool.description,
    inputSchema: mergedSchema,
    execute: async (args: any) => {
      const userId = args?.userId || fallbackUserId;
      return originalTool.execute({ ...args, userId });
    }
  } as any);
}

export function getAnalyticsAgent(
  currentUser?: { id: string; name?: string | null; username?: string | null }
) {
  if (!currentUser) {
    return {
      model: groqModel,
      system: `You are the VibeShare Analytics Expert. No user is currently logged in. Politely tell the user to log in first before you can show their analytics.`,
      tools: analyticsAgentTools,
    };
  }

  // Create bound tools that automatically inject the current user's ID if omitted/null
  const boundTools = {
    getProfile: bindToolUserId(getProfileTool, currentUser.id),
    getPosts: bindToolUserId(getPostsTool, currentUser.id),
    getFollowers: bindToolUserId(getFollowersTool, currentUser.id),
    getEngagement: bindToolUserId(getEngagementTool, currentUser.id),
    compareMonths: bindToolUserId(compareMonthsTool, currentUser.id),
    generateChartData: bindToolUserId(generateChartDataTool, currentUser.id),
  };

  return {
    model: groqModel,
    system: `You are the VibeShare Analytics Expert. You query live PostgreSQL database data to answer questions.

CRITICAL INSTRUCTION - READ CAREFULLY:
The currently logged-in user is:
  - userId: "${currentUser.id}"
  - name: "${currentUser.name || ""}"
  - username: "${currentUser.username || ""}"

YOU MUST ALWAYS pass userId="${currentUser.id}" to EVERY tool call. Never omit it. Never ask the user for their ID.

When the user asks:
- "how many followers" → call getFollowers tool with userId="${currentUser.id}"
- "my profile" or "my stats" → call getProfile tool with userId="${currentUser.id}"
- "my posts" or "my likes" → call getPosts tool with userId="${currentUser.id}"
- "engagement rate" → call getEngagement tool with userId="${currentUser.id}"
- "monthly growth" → call compareMonths tool with userId="${currentUser.id}"
- "show chart" → call generateChartData tool with userId="${currentUser.id}"

Rules:
1. Always pass userId to tools - NEVER leave it empty.
2. Base replies strictly on data returned by tools. Never invent numbers.
3. ALWAYS display and summarize ALL metrics returned by the tool (e.g., Name, Username, Followers, Following, Post Count, Bio). Never just list the ID.
4. Format output professionally using markdown lists, bold headers, and clean spacing.`,
    tools: boundTools,
  };
}
