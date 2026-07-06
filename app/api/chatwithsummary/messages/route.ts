import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";

// GET: Fetch all messages between current user and recipient
export async function GET(request: Request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = clerkUser.id;

    // Get recipientId from URL query parameters
    const { searchParams } = new URL(request.url);
    const recipientId = searchParams.get("recipientId");

    if (!recipientId) {
      return NextResponse.json(
        { error: "Recipient ID is required" },
        { status: 400 }
      );
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: recipientId },
          { senderId: recipientId, receiverId: userId },
        ],
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error("[API_CHAT_MESSAGES_GET] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST: Send a new message
export async function POST(request: Request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const senderId = clerkUser.id;

    const body = await request.json();
    const { recipientId, content } = body;

    if (!recipientId || !content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { error: "Recipient ID and message content are required" },
        { status: 400 }
      );
    }

    // Verify recipient exists in database
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
    });
    if (!recipient) {
      return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
    }

    const message = await prisma.message.create({
      data: {
        id: crypto.randomUUID(),
        senderId,
        receiverId: recipientId,
        content: content.trim(),
        createdAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error("[API_CHAT_MESSAGES_POST] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
