"use client";

import React from "react";
import Link from "next/link";
import { PlusSquare, PenLine } from "lucide-react";

interface QuickPostProps {
  user: {
    name: string | null;
    imageUrl: string | null;
    username: string;
  } | null;
}

export default function QuickPost({ user }: QuickPostProps) {
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : user?.username?.substring(0, 2).toUpperCase() || "VS";

  return (
    <div className="w-full overflow-hidden rounded-[2.2rem] bg-white/40 dark:bg-zinc-950/45 backdrop-blur-md border border-black/[0.05] dark:border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.015)] p-4 md:p-5 flex items-center gap-4 transition-all duration-300 hover:border-black/10 dark:hover:border-white/12">
      {/* User Avatar */}
      <div className="h-10 w-10 rounded-full border border-black/5 dark:border-white/10 bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center overflow-hidden shrink-0">
        {user?.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.imageUrl}
            alt="Your avatar"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-sm font-bold text-neutral-400 dark:text-neutral-500">
            {initials}
          </span>
        )}
      </div>

      {/* Styled Input Box mimicking trigger link */}
      <Link
        href="/create-post"
        className="flex-1 h-10 px-4.5 rounded-full bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] hover:bg-black/[0.04] dark:hover:bg-white/[0.05] flex items-center justify-between text-left text-neutral-400 dark:text-neutral-500 text-xs md:text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 dark:focus-visible:ring-neutral-300"
      >
        <span>Share what is on your mind...</span>
        <PenLine className="h-4 w-4 text-neutral-400 dark:text-neutral-500 shrink-0" />
      </Link>

      {/* Plus square quick button */}
      <Link href="/create-post">
        <button 
          className="h-10 w-10 rounded-full bg-indigo-65/5 hover:bg-indigo-600 hover:text-white text-indigo-500 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-950/40 flex items-center justify-center transition-all duration-200 hover:scale-103 shrink-0"
          aria-label="Create new post"
        >
          <PlusSquare className="h-5 w-5" />
        </button>
      </Link>
    </div>
  );
}
