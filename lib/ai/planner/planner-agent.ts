import { generateText } from "ai";
import { createOllama } from "ai-sdk-ollama";
import { createGroq } from "@ai-sdk/groq";
import { plannerSchema, PlannerResponse } from "./schemas";

const ollama = createOllama({ baseURL: process.env.OLLAMA_URL || "http://127.0.0.1:11434" });
const groq = createGroq();

export async function runPlannerAgent(
  userQuery: string,
  modelName = "minimax-m3:cloud"
): Promise<PlannerResponse> {
  try {
    const isCloudModel = modelName.endsWith(":cloud") || modelName.includes("cloud") || modelName.startsWith("groq");
    const activeModel = isCloudModel
      ? groq("qwen/qwen3.6-27b")
      : ollama(modelName);

    const response = await generateText({
      model: activeModel,
      responseFormat: {
        type: "json",
      },
      system: `You are the VibeShare Orchestration Planner. Your task is to analyze user queries and route them to the best agent.

Available Agents:
- "analytics": Handles queries about user profiles, follower count, following count, likes, engagement rate, monthly growth, post history stats, or performance charts.
- "content": Handles queries about post drafting, caption writing, generating hashtags, image creation, reel scripts, or searching trending web news.
- "both": Handles queries that require first checking database performance metrics and then writing post content based on those stats.

Few-Shot Examples:
- "how many followers do i have" -> { "agent": "analytics", "reasoning": "Requests follower count." }
- "what is my engagement rate" -> { "agent": "analytics", "reasoning": "Requests engagement rate analytics." }
- "write a post for me" -> { "agent": "content", "reasoning": "Requests copywriting content." }
- "generate hashtags for coding" -> { "agent": "content", "reasoning": "Requests hashtags generation." }
- "write a caption based on my engagement rate" -> { "agent": "both", "reasoning": "Requires database engagement stats to draft a caption." }

Response format MUST be raw JSON:
{
  "agent": "analytics" | "content" | "both",
  "reasoning": "Explanation"
}`,
      prompt: userQuery,
    } as any);

    const cleanJson = response.text.trim().replace(/^```json|```$/g, "");
    return plannerSchema.parse(JSON.parse(cleanJson));
  } catch (err) {
    console.error("Planner Agent parsing failed, defaulting to 'both':", err);
    return {
      agent: "both",
      reasoning: "Failed to parse structured JSON, falling back to full context.",
    };
  }
}
