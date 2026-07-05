"use client";

import React, { useState, useEffect, useRef } from "react"; // Hook functions import kiye.
import { Heart, MessageCircle, Share2, Volume2, VolumeX, Play, Pause, MapPin } from "lucide-react"; // Icons import kiye.
import { cn } from "@/lib/utils"; // Styling helpers
import { useAuth } from "@clerk/nextjs"; // Clerk Auth state fetch karne ke liye.
import axios from "axios"; // API requests ke liye Axios client.
import Link from "next/link"; // Next.js Link client-side navigation ke liye.

interface ReelCardProps {
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

export default function ReelCard({ post }: ReelCardProps) {
  const { userId } = useAuth();
  
  // 1. Like status local state (Optimistic UI)
  const initialIsLiked = post.Like && userId
    ? post.Like.some((like) => like.userId === userId)
    : false;

  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);

  // 2. Play/Pause state and Video reference
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayOverlay, setShowPlayOverlay] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Default muted to comply with browser autoplay policies.
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync client-side like state when Clerk authentication finishes loading
  useEffect(() => {
    if (userId && post.Like) {
      setIsLiked(post.Like.some((like) => like.userId === userId));
    }
  }, [userId, post.Like]);

  // 3. Autoplay on Scroll (Intersection Observer API) - Best Practice
  // Is Observer ke through video screen ke center (viewport) mein aate hi auto-play hogi
  // aur scroll hokar screen se bahar jate hi pause ho jayegi.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Video screen par visible hai, toh play karo
            video.play()
              .then(() => setIsPlaying(true))
              .catch((err) => console.log("[ReelCard] Play blocked by browser auto-play policy:", err));
          } else {
            // Video screen se bahar chali gayi, toh pause karo
            video.pause();
            setIsPlaying(false);
          }
        });
      },
      {
        threshold: 0.6, // Jab Reel 60% visible ho tabhi auto-play triggers ho.
      }
    );

    observer.observe(video);

    return () => {
      observer.unobserve(video);
    };
  }, []);

  // Play / Pause toggler function
  const handlePlayToggle = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.error(err));
    }

    // Play/Pause notification icon screen par flash (show) karenge.
    setShowPlayOverlay(true);
    setTimeout(() => setShowPlayOverlay(false), 500);
  };

  // Sound Mute/Unmute toggler
  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // Video click play/pause trigger ko ignore karne ke liye event stop kiya.
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Like Toggler Action (Optimistic call to /api/posts/[id]/like)
  const handleLikeToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId) {
      alert("Please sign in to like Reels!");
      return;
    }

    const originalIsLiked = isLiked;
    const originalLikesCount = likesCount;

    setIsLiked(!originalIsLiked);
    setLikesCount((prev) => (originalIsLiked ? Math.max(0, prev - 1) : prev + 1));

    try {
      const response = await axios.post(`/api/posts/${post.id}/like`);
      setIsLiked(response.data.liked);
      setLikesCount(response.data.likesCount);
    } catch (error) {
      console.error("[ReelCard] Liking error:", error);
      setIsLiked(originalIsLiked);
      setLikesCount(originalLikesCount);
    }
  };

  // Share action (Copies link to clipboard)
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(url)
      .then(() => alert("Reel link copied to clipboard!"))
      .catch((err) => console.error("Could not copy text: ", err));
  };

  // Hashtags aur captions ke tags ko highlighted blue style provide karne ka parser
  const renderCaption = (text: string | null) => {
    if (!text) return "";
    return text.split(" ").map((word, index) => {
      if (word.startsWith("#")) {
        return (
          <span key={index} className="text-sky-400 font-bold hover:underline cursor-pointer">
            {word}{" "}
          </span>
        );
      }
      return word + " ";
    });
  };

  return (
    <div 
      ref={containerRef}
      className="h-full max-h-full aspect-[9/16] mx-auto rounded-[2.5rem] overflow-hidden bg-black relative shadow-[0_12px_40px_rgba(0,0,0,0.15)] border border-black/10 dark:border-white/5 select-none"
    >
      
      {/* 1. Main Video Element */}
      <video
        ref={videoRef}
        src={post.mediaUrl || ""}
        loop
        muted={isMuted}
        playsInline
        onClick={handlePlayToggle}
        className="w-full h-full object-cover cursor-pointer"
      />

      {/* 2. Play/Pause overlay icon flash */}
      {showPlayOverlay && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/10 transition-opacity duration-200">
          <div className="bg-black/60 p-4.5 rounded-full scale-in text-white backdrop-blur-sm">
            {isPlaying ? (
              <Play className="h-8 w-8 fill-white text-white" />
            ) : (
              <Pause className="h-8 w-8 fill-white text-white" />
            )}
          </div>
        </div>
      )}

      {/* 3. Audio Control Button (Floating top right) */}
      <button
        onClick={handleMuteToggle}
        className="absolute top-5 right-5 h-9 w-9 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-all duration-200 shadow-md backdrop-blur-sm z-10 hover:scale-105 active:scale-95"
        aria-label={isMuted ? "Unmute video" : "Mute video"}
      >
        {isMuted ? (
          <VolumeX className="h-4.5 w-4.5" />
        ) : (
          <Volume2 className="h-4.5 w-4.5" />
        )}
      </button>

      {/* 4. Overlay Info Panel (Bottom Left) */}
      <div className="absolute bottom-0 left-0 right-14 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-5 pt-16 flex flex-col gap-2.5 pointer-events-none text-white z-10">
        
        {/* User Info Row */}
        <Link href={`/profile/${post.User.username}`} className="pointer-events-auto flex items-center gap-2.5 max-w-full">
          <div className="h-9 w-9 rounded-full border border-white/20 bg-neutral-800 flex items-center justify-center overflow-hidden shrink-0">
            {post.User.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.User.imageUrl}
                alt={`${post.User.username}'s avatar`}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xs font-bold text-neutral-400">
                {post.User.username.substring(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-black tracking-wide truncate">
              {post.User.name || post.User.username}
            </span>
            <span className="text-[10px] font-bold text-neutral-300">
              @{post.User.username}
            </span>
          </div>
        </Link>

        {/* Caption Info */}
        {post.caption && (
          <p className="text-[11px] font-semibold leading-relaxed line-clamp-3 select-text pointer-events-auto text-neutral-100">
            {renderCaption(post.caption)}
          </p>
        )}

        {/* Location Badge */}
        {post.location && (
          <div className="flex items-center gap-1 text-[9px] font-black text-indigo-400 tracking-wide">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{post.location}</span>
          </div>
        )}
      </div>

      {/* 5. Floating Vertical Interaction Bar (Right Side) */}
      <div className="absolute right-3.5 bottom-8.5 flex flex-col items-center gap-4.5 z-20">
        
        {/* Like Widget */}
        <button
          onClick={handleLikeToggle}
          className="flex flex-col items-center gap-1 text-white select-none focus:outline-none"
        >
          <div className="h-11 w-11 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-all duration-200 shadow-md backdrop-blur-sm hover:scale-105 active:scale-90">
            <Heart 
              className={cn(
                "h-5 w-5 transition-colors duration-250",
                isLiked ? "fill-rose-500 text-rose-500" : "text-white"
              )} 
            />
          </div>
          <span className="text-[9px] font-extrabold tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
            {likesCount}
          </span>
        </button>

        {/* Comments Widget */}
        <div className="flex flex-col items-center gap-1 text-white select-none">
          <button className="h-11 w-11 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-all duration-200 shadow-md backdrop-blur-sm hover:scale-105 active:scale-90">
            <MessageCircle className="h-5 w-5 text-white" />
          </button>
          <span className="text-[9px] font-extrabold tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
            {post.commentsCount}
          </span>
        </div>

        {/* Share Widget */}
        <button
          onClick={handleShare}
          className="flex flex-col items-center gap-1 text-white select-none focus:outline-none"
        >
          <div className="h-11 w-11 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-all duration-200 shadow-md backdrop-blur-sm hover:scale-105 active:scale-90">
            <Share2 className="h-5 w-5 text-white" />
          </div>
          <span className="text-[9px] font-extrabold tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] uppercase">
            Share
          </span>
        </button>
      </div>

    </div>
  );
}
