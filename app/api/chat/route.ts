import { streamText, isStepCount } from "ai";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { runPlannerAgent } from "@/lib/ai/planner/planner-agent";
import { getAnalyticsAgent } from "@/lib/ai/agents/analytics/agent";
import { getContentAgent } from "@/lib/ai/agents/content/agent";
import { groqModel } from "@/lib/ai/models";

/** Convert AI SDK v7 UIMessages → simple {role, content} for Groq */
function toGroqMessages(messages: any[]): { role: "user" | "assistant" | "system"; content: string }[] {
  const parsed = messages
    .filter((m: any) => m.role === "user" || m.role === "assistant")
    .map((m: any) => {
      let content = "";
      if (typeof m.content === "string") {
        content = m.content;
      } else if (Array.isArray(m.parts)) {
        content = m.parts
          .filter((p: any) => p.type === "text")
          .map((p: any) => p.text || "")
          .join("");
      } else if (Array.isArray(m.content)) {
        content = m.content
          .filter((p: any) => p.type === "text")
          .map((p: any) => p.text || "")
          .join("");
      }
      return { role: m.role as "user" | "assistant", content };
    })
    .filter((m) => m.content.trim().length > 0);

  // Keep only the last 6 messages to stay within Groq's strict 8,000 tokens-per-minute (TPM) limit
  return parsed.slice(-6);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, model } = body;

    console.log("[chat route] received messages count:", messages?.length);
    console.log("[chat route] last message:", JSON.stringify(messages?.[messages.length - 1])?.substring(0, 200));

    // Ollama model is kept for the planner only (lightweight routing task)
    const plannerModel = model || "minimax-m3:cloud";

    // Fetch Clerk Auth state or use test override and match Database user record
    let clerkId: string | null = null;
    if (process.env.TEST_USER_ID) {
      clerkId = process.env.TEST_USER_ID;
      console.log("[chat route] TEST_USER_ID override detected:", clerkId);
    } else {
      const authResult = await auth();
      clerkId = authResult.userId;
    }
    let dbUser: { id: string; name: string | null; username: string | null } | undefined = undefined;

    if (clerkId) {
      const userRecord = await prisma.user.findUnique({
        where: { clerkId },
        select: { id: true, name: true, username: true },
      });
      if (userRecord) {
        dbUser = userRecord;
      }
    }

    // Extract the last user message text
    const lastMsg = messages?.[messages.length - 1];
    let lastMessageText = "";
    if (lastMsg) {
      if (typeof lastMsg.content === "string" && lastMsg.content) {
        lastMessageText = lastMsg.content;
      } else if (Array.isArray(lastMsg.parts)) {
        lastMessageText = lastMsg.parts
          .filter((p: any) => p.type === "text")
          .map((p: any) => p.text || "")
          .join(" ")
          .trim();
      }
    }

    console.log("[chat route] lastMessageText:", lastMessageText);

    if (!lastMessageText) {
      // No message content at all — return a simple response
      const result = streamText({ model: groqModel, prompt: "Say hello" });
      return result.toUIMessageStreamResponse();
    }

    // Planner uses Ollama — simple routing task, no tools needed
    const plan = await runPlannerAgent(lastMessageText, plannerModel, messages);
    console.log("[chat route] planner decision:", plan.agent, "|", plan.reasoning.substring(0, 80));

    // Convert messages to simple format for Groq
    const groqMessages = toGroqMessages(messages);
    console.log("[chat route] groqMessages count:", groqMessages.length);

    // Route to Groq-powered agents for tool calling
    if (plan.agent === "analytics") {
      const agent = getAnalyticsAgent(dbUser);
      const result = streamText({
        model: agent.model,
        system: agent.system,
        messages: groqMessages,
        tools: agent.tools,
        stopWhen: isStepCount(5),
      } as any);
      return result.toUIMessageStreamResponse();
    }

    if (plan.agent === "content") {
      const agent = getContentAgent(dbUser);
      const result = streamText({
        model: agent.model,
        system: agent.system,
        messages: groqMessages,
        tools: agent.tools,
        stopWhen: isStepCount(5),
      } as any);
      return result.toUIMessageStreamResponse();
    }

    // "both" — all tools combined
    const analyticsAgent = getAnalyticsAgent(dbUser);
    const contentAgent = getContentAgent(dbUser);

    const combinedSystemPrompt = `You are the VibeShare AI Copilot combining database analytics and creative content strategy.

CRITICAL INSTRUCTION - READ CAREFULLY:
The currently logged-in user is:
  - userId: "${dbUser?.id || "unknown"}"
  - name: "${dbUser?.name || ""}"
  - username: "${dbUser?.username || ""}"

YOU MUST ALWAYS pass userId="${dbUser?.id}" to EVERY analytics tool call. Never omit it.

Rules:
1. Always pass userId to analytics tools - NEVER leave it empty.
2. Base analytics replies strictly on tool data. Never invent numbers.
3. ALWAYS display and summarize ALL metrics returned by any tool (e.g., Name, Username, Followers, Following, Post Count, Bio). Never just list the ID.
4. When you call an image tool (generateAIImage or findImages) and it returns an image URL, you MUST ALWAYS embed it in your markdown response on its own line using standard markdown syntax: \`![Image Description](image_url)\`. Never omit it.
5. Format output professionally using markdown lists, bold headers, and clean spacing.
6. If the user asks to generate, write, or draft a post for LinkedIn, Twitter, Instagram, Facebook, or any platform other than VibeShare, you MUST decline and state: "I can generate posts only for VibeShare."
7. YOU MUST NEVER automatically publish a post using the createPost tool without asking. First, draft the post (caption, mediaUrl, and location) and present it to the user. Ask: "Would you like me to publish this post?". Only call the createPost tool after the user explicitly confirms (e.g., "yes", "publish", "go ahead").
8. When a user asks to generate or draft a post, you MUST ask them: "Would you like to include an image in this post?". Only search for or generate an image if they say yes. If they say no, draft a text-only post. Do not assume or generate an image without asking.
9. If the user wants to include an image, you MUST first search for a real image using findImages. Only if no matching or relevant images are found (or if the user explicitly requests AI art) should you call generateAIImage to create one. Always prioritize searching over generating.`;

    const result = streamText({
      model: groqModel,
      system: combinedSystemPrompt,
      messages: groqMessages,
      tools: {
        ...analyticsAgent.tools,
        ...contentAgent.tools,
      },
      stopWhen: isStepCount(7),
    } as any);

    return result.toUIMessageStreamResponse();
  } catch (err: any) {
    console.error("/api/chat route failure:", err?.stack ?? err);
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
