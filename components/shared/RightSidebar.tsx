"use client";

import React, { useState, useEffect } from "react";
import { Users, MessageSquare, Loader2, UserPlus, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import Link from "next/link";

interface SuggestedUser {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  status: string;
  isFollowing: boolean;
}


const RightSidebar = () => {
  const { userId } = useAuth();
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [isChatsLoading, setIsChatsLoading] = useState(true);

  // Fetch suggestions on component mount
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const response = await axios.get("/api/users/suggestions");
        if (response.data && Array.isArray(response.data)) {
          setSuggestions(response.data);
        } else {
          setSuggestions([]);
        }
      } catch (error) {
        console.error("[RightSidebar] Error fetching suggestions:", error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [userId]);

  // Fetch conversations with polling
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await axios.get("/api/chatwithsummary/conversations");
        if (response.data && response.data.success) {
          setConversations(response.data.conversations);
        }
      } catch (error) {
        console.error("[RightSidebar] Error fetching conversations:", error);
      } finally {
        setIsChatsLoading(false);
      }
    };

    if (userId) {
      fetchConversations();
      const interval = setInterval(fetchConversations, 10000);
      return () => clearInterval(interval);
    } else {
      setConversations([]);
      setIsChatsLoading(false);
    }
  }, [userId]);

  // Handle follow/unfollow toggle
  const handleFollowToggle = async (targetId: string) => {
    if (!userId) {
      alert("Please sign in to follow users!");
      return;
    }

    setTogglingId(targetId);
    
    // Find current state for optimistic rollback
    const targetUser = suggestions.find((s) => s.id === targetId);
    if (!targetUser) return;

    const originalFollowingState = targetUser.isFollowing;

    // Optimistically update UI
    setSuggestions((prev) =>
      prev.map((s) =>
        s.id === targetId ? { ...s, isFollowing: !originalFollowingState } : s
      )
    );

    try {
      const response = await axios.post(`/api/users/${targetId}/follow`);
      // Update with the exact state returned by the API
      setSuggestions((prev) =>
        prev.map((s) =>
          s.id === targetId ? { ...s, isFollowing: response.data.following } : s
        )
      );
    } catch (error) {
      console.error("[RightSidebar] Error toggling follow:", error);
      // Rollback to original state on network failure
      setSuggestions((prev) =>
        prev.map((s) =>
          s.id === targetId ? { ...s, isFollowing: originalFollowingState } : s
        )
      );
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <aside className="hidden xl:flex flex-col sticky top-0 h-screen w-80 border-l border-black/[0.05] dark:border-white/[0.08] bg-white dark:bg-black p-6 select-none shrink-0 overflow-y-auto space-y-8">
      
      {/* Section 1: Suggested Followers */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-neutral-400 dark:text-neutral-500">
          <Users className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Suggested Followers</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 text-indigo-500 animate-spin" />
          </div>
        ) : Array.isArray(suggestions) && suggestions.length > 0 ? (
          <div className="space-y-4">
            {suggestions.map((follower) => (
              <div key={follower.id} className="flex items-center justify-between gap-3 group">
                <Link href={`/profile/${follower.username}`} className="flex items-center gap-3 min-w-0">
                  {/* Avatar Image / Placeholder */}
                  <div className="h-9 w-9 shrink-0 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-black/5 dark:border-white/10 flex items-center justify-center overflow-hidden">
                    {follower.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={follower.avatarUrl}
                        alt={`${follower.name}'s avatar`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="font-semibold text-sm text-neutral-500">
                        {follower.username.substring(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate hover:underline">
                      {follower.name}
                    </span>
                    <span className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 truncate">
                      @{follower.username}
                    </span>
                  </div>
                </Link>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Link href={`/chatwithsummary?userId=${follower.id}`}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-full text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 dark:text-neutral-500 dark:hover:text-indigo-400 dark:hover:bg-indigo-950/30 transition-colors duration-200"
                      title={`Chat with ${follower.name}`}
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                    </Button>
                  </Link>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={togglingId === follower.id}
                    onClick={() => handleFollowToggle(follower.id)}
                    className={cn(
                      "h-7 rounded-full text-[10px] font-black tracking-wider uppercase px-3.5 transition-all duration-200 shrink-0 select-none active:scale-95",
                      follower.isFollowing
                        ? "border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-rose-500 hover:border-rose-200 dark:hover:border-rose-950/30"
                        : "bg-indigo-600 text-white border-transparent hover:bg-indigo-700 hover:text-white dark:bg-indigo-500 dark:hover:bg-indigo-600"
                    )}
                  >
                    {togglingId === follower.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : follower.isFollowing ? (
                      <span className="flex items-center gap-1">
                        <UserCheck className="h-3 w-3" />
                        Following
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <UserPlus className="h-3 w-3" />
                        Follow
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-neutral-400 dark:text-neutral-500 text-center py-2">
            No suggestions available
          </p>
        )}
      </div>

      {/* Section 2: Direct Chats */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-neutral-400 dark:text-neutral-500">
          <MessageSquare className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Direct Messages</span>
        </div>

        {isChatsLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 text-indigo-500 animate-spin" />
          </div>
        ) : conversations.length > 0 ? (
          <div className="space-y-1">
            {conversations.map((chat) => (
              <Link key={chat.id} href={`/chatwithsummary?userId=${chat.id}`} className="block">
                <div
                  className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-900/50 cursor-pointer transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative h-9 w-9 shrink-0 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/10 flex items-center justify-center font-bold text-xs text-neutral-700 dark:text-neutral-300 overflow-hidden">
                      {chat.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={chat.avatarUrl}
                          alt={`${chat.name}'s avatar`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span>
                          {chat.username.substring(0, 2).toUpperCase()}
                        </span>
                      )}
                      {chat.active && (
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-black" />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                        {chat.name}
                      </span>
                      <span className={cn(
                        "text-[10px] truncate",
                        chat.unread > 0
                          ? "font-bold text-neutral-900 dark:text-neutral-100"
                          : "text-neutral-400 dark:text-neutral-500"
                      )}>
                        {chat.lastMessage}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[9px] font-semibold text-neutral-400 dark:text-neutral-500">
                      {chat.time}
                    </span>
                    {chat.unread > 0 && (
                      <span className="h-4 min-w-4 rounded-full bg-neutral-950 dark:bg-neutral-50 text-[9px] font-black text-white dark:text-black flex items-center justify-center px-1">
                        {chat.unread}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-xs text-neutral-400 dark:text-neutral-500 text-center py-2">
            No recent conversations
          </p>
        )}
      </div>
    </aside>
  );
};

export default RightSidebar;