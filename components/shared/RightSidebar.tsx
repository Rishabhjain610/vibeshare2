"use client";

import React from "react";
import { Users, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const dummyFollowers = [
  {
    id: 1,
    name: "Sarah Jenkins",
    username: "sarahj",
    avatar: "S",
    status: "Follows you",
  },
  {
    id: 2,
    name: "Alex Rivera",
    username: "arivera",
    avatar: "A",
    status: "Suggested for you",
  },
  {
    id: 3,
    name: "David Chen",
    username: "dchen",
    avatar: "D",
    status: "Followed by @sarahj",
  },
];

const dummyChats = [
  {
    id: 1,
    name: "Liam Carter",
    lastMessage: "Hey, are we still on for later?",
    time: "2m ago",
    unread: 1,
    active: true,
    avatar: "L",
  },
  {
    id: 2,
    name: "Sophia Martinez",
    lastMessage: "That photo looks amazing!",
    time: "1h ago",
    unread: 0,
    active: false,
    avatar: "S",
  },
  {
    id: 3,
    name: "Marcus Vance",
    lastMessage: "Thanks for sharing!",
    time: "Yesterday",
    unread: 0,
    active: true,
    avatar: "M",
  },
];

const RightSidebar = () => {
  return (
    <aside className="hidden xl:flex flex-col sticky top-0 h-screen w-80 border-l border-black/[0.05] dark:border-white/[0.08] bg-white dark:bg-black p-6 select-none shrink-0 overflow-y-auto space-y-8">
      {/* Section 1: Followers / Suggestions */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-neutral-400 dark:text-neutral-500">
          <Users className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Suggested Followers</span>
        </div>

        <div className="space-y-3.5">
          {dummyFollowers.map((follower) => (
            <div key={follower.id} className="flex items-center justify-between gap-3 group">
              <div className="flex items-center gap-3">
                {/* Custom Avatar Placeholder */}
                <div className="h-9 w-9 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/10 flex items-center justify-center font-medium text-sm text-neutral-700 dark:text-neutral-300">
                  {follower.avatar}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                    {follower.name}
                  </span>
                  <span className="text-xs text-neutral-400 dark:text-neutral-500 truncate">
                    @{follower.username} • {follower.status}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 rounded-full text-xs font-medium border-neutral-200 hover:border-neutral-300 dark:border-neutral-800 dark:hover:border-neutral-700 px-3 transition-colors duration-200"
              >
                Follow
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Direct Chats */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-neutral-400 dark:text-neutral-500">
          <MessageSquare className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Direct Messages</span>
        </div>

        <div className="space-y-1">
          {dummyChats.map((chat) => (
            <div
              key={chat.id}
              className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-900/50 cursor-pointer transition-all duration-200 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative h-9 w-9 shrink-0 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/10 flex items-center justify-center font-medium text-sm text-neutral-700 dark:text-neutral-300">
                  {chat.avatar}
                  {chat.active && (
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-black" />
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                    {chat.name}
                  </span>
                  <span className={cn(
                    "text-xs truncate",
                    chat.unread > 0
                      ? "font-semibold text-neutral-900 dark:text-neutral-100"
                      : "text-neutral-400 dark:text-neutral-500"
                  )}>
                    {chat.lastMessage}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                  {chat.time}
                </span>
                {chat.unread > 0 && (
                  <span className="h-4.5 min-w-4.5 rounded-full bg-neutral-900 dark:bg-neutral-50 text-[10px] font-semibold text-white dark:text-black flex items-center justify-center px-1">
                    {chat.unread}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default RightSidebar;