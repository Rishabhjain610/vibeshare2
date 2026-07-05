import React from "react";
import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { Bell, Heart, MessageCircle, UserPlus, Calendar, Sparkles, LogIn } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Relative timestamp formatter helper (Server-safe)
const formatNotificationTime = (dateInput: Date) => {
  const ms = Date.now() - dateInput.getTime();
  const mins = Math.floor(ms / 60000);
  const hrs = Math.floor(ms / 3600000);
  const days = Math.floor(ms / 86400000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 7) return `${days}d ago`;

  return dateInput.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

export default async function NotificationsPage() {
  // 1. Authenticate the user
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center select-none p-6 animate-fade-in">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-2xl animate-pulse" />
          <div className="relative bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-full">
            <Bell className="h-12 w-12 text-indigo-500 dark:text-indigo-400 animate-bounce" />
          </div>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50 mb-2">
          Sign In Required
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 max-w-sm mb-6 leading-relaxed text-sm">
          Please sign in to your VibeShare account to view your notifications and follower updates.
        </p>
        <Link href="/sign-in">
          <Button className="rounded-full px-6 py-5 bg-indigo-600 hover:bg-indigo-500 text-white shadow-md font-medium transition-all duration-200 flex items-center gap-2">
            <LogIn className="h-4 w-4" />
            Sign In to Account
          </Button>
        </Link>
      </div>
    );
  }

  const userId = clerkUser.id;

  // 2. Fetch Notifications from database
  const notifications = await prisma.notifications.findMany({
    where: {
      userId: userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      User_Notifications_creatorIdToUser: {
        select: {
          id: true,
          name: true,
          username: true,
          imageUrl: true,
        },
      },
      Post: {
        select: {
          id: true,
          caption: true,
          mediaUrl: true,
        },
      },
      Comment: {
        select: {
          id: true,
          content: true,
        },
      },
    },
  });

  return (
    <div className="w-full flex flex-col gap-6 pb-12 select-none animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-neutral-900 dark:text-neutral-50 bg-gradient-to-r from-neutral-900 via-indigo-950 to-neutral-900 dark:from-neutral-50 dark:via-indigo-200 dark:to-neutral-50 bg-clip-text text-transparent flex items-center gap-2">
          <Bell className="h-7 w-7 text-indigo-600 dark:text-indigo-400 shrink-0" />
          Notifications
        </h1>
        <p className="text-xs text-neutral-400 dark:text-neutral-500 font-semibold mt-0.5">
          Stay updated with your likes, comments, and new followers
        </p>
      </div>

      {/* Notifications List Container */}
      <div className="w-full overflow-hidden rounded-[2.5rem] bg-white/40 dark:bg-zinc-950/45 backdrop-blur-md border border-black/[0.05] dark:border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.02)] p-4 md:p-6 flex flex-col gap-4">
        {notifications.length > 0 ? (
          <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
            {notifications.map((notification) => {
              const creator = notification.User_Notifications_creatorIdToUser;
              
              // 3. Determine notification type based on relationships
              let type: "like" | "comment" | "follow" = "follow";
              if (notification.commentId) {
                type = "comment";
              } else if (notification.postId) {
                type = "like";
              }

              return (
                <div
                  key={notification.id}
                  className="flex items-center justify-between gap-4 py-4.5 first:pt-0 last:pb-0 group"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    {/* Status Icon badge */}
                    <div className="relative shrink-0 mt-0.5">
                      <Link href={`/profile/${creator.username}`}>
                        <div className="h-10 w-10 rounded-full border border-black/5 dark:border-white/10 bg-neutral-100 dark:bg-neutral-900 overflow-hidden flex items-center justify-center">
                          {creator.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={creator.imageUrl}
                              alt={`${creator.username}'s avatar`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="font-bold text-sm text-neutral-500 uppercase">
                              {creator.username.substring(0, 2)}
                            </span>
                          )}
                        </div>
                      </Link>
                      
                      {/* Sub-Icon overlay */}
                      <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center text-white border-2 border-white dark:border-zinc-950 shadow-sm scale-90">
                        {type === "like" && (
                          <span className="bg-rose-500 h-full w-full rounded-full flex items-center justify-center">
                            <Heart className="h-2.5 w-2.5 fill-white text-white" />
                          </span>
                        )}
                        {type === "comment" && (
                          <span className="bg-indigo-500 h-full w-full rounded-full flex items-center justify-center">
                            <MessageCircle className="h-2.5 w-2.5 fill-white text-white" />
                          </span>
                        )}
                        {type === "follow" && (
                          <span className="bg-violet-500 h-full w-full rounded-full flex items-center justify-center">
                            <UserPlus className="h-2.5 w-2.5 text-white" />
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Content Details */}
                    <div className="flex flex-col min-w-0">
                      <p className="text-xs md:text-sm text-neutral-800 dark:text-neutral-200 leading-normal font-medium">
                        <Link
                          href={`/profile/${creator.username}`}
                          className="font-bold text-neutral-900 dark:text-neutral-100 hover:underline"
                        >
                          {creator.name || creator.username}
                        </Link>{" "}
                        {type === "like" && "liked your post."}
                        {type === "comment" && `commented: "${notification.Comment?.content}"`}
                        {type === "follow" && "started following you."}
                      </p>
                      
                      <span className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 mt-1 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatNotificationTime(notification.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Right side preview/action button */}
                  {type === "follow" ? (
                    <Link href={`/profile/${creator.username}`} className="shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-full text-[10px] font-black tracking-wider uppercase border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900"
                      >
                        View Profile
                      </Button>
                    </Link>
                  ) : (
                    notification.Post && (
                      <Link href={notification.Post.mediaUrl?.match(/\.(mp4|webm|ogg|mov|m4v)/i) ? "/reels" : "/"} className="shrink-0">
                        <div className="h-10 w-10 rounded-xl overflow-hidden border border-black/[0.05] dark:border-white/[0.08] bg-neutral-100 dark:bg-neutral-900 relative group-hover:scale-105 transition-transform duration-200">
                          {notification.Post.mediaUrl ? (
                            notification.Post.mediaUrl.match(/\.(mp4|webm|ogg|mov|m4v)/i) ? (
                              <video
                                src={notification.Post.mediaUrl}
                                muted
                                playsInline
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={notification.Post.mediaUrl}
                                alt="Post attachment preview"
                                className="h-full w-full object-cover"
                              />
                            )
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-indigo-50/40 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-extrabold text-[9px] uppercase">
                              Text
                            </div>
                          )}
                        </div>
                      </Link>
                    )
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 text-center select-none">
            <div className="bg-neutral-100 dark:bg-neutral-900 p-4.5 rounded-3xl mb-4 border border-black/[0.03] dark:border-white/[0.05]">
              <Sparkles className="h-8 w-8 text-indigo-500 dark:text-indigo-400 animate-pulse" />
            </div>
            <h4 className="font-extrabold text-neutral-800 dark:text-neutral-200 mb-1.5 text-base md:text-lg">
              All Caught Up!
            </h4>
            <p className="text-xs md:text-sm text-neutral-400 dark:text-neutral-500 max-w-xs leading-relaxed">
              You don&apos;t have any notifications right now. Keep sharing and interacting to get matching updates!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
