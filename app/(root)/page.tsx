import React from "react";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import FeedContainer from "@/components/shared/FeedContainer";

export default async function HomeFeedPage() {
  // 1. Get logged-in user details if authenticated
  const clerkUser = await currentUser();
  let dbUser = null;

  if (clerkUser) {
    dbUser = await prisma.user.findUnique({
      where: { id: clerkUser.id },
      select: {
        name: true,
        username: true,
        imageUrl: true,
      },
    });
  }

  // 2. Fetch the initial page of posts (page=1, limit=10)
  const limit = 10;
  const initialPosts = await prisma.post.findMany({
    where: {
      isDeleted: false,
      isReported: false,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
    include: {
      User: {
        select: {
          name: true,
          username: true,
          imageUrl: true,
        },
      },
      Like: {
        select: {
          userId: true,
        },
      },
    },
  });

  const totalCount = await prisma.post.count({
    where: {
      isDeleted: false,
      isReported: false,
    },
  });

  const hasMore = initialPosts.length < totalCount;

  return (
    <FeedContainer
      initialPosts={initialPosts}
      initialHasMore={hasMore}
      dbUser={dbUser}
      clerkUserId={clerkUser?.id}
      feedType="feed"
      headerTitle="Vibe Feed"
      headerDescription="See the latest vibes and reels shared by everyone"
      emptyTitle="Feed is Empty"
      emptyDescription="No one has posted any vibes yet. Be the first one to share a vibe by clicking the post button!"
    />
  );
}