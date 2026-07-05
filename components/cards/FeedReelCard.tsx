"use client";

// FeedReelCard.tsx
// Ye component home feed mein reel posts ke liye use hota hai.
// Regular PostCard ki tarah header + info hai, lekin video preview 9:16 portrait ratio mein
// aur ek "Watch Reel" badge bhi hai jo /reels page pe link karta hai.

import React, { useState, useEffect, useRef } from "react";
import { Heart, MessageCircle, Share2, MapPin, Play, Pause, Clapperboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import Link from "next/link";
import CommentSection from "@/components/shared/CommentSection";

interface FeedReelCardProps {
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
    Like?: { userId: string }[];
  };
}

// Relative timestamp formatter (Moved outside render to guarantee purity)
const formatTime = (d: Date | string) => {
  const date = new Date(d);
  const ms = Date.now() - date.getTime();
  const mins = Math.floor(ms / 60000);
  const hrs = Math.floor(ms / 3600000);
  const days = Math.floor(ms / 86400000);
  if (mins < 1) return "Just now";
  if (hrs < 1) return `${mins}m ago`;
  if (days < 1) return `${hrs}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export default function FeedReelCard({ post }: FeedReelCardProps) {
  const { userId } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(
    () => !!(post.Like && userId && post.Like.some((l) => l.userId === userId))
  );
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);
  const [showComments, setShowComments] = useState(false);

  // Auth sync
  useEffect(() => {
    if (userId && post.Like) {
      setIsLiked(post.Like.some((l) => l.userId === userId));
    }
  }, [userId, post.Like]);

  const handlePlayToggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (isPlaying) { v.pause(); setIsPlaying(false); }
    else { v.play().then(() => setIsPlaying(true)).catch(() => {}); }
  };

  const handleLike = async () => {
    if (!userId) { alert("Please sign in to like posts!"); return; }
    const prev = { isLiked, likesCount };
    setIsLiked((l) => !l);
    setLikesCount((c) => (isLiked ? Math.max(0, c - 1) : c + 1));
    try {
      const res = await axios.post(`/api/posts/${post.id}/like`);
      setIsLiked(res.data.liked);
      setLikesCount(res.data.likesCount);
    } catch {
      setIsLiked(prev.isLiked);
      setLikesCount(prev.likesCount);
    }
  };

  const handleShare = () => {
    navigator.clipboard
      .writeText(`${window.location.origin}/post/${post.id}`)
      .then(() => alert("Link copied!"))
      .catch(() => {});
  };

  const renderCaption = (text: string | null) => {
    if (!text) return null;
    return text.split(" ").map((word, i) =>
      word.startsWith("#") ? (
        <span key={i} className="text-indigo-500 dark:text-indigo-400 font-semibold">
          {word}{" "}
        </span>
      ) : (
        word + " "
      )
    );
  };

  return (
    <article className="w-full overflow-hidden rounded-[2.2rem] bg-white/40 dark:bg-zinc-950/45 backdrop-blur-md border border-black/[0.05] dark:border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.015)] p-5 md:p-6 flex flex-col gap-4 transition-all duration-300 hover:shadow-lg">

      {/* Header */}
      <div className="flex justify-between items-center">
        <Link href={`/profile/${post.User.username}`} className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full border border-black/5 dark:border-white/10 bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center overflow-hidden shrink-0">
            {post.User.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.User.imageUrl} alt={post.User.username} className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-neutral-400 dark:text-neutral-500">
                {post.User.username.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-neutral-900 dark:text-neutral-50 truncate">
              {post.User.name || post.User.username}
            </span>
            <span className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 flex items-center gap-1.5 mt-0.5">
              <span>@{post.User.username}</span>
              <span>•</span>
              <span suppressHydrationWarning>{formatTime(post.createdAt)}</span>
            </span>
          </div>
        </Link>

        {/* Reel badge + location */}
        <div className="flex items-center gap-2 shrink-0">
          {post.location && (
            <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-500 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 px-2.5 py-1 rounded-full border border-indigo-100/50 dark:border-indigo-900/40">
              <MapPin className="h-3 w-3" />
              <span className="max-w-[80px] truncate">{post.location}</span>
            </div>
          )}
          {/* Reel indicator badge */}
          <div className="flex items-center gap-1 text-[10px] font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30 px-2.5 py-1 rounded-full border border-violet-200/50 dark:border-violet-800/40">
            <Clapperboard className="h-3 w-3" />
            <span>Reel</span>
          </div>
        </div>
      </div>

      {/* Caption */}
      {post.caption && (
        <p className="text-sm md:text-base text-neutral-800 dark:text-neutral-200 leading-relaxed font-medium">
          {renderCaption(post.caption)}
        </p>
      )}

      {/* Video Preview — portrait 9:16 ratio with play overlay */}
      {post.mediaUrl && (
        <div className="relative w-full max-w-[260px] mx-auto aspect-[9/16] rounded-3xl overflow-hidden bg-black shadow-xl group/video">
          <video
            ref={videoRef}
            src={post.mediaUrl}
            loop
            playsInline
            muted
            className="w-full h-full object-cover"
            onClick={handlePlayToggle}
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

          {/* Play/Pause button center overlay */}
          <button
            onClick={handlePlayToggle}
            className="absolute inset-0 flex items-center justify-center cursor-pointer"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            <div
              className={cn(
                "h-14 w-14 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white shadow-xl transition-all duration-200",
                isPlaying
                  ? "opacity-0 group-hover/video:opacity-100 scale-90 group-hover/video:scale-100"
                  : "opacity-100"
              )}
            >
              {isPlaying ? (
                <Pause className="h-6 w-6 fill-white" />
              ) : (
                <Play className="h-6 w-6 fill-white ml-0.5" />
              )}
            </div>
          </button>

          {/* "Watch Full Reel" link at bottom */}
          <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none">
            <Link
              href="/reels"
              onClick={(e) => e.stopPropagation()}
              className="pointer-events-auto text-[10px] font-black text-white/80 hover:text-white tracking-wider uppercase bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20 hover:border-white/40 transition-all"
            >
              ▶ Watch in Reels
            </Link>
          </div>
        </div>
      )}

      {/* Footer interaction bar */}
      <div className="flex items-center justify-between border-t border-black/[0.03] dark:border-white/[0.04] pt-3 mt-1 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
        <div className="flex items-center gap-5">
          <button
            onClick={handleLike}
            className={cn(
              "flex items-center gap-1.5 py-1 px-2.5 rounded-full transition-all duration-200 hover:bg-rose-50/50 dark:hover:bg-rose-950/10 group focus-visible:outline-none",
              isLiked ? "text-rose-500 dark:text-rose-400" : "hover:text-rose-500 dark:hover:text-rose-400"
            )}
          >
            <Heart
              className={cn(
                "h-4.5 w-4.5 transition-transform duration-200 group-hover:scale-110",
                isLiked && "fill-rose-500 dark:fill-rose-400"
              )}
            />
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
            <MessageCircle className="h-4.5 w-4.5 transition-transform duration-200 group-hover:scale-110" />
            <span>{commentsCount}</span>
          </button>
        </div>

        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 py-1 px-2.5 rounded-full transition-all duration-200 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 hover:text-neutral-800 dark:hover:text-neutral-200 group focus-visible:outline-none"
        >
          <Share2 className="h-4.5 w-4.5 transition-transform duration-200 group-hover:scale-110" />
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
