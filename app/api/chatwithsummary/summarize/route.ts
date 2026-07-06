import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import axios from "axios";
import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";

const groq = createGroq();
const groqModel = groq("qwen/qwen3.6-27b");


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

    // 5. Query local Ollama service
    // We send a request to Ollama's local generation API.
    // We try to request 'llama3' or fallback models if there's any mismatch.
    const systemPrompt = `You are a helpful chat assistant. Below is a direct chat transcript between two users. 
Provide a clear, brief bulleted summary of this conversation. Highlight key topics discussed, agreements made, or action items.
Keep it concise and structured using Markdown.

Transcript:
${transcript}

Summary:`;

    try {
      // 1. Try Groq cloud model first for instant response
      const groqResponse = await generateText({
        model: groqModel,
        system: "You are a helpful chat assistant. Below is a direct chat transcript between two users. Provide a clear, brief bulleted summary of this conversation. Highlight key topics discussed, agreements made, or action items. Keep it concise and structured using Markdown.",
        prompt: `Transcript:\n${transcript}\n\nSummary:`,
      });

      return NextResponse.json({
        success: true,
        summary: groqResponse.text,
      });
    } catch (groqError: any) {
      console.warn("[API_CHAT_SUMMARIZE] Groq cloud summary failed, falling back to local Ollama:", groqError.message);
      
      const ollamaUrl = "http://127.0.0.1:11434/api/generate";
      try {
        const ollamaResponse = await axios.post(
          ollamaUrl,
          {
            model: "minimax-m3:cloud",
            prompt: systemPrompt,
            stream: false,
          },
          {
            timeout: 10000, // 10 second timeout for fallback
          }
        );

        return NextResponse.json({
          success: true,
          summary: ollamaResponse.data.response,
        });
      } catch (ollamaError: any) {
        console.warn("[API_CHAT_SUMMARIZE] Ollama qwen3.5:4b request failed:", ollamaError.message);
        
        // Attempt fallback with generic qwen
        try {
          const fallbackResponse = await axios.post(
            ollamaUrl,
            {
              model: "qwen",
              prompt: systemPrompt,
              stream: false,
            },
            {
              timeout: 10000,
            }
          );
          return NextResponse.json({
            success: true,
            summary: fallbackResponse.data.response,
          });
        } catch (fallbackError: any) {
          console.error("[API_CHAT_SUMMARIZE] Both Groq and Ollama failed:", fallbackError.message);
          return NextResponse.json(
            {
              error: "Unable to generate summary at this time.",
            },
            { status: 503 }
          );
        }
      }
    }
  } catch (error) {
    console.error("[API_CHAT_SUMMARIZE] Main error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
