import { NextResponse } from "next/server"; // Next.js ke server response functions ko import kar rahe hain.
import { auth } from "@clerk/nextjs/server"; // Clerk auth import kiya user ko login status check karne ke liye.
import prisma from "@/lib/prisma"; // Database operations ke liye Prisma client client load kiya.
import redis from "@/lib/redis"; // Redis cache client load kiya.
import crypto from "crypto"; // Unique Like ID generate karne ke liye crypto module.

// POST method handler jo post like/unlike toggle handle karega.
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> } // Context params se dynamic dynamic post ID fetch karenge.
) {
  try {
    // 1. Authenticate user
    const { userId } = await auth(); // Current logged-in user ki clerk id retrieve kar rahe hain.
    if (!userId) {
      // Agar user logged in nahi hai toh 401 response denge.
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Next.js guidelines ke mutabik dynamic params ko await karte hain.
    const { id: postId } = await context.params;

    // 2. Check if the post exists
    // Database mein check karenge ki yeh post exist karta hai ya nahi.
    const postExists = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!postExists) {
      // Agar post nahi milti toh 404 response send karenge.
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // 3. Check if Like record already exists in database
    // Unique compound index (userId_postId) ke through check karenge ki is user ne is post ko pehle se like kiya hai ya nahi.
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: userId,
          postId: postId,
        },
      },
    });

    let updatedPost;

    if (existingLike) {
      // 4. Case A: User has already liked the post (Unlike flow)
      // Agar like pehle se hai toh Like record ko database se delete kar denge.
      await prisma.like.delete({
        where: {
          userId_postId: {
            userId: userId,
            postId: postId,
          },
        },
      });

      // Post model mein likesCount counter field ko 1 se decrement (-1) karenge.
      updatedPost = await prisma.post.update({
        where: { id: postId },
        data: {
          likesCount: {
            decrement: 1,
          },
        },
      });
      console.log(`[API_LIKE] User ${userId} unliked post ${postId}`);
    } else {
      // 5. Case B: User has not liked the post (Like flow)
      // Database mein Like table ke andar naya record insert karenge (commentId null rahega).
      await prisma.like.create({
        data: {
          id: crypto.randomUUID(), // Like ID ke liye unique UUID generate kiya.
          userId: userId,
          postId: postId,
        },
      });

      // Post model mein likesCount counter field ko 1 se increment (+1) karenge.
      updatedPost = await prisma.post.update({
        where: { id: postId },
        data: {
          likesCount: {
            increment: 1,
          },
        },
      });
      console.log(`[API_LIKE] User ${userId} liked post ${postId}`);
    }

    // 6. Invalidate Feed & Reels cache in Redis
    // Like update hone par feed pages ke cache ko clear kar rahe hain taki home/reels page refresh hone par sahi count dikhe.
    try {
      const keys = await redis.keys("posts:cache:*");
      if (keys.length > 0) {
        await redis.del(...keys); // Redis keys delete kar diye.
        console.log(`[API_LIKE] Invalidated ${keys.length} cache keys.`);
      }
    } catch (cacheError) {
      console.error("[API_LIKE] Cache invalidation error:", cacheError);
    }

    // Updated states return karenge (liked = true/false aur naya likes count)
    return NextResponse.json({
      liked: !existingLike, // Agar existingLike true tha toh ab false hoga, and vice-versa.
      likesCount: updatedPost.likesCount,
    });
  } catch (error: any) {
    // Agar koi failure aata hai toh console pe print karenge aur 500 error throw karenge.
    console.error("[API_LIKE] Error toggling post like:", error);
    return NextResponse.json(
      { error: error.message || "Failed to toggle like" },
      { status: 500 }
    );
  }
}
