import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";

// GET: Fetch all comments for a specific post
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;

    const comments = await prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: "asc" },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            username: true,
            imageUrl: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, comments });
  } catch (error) {
    console.error("[API_POST_COMMENTS_GET] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST: Add a new comment to a post
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate user
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = clerkUser.id;
    const { id: postId } = await params;

    // 2. Parse body
    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { error: "Comment content cannot be empty" },
        { status: 400 }
      );
    }

    // 3. Verify target post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // 4. Create comment and update counter (sequentially to respect Neon pooler)
    const newComment = await prisma.comment.create({
      data: {
        id: crypto.randomUUID(),
        content: content.trim(),
        authorId: userId,
        postId,
        updatedAt: new Date(),
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            username: true,
            imageUrl: true,
          },
        },
      },
    });

    // Increment post's comment count
    await prisma.post.update({
      where: { id: postId },
      data: {
        commentsCount: {
          increment: 1,
        },
      },
    });

    // 5. Send notification to the post creator if they aren't commenting on their own post
    if (post.authorId !== userId) {
      await prisma.notifications.create({
        data: {
          id: crypto.randomUUID(),
          creatorId: userId,
          userId: post.authorId,
          postId,
          commentId: newComment.id,
          createdAt: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true, comment: newComment });
  } catch (error) {
    console.error("[API_POST_COMMENTS_POST] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
