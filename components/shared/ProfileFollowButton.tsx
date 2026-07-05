"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/nextjs";
import { Loader2, UserPlus, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";
import { useRouter } from "next/navigation";

interface ProfileFollowButtonProps {
  targetUserId: string;
  initialIsFollowing: boolean;
  onFollowChange?: (following: boolean) => void;
}

export default function ProfileFollowButton({
  targetUserId,
  initialIsFollowing,
  onFollowChange,
}: ProfileFollowButtonProps) {
  const { userId } = useAuth();
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isToggling, setIsToggling] = useState(false);

  const handleFollowToggle = async () => {
    if (!userId) {
      alert("Please sign in to follow users!");
      return;
    }

    setIsToggling(true);
    const originalFollowingState = isFollowing;

    // Optimistically update state
    setIsFollowing(!originalFollowingState);
    if (onFollowChange) {
      onFollowChange(!originalFollowingState);
    }

    try {
      const response = await axios.post(`/api/users/${targetUserId}/follow`);
      setIsFollowing(response.data.following);
      if (onFollowChange) {
        onFollowChange(response.data.following);
      }
      router.refresh();
    } catch (error) {
      console.error("[ProfileFollowButton] Error toggling follow:", error);
      // Rollback on error
      setIsFollowing(originalFollowingState);
      if (onFollowChange) {
        onFollowChange(originalFollowingState);
      }
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <Button
      disabled={isToggling}
      onClick={handleFollowToggle}
      className={cn(
        "rounded-full px-6 py-2.5 font-bold transition-all duration-200 hover:scale-102 text-xs md:text-sm active:scale-95 shadow-md",
        isFollowing
          ? "bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-black/5 dark:border-white/10"
          : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/10"
      )}
    >
      {isToggling ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isFollowing ? (
        <span className="flex items-center gap-1.5">
          <UserCheck className="h-4 w-4" />
          Following
        </span>
      ) : (
        <span className="flex items-center gap-1.5">
          <UserPlus className="h-4 w-4" />
          Follow
        </span>
      )}
    </Button>
  );
}
