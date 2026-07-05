import React from "react";
import { headers } from "next/headers";
import Link from "next/link";
import { MapPin, Link2, Calendar, Heart, MessageCircle, FileText, Compass, Sparkles, Edit3, MessageSquare } from "lucide-react";
import { rateLimit } from "@/lib/rate-limiter";
import { getProfileByUsername } from "@/lib/profile-service";
import RateLimitCountdown from "@/components/shared/RateLimitCountdown";
import { Button } from "@/components/ui/button";
import { currentUser } from "@clerk/nextjs/server";
import ProfileFollowButton from "@/components/shared/ProfileFollowButton";
import prisma from "@/lib/prisma";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function UserProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;

  // 1. Get Client IP for rate limiting
  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0] ||
    headerList.get("x-real-ip") ||
    "127.0.0.1";

  // 2. Perform Rate Limiting check
  const limitResult = await rateLimit(ip, `profile_page:${username.toLowerCase()}`);

  if (!limitResult.success) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <RateLimitCountdown initialResetSeconds={limitResult.reset} />
      </div>
    );
  }

  // 3. Fetch User Profile from service (using Redis Cache)
  const profile = await getProfileByUsername(username);

  // 4. Render Not Found UI if user does not exist
  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center select-none p-6 animate-fade-in">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-2xl animate-pulse" />
          <div className="relative bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-full">
            <Compass className="h-12 w-12 text-indigo-500 dark:text-indigo-400 animate-spin-slow" />
          </div>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50 mb-2">
          Profile Not Found
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 max-w-md mb-8">
          The username <span className="font-semibold text-neutral-800 dark:text-neutral-200">@{username}</span> doesn&apos;t exist or may have been deleted. Check the spelling or search for another user.
        </p>
        <Link href="/">
          <Button className="rounded-full px-6 py-5 bg-neutral-900 dark:bg-neutral-50 text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 shadow-md font-medium transition-all duration-200">
            Back to Home Feed
          </Button>
        </Link>
      </div>
    );
  }

  // 5. Check if logged-in user is viewing their own profile
  const clerkUser = await currentUser();
  const isOwnProfile = clerkUser?.id === profile.clerkId;

  // Check if current user is following this profile
  let isFollowing = false;
  if (clerkUser) {
    const followRecord = await prisma.followers.findUnique({
      where: {
        followerId_followingId: {
          followerId: clerkUser.id,
          followingId: profile.id,
        },
      },
    });
    isFollowing = !!followRecord;
  }

  // 6. Format Join Date
  const joinDate = new Date(profile.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Initials for avatar fallback
  const initials = profile.name
    ? profile.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : username.substring(0, 2).toUpperCase();

  return (
    <div className="w-full flex flex-col gap-8 pb-12 select-none animate-fade-in">
      {/* Profile Container Card */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-white/40 dark:bg-zinc-950/45 backdrop-blur-md border border-black/[0.05] dark:border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.02)] flex flex-col">
        
        {/* Banner area with abstract colorful gradient */}
        <div className="relative h-32 md:h-40 w-full bg-gradient-to-r from-indigo-500/20 via-purple-500/25 to-pink-500/20 border-b border-black/[0.05] dark:border-white/[0.08] overflow-hidden">
          <div className="absolute top-10 left-10 w-32 h-32 bg-indigo-500/25 rounded-full blur-3xl" />
          <div className="absolute bottom-5 right-20 w-32 h-32 bg-pink-500/20 rounded-full blur-3xl" />
        </div>

        {/* Profile Card Content */}
        <div className="px-6 md:px-8 pb-6 md:pb-8 flex flex-col">
          {/* Avatar and Action Button row */}
          <div className="flex justify-between items-end -mt-14 md:-mt-16 mb-4">
            {/* Avatar / Profile Image */}
            <div className="relative shrink-0">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-pink-500 rounded-full blur-[2px] opacity-70" />
              <div className="relative h-24 w-24 md:h-28 md:w-28 rounded-full border-4 border-white dark:border-zinc-950 bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center overflow-hidden">
                {profile.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.imageUrl}
                    alt={`${profile.name || username}'s avatar`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-2xl md:text-3xl font-black tracking-tight text-neutral-400 dark:text-neutral-500">
                    {initials}
                  </span>
                )}
              </div>
            </div>

            {/* Action Button: Edit Profile if own profile, else Follow */}
            <div className="z-10 flex items-center gap-2">
              {isOwnProfile ? (
                <Link href="/onboarding">
                  <Button className="rounded-full px-5 py-2.5 bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold border border-black/5 dark:border-white/10 transition-all duration-200 hover:scale-102 flex items-center gap-1.5 text-xs md:text-sm">
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit Profile
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href={`/chat?userId=${profile.id}`}>
                    <Button className="rounded-full px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md transition-all duration-200 hover:scale-102 flex items-center gap-1.5 text-xs md:text-sm active:scale-95">
                      <MessageSquare className="h-4 w-4" />
                      Chat
                    </Button>
                  </Link>
                  <ProfileFollowButton
                    targetUserId={profile.id}
                    initialIsFollowing={isFollowing}
                  />
                </>
              )}
            </div>
          </div>

          {/* User Bio Details */}
          <div className="flex flex-col gap-2">
            <div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-neutral-900 dark:text-neutral-50">
                {profile.name || username}
              </h2>
              <span className="text-sm font-semibold text-indigo-500 dark:text-indigo-400">
                @{profile.username}
              </span>
            </div>

            {/* Bio text */}
            {profile.bio ? (
              <p className="text-sm md:text-base text-neutral-600 dark:text-neutral-300 mt-2 max-w-xl leading-relaxed">
                {profile.bio}
              </p>
            ) : (
              <p className="text-xs italic text-neutral-400 dark:text-neutral-500 mt-1">
                No bio set yet.
              </p>
            )}

            {/* Metadata Badges */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 pt-3 border-t border-black/[0.03] dark:border-white/[0.04]">
              {profile.location && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-400 dark:text-neutral-500 bg-black/[0.02] dark:bg-white/[0.03] px-3 py-1.5 rounded-full border border-black/[0.03] dark:border-white/[0.05]">
                  <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                  <span>{profile.location}</span>
                </div>
              )}
              {profile.website && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-500 dark:text-indigo-400 bg-black/[0.02] dark:bg-white/[0.03] hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 px-3 py-1.5 rounded-full border border-indigo-100/50 dark:border-indigo-950/40 transition-colors">
                  <Link2 className="h-3.5 w-3.5" />
                  <a
                    href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {profile.website.replace(/(^\w+:|^)\/\//, "")}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-400 dark:text-neutral-500">
                <Calendar className="h-3.5 w-3.5" />
                <span>Joined {joinDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid Footer */}
        <div className="grid grid-cols-3 divide-x divide-black/[0.05] dark:divide-white/[0.08] border-t border-black/[0.05] dark:border-white/[0.08] bg-black/[0.01] dark:bg-white/[0.01]">
          <div className="flex flex-col items-center justify-center py-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer">
            <span className="text-xl md:text-2xl font-black tracking-tight text-neutral-900 dark:text-neutral-50">
              {profile.postsCount}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mt-0.5">
              Posts
            </span>
          </div>
          <div className="flex flex-col items-center justify-center py-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer">
            <span className="text-xl md:text-2xl font-black tracking-tight text-neutral-900 dark:text-neutral-50">
              {profile.followersCount}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mt-0.5">
              Followers
            </span>
          </div>
          <div className="flex flex-col items-center justify-center py-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer">
            <span className="text-xl md:text-2xl font-black tracking-tight text-neutral-900 dark:text-neutral-50">
              {profile.followingCount}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mt-0.5">
              Following
            </span>
          </div>
        </div>
      </div>

      {/* User Posts Section */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2 border-b border-black/[0.05] dark:border-white/[0.08] pb-3">
          <FileText className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
          <h3 className="font-extrabold text-lg text-neutral-900 dark:text-neutral-50">
            Recent Posts
          </h3>
        </div>

        {profile.Post && profile.Post.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {profile.Post.map((post) => (
              <div
                key={post.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-[2rem] bg-white/40 dark:bg-zinc-950/45 border border-black/[0.05] dark:border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.01)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-black/10 dark:hover:border-white/15 h-64 cursor-pointer"
              >
                {post.mediaUrl ? (
                  <>
                    {post.mediaUrl.match(/\.(mp4|webm|ogg|mov|m4v)/i) || post.mediaUrl.includes(".mp4") ? (
                      <video
                        src={post.mediaUrl}
                        muted
                        playsInline
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.mediaUrl}
                        alt={post.caption || "Post media"}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 gap-6 text-white font-bold text-lg">
                      <div className="flex items-center gap-1.5 animate-scale-up">
                        <Heart className="h-5 w-5 fill-white" />
                        <span>{post.likesCount}</span>
                      </div>
                      <div className="flex items-center gap-1.5 animate-scale-up">
                        <MessageCircle className="h-5 w-5 fill-white" />
                        <span>{post.commentsCount}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-6 flex flex-col justify-between h-full bg-gradient-to-tr from-indigo-50/50 via-purple-50/30 to-pink-50/50 dark:from-zinc-900/50 dark:via-zinc-900/40 dark:to-zinc-900/50">
                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 line-clamp-5 leading-relaxed">
                      {post.caption}
                    </p>

                    <div className="flex items-center justify-between border-t border-black/[0.05] dark:border-white/[0.08] pt-3 mt-4 text-xs font-semibold text-neutral-400 dark:text-neutral-500">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Heart className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400" />
                          {post.likesCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                          {post.commentsCount}
                        </span>
                      </div>
                      <span>
                        {new Date(post.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 text-center select-none bg-white/20 dark:bg-zinc-950/20 rounded-[2.5rem] border border-dashed border-black/[0.08] dark:border-white/[0.1] p-8">
            <div className="bg-neutral-100 dark:bg-neutral-900 p-4.5 rounded-3xl mb-4 border border-black/[0.03] dark:border-white/[0.05]">
              <Sparkles className="h-8 w-8 text-indigo-500 dark:text-indigo-400 animate-pulse" />
            </div>
            <h4 className="font-extrabold text-neutral-800 dark:text-neutral-200 mb-1.5 text-base md:text-lg">
              No Posts Yet
            </h4>
            <p className="text-xs md:text-sm text-neutral-400 dark:text-neutral-500 max-w-xs leading-relaxed">
              @{profile.username} hasn&apos;t shared any posts on their timeline. Check back later!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
