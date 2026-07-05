import React from "react";
import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { LogIn, MessageSquare } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ChatDashboardClient from "@/components/shared/ChatDashboardClient";

interface ChatPageProps {
  searchParams?: Promise<{ userId?: string }>;
}

export default async function ChatPage({ searchParams }: ChatPageProps) {
  // 1. Authenticate user on the server
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center select-none p-6 animate-fade-in">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-2xl animate-pulse" />
          <div className="relative bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-full">
            <MessageSquare className="h-12 w-12 text-indigo-500 dark:text-indigo-400 animate-pulse" />
          </div>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50 mb-2">
          Sign In Required
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 max-w-sm mb-6 leading-relaxed text-sm">
          Please sign in to your VibeShare account to start messaging and chatting with other creators.
        </p>
        <Link href="/sign-in">
          <Button className="rounded-full px-6 py-5 bg-indigo-600 hover:bg-indigo-500 text-white shadow-md font-medium transition-all duration-200 flex items-center gap-2">
            <LogIn className="h-4 w-4" />
            Sign In to Chat
          </Button>
        </Link>
      </div>
    );
  }

  const currentUserId = clerkUser.id;
  const resolvedSearchParams = await searchParams;
  const targetUserId = resolvedSearchParams?.userId;

  // 2. Query all other users from the database for the chat list sidebar
  const otherUsers = await prisma.user.findMany({
    where: {
      id: { not: currentUserId },
    },
    select: {
      id: true,
      name: true,
      username: true,
      imageUrl: true,
      bio: true,
    },
    orderBy: {
      username: "asc",
    },
  });

  return (
    <div className="w-full flex flex-col gap-4 pb-8 select-none animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-neutral-900 dark:text-neutral-50 bg-gradient-to-r from-neutral-900 via-indigo-950 to-neutral-900 dark:from-neutral-50 dark:via-indigo-200 dark:to-neutral-50 bg-clip-text text-transparent flex items-center gap-2">
          <MessageSquare className="h-7 w-7 text-indigo-600 dark:text-indigo-400 shrink-0" />
          Vibe Messages
        </h1>
        <p className="text-xs text-neutral-400 dark:text-neutral-500 font-semibold mt-0.5">
          Real-time chat messaging with AI-powered conversation summaries
        </p>
      </div>

      {/* Render the Client Dashboard to handle Socket connections and dynamic chat panels */}
      <ChatDashboardClient 
        users={otherUsers}
        currentUserId={currentUserId}
        _currentUserAvatar={clerkUser.imageUrl}
        defaultUserId={targetUserId}
      />
    </div>
  );
}
