import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { invalidateProfileCache } from "@/lib/profile-service";

export async function POST(request: Request) {
  try {
    // 1. Authenticate user
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = clerkUser.id;
    const email = clerkUser.emailAddresses[0]?.emailAddress;
    if (!email) {
      return NextResponse.json(
        { error: "Clerk user has no email address" },
        { status: 400 }
      );
    }

    // 2. Parse request body
    const body = await request.json();
    const { name, username, bio, profilePhoto, location, website } = body;

    if (!username || !name) {
      return NextResponse.json(
        { error: "Username and Name are required" },
        { status: 400 }
      );
    }

    const cleanUsername = username.toLowerCase().trim();
    const cleanName = name.trim();
    const cleanBio = (bio || "").trim();
    const imageUrl = profilePhoto || "";
    const cleanLocation = (location || "").trim();
    const cleanWebsite = (website || "").trim();

    // 3. Check username collision
    const existingUser = await prisma.user.findUnique({
      where: { username: cleanUsername },
    });

    if (existingUser && existingUser.id !== userId) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 409 }
      );
    }

    // 4. Get current user's profile to invalidate old username cache if it changes
    const currentRecord = await prisma.user.findUnique({
      where: { id: userId },
    });
    const oldUsername = currentRecord?.username;

    // 5. Upsert in database
    const updatedUser = await prisma.user.upsert({
      where: { id: userId },
      update: {
        username: cleanUsername,
        name: cleanName,
        bio: cleanBio,
        imageUrl,
        location: cleanLocation,
        website: cleanWebsite,
        updatedAt: new Date(),
      },
      create: {
        id: userId,
        clerkId: userId,
        email,
        username: cleanUsername,
        name: cleanName,
        bio: cleanBio,
        imageUrl,
        location: cleanLocation,
        website: cleanWebsite,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // 6. Invalidate caches in Redis
    await invalidateProfileCache(cleanUsername);
    if (oldUsername && oldUsername !== cleanUsername) {
      await invalidateProfileCache(oldUsername);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        name: updatedUser.name,
      },
    });
  } catch (error) {
    console.error("[API_PROFILE_POST] Error updating profile:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
