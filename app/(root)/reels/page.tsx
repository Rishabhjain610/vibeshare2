"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  Volume2,
  VolumeX,
  Loader2,
  Film,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import Link from "next/link";

// ---- Types ----
interface ReelPost {
  id: string;
  caption: string | null;
  mediaUrl: string | null;
  location: string | null;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  User: {
    name: string | null;
    username: string;
    imageUrl: string | null;
  };
  Like?: { userId: string }[];
}

// ---- Single Reel Slide Component ----
function ReelSlide({
  post,
  isActive,
  globalMuted,
  onMuteToggle,
  isMobile,
}: {
  post: ReelPost;
  isActive: boolean;
  globalMuted: boolean;
  onMuteToggle: () => void;
  isMobile: boolean;
}) {
  const { userId } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLiked, setIsLiked] = useState(
    () => !!(post.Like && userId && post.Like.some((l) => l.userId === userId))
  );
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [isVideoPaused, setIsVideoPaused] = useState(false);
  const [showIcon, setShowIcon] = useState(false);

  useEffect(() => {
    if (userId && post.Like) {
      setIsLiked(post.Like.some((l) => l.userId === userId));
    }
  }, [userId, post.Like]);

  // Play/pause based on which slide is active
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = globalMuted;

    if (isActive) {
      v.play().then(() => setIsVideoPaused(false)).catch(() => {});
    } else {
      v.pause();
      v.currentTime = 0;
      setIsVideoPaused(true);
    }
  }, [isActive, globalMuted]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = globalMuted;
  }, [globalMuted]);

  const handleTap = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play().then(() => setIsVideoPaused(false)).catch(() => {}); }
    else { v.pause(); setIsVideoPaused(true); }
    setShowIcon(true);
    setTimeout(() => setShowIcon(false), 600);
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId) return;
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

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard
      .writeText(`${window.location.origin}/post/${post.id}`)
      .then(() => alert("Link copied!"))
      .catch(() => {});
  };

  const renderCaption = (text: string | null) => {
    if (!text) return null;
    return text.split(" ").map((word, i) =>
      word.startsWith("#") ? (
        <span key={i} className="text-sky-300 font-bold">{word} </span>
      ) : (
        word + " "
      )
    );
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden flex-shrink-0 rounded-none md:rounded-[2rem]">
      {/* Video */}
      <video
        ref={videoRef}
        src={post.mediaUrl || ""}
        loop
        playsInline
        muted={globalMuted}
        onClick={handleTap}
        className="absolute inset-0 w-full h-full object-cover cursor-pointer"
      />

      {/* Tap feedback */}
      {showIcon && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="animate-ping-once bg-black/50 backdrop-blur-sm rounded-full p-5">
            <div className="h-10 w-10 border-[3px] border-white rounded-full flex items-center justify-center">
              {isVideoPaused ? (
                <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-white border-b-[8px] border-b-transparent ml-1" />
              ) : (
                <div className="flex gap-1">
                  <div className="w-1.5 h-7 bg-white rounded-full" />
                  <div className="w-1.5 h-7 bg-white rounded-full" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/25 pointer-events-none" />

      {/* Top controls */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-20">
        {/* Only show back arrow on mobile (full screen mode) */}
        {isMobile && (
          <Link
            href="/"
            className="h-9 w-9 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
        )}
        <div className={cn("flex items-center gap-2", !isMobile && "ml-auto")}>
          <button
            onClick={(e) => { e.stopPropagation(); onMuteToggle(); }}
            className="h-9 w-9 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-colors"
          >
            {globalMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Bottom left: user info + caption */}
      <div className="absolute bottom-16 left-4 right-20 z-20 flex flex-col gap-2 pointer-events-none">
        <Link
          href={`/profile/${post.User.username}`}
          className="flex items-center gap-2.5 pointer-events-auto w-fit"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="h-10 w-10 rounded-full border-2 border-white/30 bg-neutral-800 overflow-hidden flex-shrink-0">
            {post.User.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.User.imageUrl} alt={post.User.username} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold">
                {post.User.username.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <p className="text-white text-sm font-black leading-tight drop-shadow-md">
              {post.User.name || post.User.username}
            </p>
            <p className="text-white/70 text-xs font-semibold">@{post.User.username}</p>
          </div>
        </Link>

        {post.caption && (
          <p className="text-white text-sm font-medium leading-snug drop-shadow-md line-clamp-3">
            {renderCaption(post.caption)}
          </p>
        )}
        {post.location && (
          <p className="text-white/60 text-xs font-bold">📍 {post.location}</p>
        )}
      </div>

      {/* Right floating actions */}
      <div className="absolute bottom-16 right-3 z-20 flex flex-col items-center gap-5">
        <button onClick={handleLike} className="flex flex-col items-center gap-0.5 group focus:outline-none">
          <div className={cn(
            "h-12 w-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg backdrop-blur-sm",
            isLiked ? "bg-rose-500/80 scale-110" : "bg-black/40 group-hover:bg-black/60 group-active:scale-90"
          )}>
            <Heart className={cn("h-6 w-6 transition-all", isLiked ? "fill-white text-white" : "text-white")} />
          </div>
          <span className="text-white text-[11px] font-black drop-shadow-md tabular-nums">{likesCount}</span>
        </button>

        <button className="flex flex-col items-center gap-0.5 group focus:outline-none">
          <div className="h-12 w-12 rounded-full bg-black/40 group-hover:bg-black/60 flex items-center justify-center shadow-lg backdrop-blur-sm transition-all group-active:scale-90">
            <MessageCircle className="h-6 w-6 text-white" />
          </div>
          <span className="text-white text-[11px] font-black drop-shadow-md tabular-nums">{post.commentsCount}</span>
        </button>

        <button onClick={handleShare} className="flex flex-col items-center gap-0.5 group focus:outline-none">
          <div className="h-12 w-12 rounded-full bg-black/40 group-hover:bg-black/60 flex items-center justify-center shadow-lg backdrop-blur-sm transition-all group-active:scale-90">
            <Share2 className="h-6 w-6 text-white" />
          </div>
          <span className="text-white text-[11px] font-black drop-shadow-md uppercase">Share</span>
        </button>
      </div>
    </div>
  );
}

// ---- Main Reels Page ----
export default function ReelsPage() {
  const [reels, setReels] = useState<ReelPost[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [globalMuted, setGlobalMuted] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Detect mobile viewport
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Initial fetch
  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get("/api/posts", {
          params: { type: "reels", page: 1, limit: 5 },
        });
        setReels(res.data.posts || []);
        setHasMore(res.data.hasMore ?? false);
      } catch (err) {
        console.error("[ReelsPage] Failed to load:", err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // Intersection Observer to track active slide
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = slideRefs.current.indexOf(entry.target as HTMLDivElement);
            if (idx !== -1) setActiveIndex(idx);
          }
        });
      },
      { threshold: 0.6 }
    );

    slideRefs.current.forEach((el) => {
      if (el) observerRef.current!.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [reels.length]);

  // Auto-fetch more when near the end
  const fetchMore = useCallback(async () => {
    if (isFetchingMore || !hasMore) return;
    setIsFetchingMore(true);
    const next = page + 1;
    try {
      const res = await axios.get("/api/posts", {
        params: { type: "reels", page: next, limit: 5 },
      });
      setReels((prev) => [...prev, ...(res.data.posts || [])]);
      setHasMore(res.data.hasMore ?? false);
      setPage(next);
    } catch { /* silent */ }
    finally { setIsFetchingMore(false); }
  }, [isFetchingMore, hasMore, page]);

  useEffect(() => {
    if (activeIndex >= reels.length - 2) fetchMore();
  }, [activeIndex, reels.length, fetchMore]);

  // ---- Loading state ----
  if (isLoading) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="h-10 w-10 text-neutral-400 animate-spin" />
        <p className="text-neutral-400 text-sm font-semibold">Loading Reels...</p>
      </div>
    );
  }

  // ---- Empty state ----
  if (!reels.length) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-24 gap-4 text-center">
        <Film className="h-14 w-14 text-neutral-300 dark:text-neutral-700" />
        <h2 className="text-xl font-black text-neutral-800 dark:text-neutral-200">No Reels Yet</h2>
        <p className="text-neutral-400 text-sm max-w-xs">
          Be the first! Upload a video in the Create Reel section.
        </p>
        <Link
          href="/create-reel"
          className="mt-2 px-6 py-3 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black text-sm font-black rounded-full hover:opacity-90 transition-opacity"
        >
          Create Reel
        </Link>
      </div>
    );
  }

  // ====================================================
  // MOBILE: Full-screen fixed snap-scroll (TikTok style)
  // ====================================================
  if (isMobile) {
    return (
      <div className="fixed inset-0 bg-black z-50 overflow-hidden">
        <div
          ref={containerRef}
          className="w-full h-full overflow-y-scroll snap-y snap-mandatory scrollbar-none"
          style={{ scrollbarWidth: "none" }}
        >
          {reels.map((reel, index) => (
            <div
              key={reel.id}
              ref={(el) => { slideRefs.current[index] = el; }}
              className="w-full h-full snap-start snap-always flex-shrink-0"
            >
              <ReelSlide
                post={reel}
                isActive={index === activeIndex}
                globalMuted={globalMuted}
                onMuteToggle={() => setGlobalMuted((m) => !m)}
                isMobile={true}
              />
            </div>
          ))}
          {isFetchingMore && (
            <div className="w-full h-20 snap-start flex-shrink-0 flex items-center justify-center bg-black">
              <Loader2 className="h-6 w-6 text-white/40 animate-spin" />
            </div>
          )}
        </div>

        {/* Mobile bottom mini-nav */}
        <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center pb-3 pointer-events-none z-30">
          <div className="flex items-center gap-6 pointer-events-auto">
            <Link href="/" className="text-white/50 hover:text-white text-xs font-bold transition-colors px-2 py-1">Home</Link>
            <span className="text-white text-xs font-black border-b-2 border-white pb-0.5 px-2">Reels</span>
            <Link href="/explore" className="text-white/50 hover:text-white text-xs font-bold transition-colors px-2 py-1">Explore</Link>
            <Link href="/create-reel" className="text-white/50 hover:text-white text-xs font-bold transition-colors px-2 py-1">+ Create</Link>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // DESKTOP: Centered phone-frame column, fits within normal layout
  // ============================================================
  return (
    <div className="w-full flex flex-col gap-4">
      {/* Page header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-neutral-900 dark:text-neutral-50 bg-gradient-to-r from-neutral-900 via-indigo-950 to-neutral-900 dark:from-neutral-50 dark:via-indigo-200 dark:to-neutral-50 bg-clip-text text-transparent">
          Vibe Reels
        </h1>
        <p className="text-xs text-neutral-400 dark:text-neutral-500 font-semibold mt-0.5">
          Watch short videos and visual clips shared by anyone
        </p>
      </div>

      {/* Centered snap-scroll column, phone-frame width */}
      <div className="flex justify-center">
        <div
          ref={containerRef}
          className="w-full max-w-[360px] h-[calc(100vh-12rem)] overflow-y-scroll snap-y snap-mandatory scrollbar-none rounded-[2.5rem] overflow-hidden shadow-2xl border border-black/10 dark:border-white/10 bg-black"
          style={{ scrollbarWidth: "none" }}
        >
          {reels.map((reel, index) => (
            <div
              key={reel.id}
              ref={(el) => { slideRefs.current[index] = el; }}
              className="w-full h-full snap-start snap-always flex-shrink-0"
            >
              <ReelSlide
                post={reel}
                isActive={index === activeIndex}
                globalMuted={globalMuted}
                onMuteToggle={() => setGlobalMuted((m) => !m)}
                isMobile={false}
              />
            </div>
          ))}
          {isFetchingMore && (
            <div className="w-full h-16 snap-start flex-shrink-0 flex items-center justify-center bg-black">
              <Loader2 className="h-5 w-5 text-white/40 animate-spin" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
