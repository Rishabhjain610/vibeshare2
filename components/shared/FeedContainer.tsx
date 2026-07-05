"use client";

import React, { useState } from "react";
import axios from "axios";
import { Loader2, Plus } from "lucide-react";
import PostCard from "@/components/cards/PostCard";
import FeedReelCard from "@/components/cards/FeedReelCard";
import QuickPost from "@/components/shared/QuickPost";
import { Rss } from "lucide-react";

interface PostType {
  id: string;
  caption: string | null;
  mediaUrl: string | null;
  location: string | null;
  createdAt: Date | string;
  likesCount: number;
  commentsCount: number;
  User: {
    name: string | null;
    username: string;
    imageUrl: string | null;
  };
  Like?: {
    userId: string;
  }[];
}

interface FeedContainerProps {
  initialPosts: PostType[];
  initialHasMore: boolean;
  dbUser: {
    name: string | null;
    username: string;
    imageUrl: string | null;
  } | null;
  clerkUserId: string | undefined;
  feedType: "feed" | "reels";
  headerTitle: string;
  headerDescription: string;
  emptyTitle: string;
  emptyDescription: string;
}

export default function FeedContainer({
  initialPosts,
  initialHasMore,
  dbUser,
  clerkUserId,
  feedType,
  headerTitle,
  headerDescription,
  emptyTitle,
  emptyDescription,
}: FeedContainerProps) {
  const [posts, setPosts] = useState<PostType[]>(initialPosts);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const nextPage = page + 1;

    try {
      const response = await axios.get(`/api/posts`, {
        params: {
          type: feedType,
          page: nextPage,
          limit: 10,
        },
      });

      const { posts: newPosts, hasMore: nextHasMore } = response.data;

      setPosts((prev) => [...prev, ...newPosts]);
      setPage(nextPage);
      setHasMore(nextHasMore);
    } catch (error) {
      console.error("[FeedContainer] Error loading more posts:", error);
      alert("Failed to load more posts. Please try again.");
    } finally {
      setIsLoadingMore(false);
    }
  };


  return (
    <div className="w-full flex flex-col gap-6 select-none animate-fade-in">
      {/* Header Title with gradient */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-neutral-900 dark:text-neutral-50 bg-gradient-to-r from-neutral-900 via-indigo-950 to-neutral-900 dark:from-neutral-50 dark:via-indigo-200 dark:to-neutral-50 bg-clip-text text-transparent">
          {headerTitle}
        </h1>
        <p className="text-xs text-neutral-400 dark:text-neutral-500 font-semibold mt-0.5">
          {headerDescription}
        </p>
      </div>

      {/* Quick Post card (only on Home feed for logged-in users) */}
      {feedType === "feed" && clerkUserId && (
        <QuickPost user={dbUser} />
      )}

      {/* Posts List */}
      <div className="flex flex-col gap-6 mt-2">
        {posts && posts.length > 0 ? (
          <>
            {posts.map((post) => {
              // Check if the post is a video (Reel) by its file extension
              const isVideoPost = post.mediaUrl
                ? /\.(mp4|webm|ogg|mov|m4v)/i.test(post.mediaUrl)
                : false;

              return isVideoPost ? (
                // Reel posts get a dedicated portrait card with video preview
                <FeedReelCard key={post.id} post={post} />
              ) : (
                // Image/text posts get the standard PostCard
                <PostCard key={post.id} post={post} />
              );
            })}

            {/* Load More Button */}
            {hasMore && (
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="w-full h-11 rounded-2xl bg-white/40 dark:bg-zinc-950/45 border border-black/[0.05] dark:border-white/[0.08] hover:bg-black/[0.02] dark:hover:bg-white/[0.02] text-neutral-700 dark:text-neutral-300 font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 mt-4 hover:scale-101 disabled:opacity-50"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                    Loading More...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Load More
                  </>
                )}
              </button>
            )}
          </>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 text-center select-none bg-white/20 dark:bg-zinc-950/20 rounded-[2.5rem] border border-dashed border-black/[0.08] dark:border-white/[0.1] p-8">
            <div className="bg-neutral-100 dark:bg-neutral-900 p-4.5 rounded-3xl mb-4 border border-black/[0.03] dark:border-white/[0.05]">
              <Rss className="h-8 w-8 text-indigo-500 dark:text-indigo-400 animate-pulse" />
            </div>
            <h4 className="font-extrabold text-neutral-800 dark:text-neutral-200 mb-1.5 text-base md:text-lg">
              {emptyTitle}
            </h4>
            <p className="text-xs md:text-sm text-neutral-400 dark:text-neutral-500 max-w-xs leading-relaxed">
              {emptyDescription}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
