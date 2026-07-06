import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

function formatTime(createdAt: Date | string) {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  return new Date(createdAt).toLocaleDateString([], { month: "short", day: "numeric" });
}

export async function GET() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = clerkUser.id;

    // Fetch all messages involving the current user
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            imageUrl: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            username: true,
            imageUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Group messages by the other user to find the latest message with each user
    const conversationsMap = new Map();

    for (const msg of messages) {
      const otherUser = msg.senderId === userId ? msg.receiver : msg.sender;
      if (!otherUser) continue;

      if (!conversationsMap.has(otherUser.id)) {
        // Calculate unread count (if any)
        const unreadCount = msg.receiverId === userId && !msg.isRead ? 1 : 0;

        conversationsMap.set(otherUser.id, {
          id: otherUser.id,
          name: otherUser.name || otherUser.username,
          username: otherUser.username,
          avatarUrl: otherUser.imageUrl,
          lastMessage: msg.content,
          time: formatTime(msg.createdAt),
          unread: unreadCount,
          active: false,
          createdAt: msg.createdAt,
        });
      } else {
        // If it already exists, just add to unread if this message is unread and addressed to current user
        if (msg.receiverId === userId && !msg.isRead) {
          const existing = conversationsMap.get(otherUser.id);
          existing.unread += 1;
        }
      }
    }

    const conversations = Array.from(conversationsMap.values());

    return NextResponse.json({ success: true, conversations });
  } catch (error) {
    console.error("[API_CHAT_CONVERSATIONS_GET] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
