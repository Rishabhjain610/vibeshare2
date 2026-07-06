"use client";

import React, { useState, useEffect } from "react";
import { Heart, MessageCircle, Share2, MapPin, Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import Link from "next/link";
import CommentSection from "@/components/shared/CommentSection";

interface PostCardProps {
  post: {
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
  };
}

export default function PostCard({ post }: PostCardProps) {
  const { userId } = useAuth();
  
  // Check if current user has liked this post from the likes array
  const initialIsLiked = post.Like && userId
    ? post.Like.some((like) => like.userId === userId)
    : false;

  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);
  const [showComments, setShowComments] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  // Sync client-side like state when Clerk authentication finishes loading
  useEffect(() => {
    if (userId && post.Like) {
      setIsLiked(post.Like.some((like) => like.userId === userId));
    }
  }, [userId, post.Like]);

  // Check if mediaUrl is a video format (Reel)
  const isVideo = post.mediaUrl
    ? /\.(mp4|webm|ogg|mov|m4v)$/i.test(post.mediaUrl) || post.mediaUrl.includes(".mp4")
    : false;

  const handleLikeToggle = async () => {
    if (!userId) {
      alert("Please sign in to like posts!");
      return;
    }

    // Optimistic UI updates - change count instantly for better UX
    const originalIsLiked = isLiked;
    const originalLikesCount = likesCount;

    setIsLiked(!originalIsLiked);
    setLikesCount((prev) => (originalIsLiked ? Math.max(0, prev - 1) : prev + 1));

    try {
      // Send POST request to backend API to persist the like
      const response = await axios.post(`/api/posts/${post.id}/like`);
      
      // Update with exact values returned from the database
      setIsLiked(response.data.liked);
      setLikesCount(response.data.likesCount);
    } catch (error) {
      console.error("[PostCard] Error toggling like:", error);
      // Rollback to original state on request failure
      setIsLiked(originalIsLiked);
      setLikesCount(originalLikesCount);
    }
  };

  const handleVideoPlayToggle = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(console.error);
      setIsPlaying(true);
    }
  };

  // Format relative time (e.g. "3 hours ago" or "July 4")
  const formatPostTime = (dateInput: Date | string) => {
    const date = new Date(dateInput);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Function to highlight hashtags in caption
  const renderCaption = (text: string | null) => {
    if (!text) return null;
    const words = text.split(" ");
    return words.map((word, i) => {
      if (word.startsWith("#")) {
        return (
          <span key={i} className="text-indigo-500 dark:text-indigo-400 font-semibold hover:underline cursor-pointer">
            {word}{" "}
          </span>
        );
      }
      return word + " ";
    });
  };

  return (
    <article className="w-full overflow-hidden rounded-[2.2rem] bg-white/40 dark:bg-zinc-950/45 backdrop-blur-md border border-black/[0.05] dark:border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.015)] p-5 md:p-6 flex flex-col gap-4 transition-all duration-300 hover:shadow-lg">
      
      {/* Header Info */}
      <div className="flex justify-between items-center">
        <Link href={`/profile/${post.User.username}`} className="flex items-center gap-3 group">
          {/* User Avatar */}
          <div className="h-10 w-10 rounded-full border border-black/5 dark:border-white/10 bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center overflow-hidden shrink-0 transition-transform duration-200 group-hover:scale-105">
            {post.User.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.User.imageUrl}
                alt={`${post.User.name || post.User.username}'s avatar`}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-sm font-bold text-neutral-400 dark:text-neutral-500">
                {post.User.username.substring(0, 2).toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-neutral-900 dark:text-neutral-50 truncate group-hover:underline cursor-pointer">
              {post.User.name || post.User.username}
            </span>
            <span className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 flex items-center gap-1.5 mt-0.5">
              <span>@{post.User.username}</span>
              <span>•</span>
              <span suppressHydrationWarning>{formatPostTime(post.createdAt)}</span>
            </span>
          </div>
        </Link>

        {/* Location badge if present */}
        {post.location && (
          <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-500 dark:text-indigo-400 bg-indigo-55/5 dark:bg-indigo-950/20 px-2.5 py-1 rounded-full border border-indigo-100/50 dark:border-indigo-950/40 shrink-0">
            <MapPin className="h-3 w-3" />
            <span className="max-w-[80px] md:max-w-[120px] truncate">{post.location}</span>
          </div>
        )}
      </div>

      {/* Caption Section */}
      {post.caption && (
        <p className="text-sm md:text-base text-neutral-800 dark:text-neutral-200 leading-relaxed font-medium">
          {renderCaption(post.caption)}
        </p>
      )}

      {/* Media Section */}
      {post.mediaUrl && (
        <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-black/5 dark:bg-white/5 border border-black/[0.05] dark:border-white/[0.08]">
          {isVideo ? (
            <div className="relative w-full h-full group/video cursor-pointer" onClick={handleVideoPlayToggle}>
              <video
                ref={videoRef}
                src={post.mediaUrl}
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              
              {/* Custom Play/Pause Overlay indicator */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover/video:opacity-100 transition-opacity duration-200">
                <div className="h-12 w-12 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white">
                  {isPlaying ? (
                    <Pause className="h-5 w-5 fill-white" />
                  ) : (
                    <Play className="h-5 w-5 fill-white ml-0.5" />
                  )}
                </div>
              </div>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.mediaUrl}
              alt="Post attachment"
              className="w-full h-full object-cover"
            />
          )}
        </div>
      )}

      {/* Footer / Interaction Bar */}
      <div className="flex items-center justify-between border-t border-black/[0.03] dark:border-white/[0.04] pt-3 mt-1 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
        <div className="flex items-center gap-5">
          {/* Like Button */}
          <button
            onClick={handleLikeToggle}
            className={cn(
              "flex items-center gap-1.5 py-1 px-2.5 rounded-full transition-all duration-200 hover:bg-rose-50/50 dark:hover:bg-rose-950/10 group focus-visible:outline-none",
              isLiked 
                ? "text-rose-500 dark:text-rose-400" 
                : "hover:text-rose-500 dark:hover:text-rose-400"
            )}
          >
            <Heart className={cn("h-4.5 w-4.5 transition-transform duration-200 group-hover:scale-108", isLiked && "fill-rose-500 dark:fill-rose-400")} />
            <span>{likesCount}</span>
          </button>

          {/* Comment Button */}
          <button
            onClick={() => setShowComments(!showComments)}
            className={cn(
              "flex items-center gap-1.5 py-1 px-2.5 rounded-full transition-all duration-200 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/10 group focus-visible:outline-none",
              showComments ? "text-indigo-500 dark:text-indigo-400 font-bold" : "hover:text-indigo-500 dark:hover:text-indigo-400"
            )}
          >
            <MessageCircle className="h-4.5 w-4.5 transition-transform duration-200 group-hover:scale-108" />
            <span>{commentsCount}</span>
          </button>
        </div>

        {/* Share Button */}
        <button className="flex items-center gap-1.5 py-1 px-2.5 rounded-full transition-all duration-200 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 hover:text-neutral-800 dark:hover:text-neutral-200 group focus-visible:outline-none">
          <Share2 className="h-4.5 w-4.5 transition-transform duration-200 group-hover:scale-108" />
        </button>
      </div>

      {/* Dynamic Comment Section Expansion Drawer */}
      {showComments && (
        <CommentSection
          postId={post.id}
          initialCommentsCount={commentsCount}
          onCommentAdded={(newCount) => setCommentsCount(newCount)}
        />
      )}
    </article>
  );
}
