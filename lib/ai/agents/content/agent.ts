import { createGroq } from "@ai-sdk/groq";
import { searchLatestNewsTool } from "../../content/tavily";
import { findImagesTool } from "../../content/unsplash";
import { generateAIImageTool } from "../../content/pollinations";
import { generateCaptionTool } from "../../content/caption";
import { generateHashtagsTool } from "../../content/hastags";
import { createPostTool } from "../../content/createPost";

// Groq — fastest free cloud inference, excellent tool calling
const groq = createGroq();
const groqModel = groq("qwen/qwen3.6-27b");

export const contentAgentTools = {
  searchLatestNews: searchLatestNewsTool,
  findImages: findImagesTool,
  generateAIImage: generateAIImageTool,
  generateCaption: generateCaptionTool,
  generateHashtags: generateHashtagsTool,
  createPost: createPostTool,
};

export function getContentAgent(
  currentUser?: { id: string; name?: string | null; username?: string | null }
) {
  const userContext = currentUser
    ? `\nActive Logged-in User Context:\n- Database User ID: "${currentUser.id}"\n- Name: "${currentUser.name || ""}"\n- Username: "${currentUser.username || ""}"\n\nUse this Database User ID for tool parameters requiring 'authorId' or 'userId' without asking the user.`
    : "\nNo active logged-in user context available. Ask the user for their user ID if publishing or saving items.";

  return {
    model: groqModel,
    system: `You are the VibeShare Content Strategist — a friendly, creative AI assistant.
${userContext}

IMPORTANT RULES:
- For simple greetings ("hi", "hello", "hey", etc.) or general conversation: respond directly in plain text WITHOUT calling any tools. Just say hello back warmly.
- Only use tools when the user EXPLICITLY asks for: trending news, image search, caption generation, hashtag suggestions, or creating/publishing a post.
- Never call searchLatestNews just because someone said "hi" or asked a general question.

When tools ARE needed:
1. Use your search tools to look up trending items and current news on the web.
2. Structure generated copy using emojis, clean paragraph layouts, and clear CTA lines.
3. Use the user's profile stats (if provided) to personalize hashtags and topics.
4. When you call an image tool (generateAIImage or findImages) and it returns an image URL, you MUST ALWAYS embed it in your markdown response on its own line using standard markdown syntax: \`![Image Description](image_url)\`. Never omit it.`,
    tools: contentAgentTools,
  };
}
