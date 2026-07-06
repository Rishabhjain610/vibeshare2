import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { generateText } from "ai";
import { groqModel } from "@/lib/ai/models";


export async function POST(request: Request) {
  try {
    // 1. Authenticate the user
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const currentUserId = clerkUser.id;

    // 2. Parse request body
    const body = await request.json();
    const { recipientId } = body;

    if (!recipientId) {
      return NextResponse.json(
        { error: "Recipient ID is required" },
        { status: 400 }
      );
    }

    // Fetch user details for both profiles to display usernames in the transcript
    const [currentUserRecord, recipientUserRecord] = await Promise.all([
      prisma.user.findUnique({
        where: { id: currentUserId },
        select: { username: true, name: true },
      }),
      prisma.user.findUnique({
        where: { id: recipientId },
        select: { username: true, name: true },
      }),
    ]);

    if (!currentUserRecord || !recipientUserRecord) {
      return NextResponse.json({ error: "Users not found" }, { status: 404 });
    }

    // 3. Fetch the last 50 messages of the conversation
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: recipientId },
          { senderId: recipientId, receiverId: currentUserId },
        ],
      },
      orderBy: {
        createdAt: "desc", // fetch latest first
      },
      take: 50,
    });

    if (messages.length === 0) {
      return NextResponse.json({
        success: true,
        summary: "No conversation history found to summarize yet. Send some messages first!",
      });
    }

    // Reverse to chronological order for the AI model
    const chronologicalMessages = [...messages].reverse();

    // 4. Format messages into a text transcript
    const usernameMap: Record<string, string> = {
      [currentUserId]: currentUserRecord.name || currentUserRecord.username,
      [recipientId]: recipientUserRecord.name || recipientUserRecord.username,
    };

    const transcript = chronologicalMessages
      .map((m) => `${usernameMap[m.senderId] || "User"}: ${m.content}`)
      .join("\n");

    // 5. Query cloud model service
    const systemPrompt = `You are a helpful chat assistant. Below is a direct chat transcript between two users. 
Provide a clear, brief bulleted summary of this conversation. Highlight key topics discussed, agreements made, or action items.
Keep it concise and structured using Markdown.

Transcript:
${transcript}

Summary:`;

    try {
      console.log("[API_CHAT_SUMMARIZE] Requesting summary using cloud Groq/Qwen model...");
      const response = await generateText({
        model: groqModel,
        prompt: systemPrompt,
      });

      // Strip <think>...</think> tags if present in the model's output
      const cleanSummary = response.text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

      return NextResponse.json({
        success: true,
        summary: cleanSummary,
      });
    } catch (groqError: any) {
      console.error("[API_CHAT_SUMMARIZE] Cloud summary request failed:", groqError.message);
      return NextResponse.json(
        { error: "Unable to generate summary at this time using Cloud AI." },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error("[API_CHAT_SUMMARIZE] Main error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
