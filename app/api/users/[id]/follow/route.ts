import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { invalidateCache } from "@/lib/redis";

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
    const followerId = clerkUser.id;
    const { id: followingId } = await params;

    if (followerId === followingId) {
      return NextResponse.json(
        { error: "You cannot follow yourself" },
        { status: 400 }
      );
    }

    // 2. Verify target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: followingId },
    });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 3. Check if already following
    const existingFollow = await prisma.followers.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    let isFollowing = false;

    // Use sequential updates rather than transactions to comply with Neon PgBouncer constraints
    if (existingFollow) {
      // Unfollow flow
      await prisma.followers.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });

      // Update followingCount for current user
      await prisma.user.update({
        where: { id: followerId },
        data: { followingCount: { decrement: 1 } },
      });

      // Update followersCount for target user
      await prisma.user.update({
        where: { id: followingId },
        data: { followersCount: { decrement: 1 } },
      });

      isFollowing = false;
    } else {
      // Follow flow
      await prisma.followers.create({
        data: {
          id: crypto.randomUUID(),
          followerId,
          followingId,
        },
      });

      // Update followingCount for current user
      await prisma.user.update({
        where: { id: followerId },
        data: { followingCount: { increment: 1 } },
      });

      // Update followersCount for target user
      await prisma.user.update({
        where: { id: followingId },
        data: { followersCount: { increment: 1 } },
      });

      // Create follow notification
      await prisma.notifications.create({
        data: {
          id: crypto.randomUUID(),
          creatorId: followerId, // who initiated the action
          userId: followingId,  // who receives it
          createdAt: new Date(),
        },
      });

      isFollowing = true;
    }

    // Get fresh counts to return
    const updatedTarget = await prisma.user.findUnique({
      where: { id: followingId },
      select: { followersCount: true },
    });

    // Invalidate follow suggestions cache for the follower in Redis
    await invalidateCache(`users:suggestions:cache:${followerId}`);

    return NextResponse.json({
      success: true,
      following: isFollowing,
      followersCount: updatedTarget?.followersCount ?? 0,
    });
  } catch (error) {
    console.error("[API_USER_FOLLOW] Error toggling follow:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
