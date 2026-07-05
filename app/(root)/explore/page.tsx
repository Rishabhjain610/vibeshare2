"use client";

import React, { useState, useEffect } from "react"; // React hooks (useState aur useEffect) state management ke liye.
import axios from "axios"; // API requests bhejne ke liye Axios client.
import { Search, Loader2, X, Users, Rss, ArrowRight } from "lucide-react"; // Icons import kiye.
import Link from "next/link"; // Client-side routing ke liye Next.js Link.
import { useDebounce } from "@/hooks/useDebounce"; // Custom useDebounce hook search inputs ko delay (throttle) karne ke liye.
import PostCard from "@/components/cards/PostCard"; // Post render karne ke liye generic PostCard component.

// TypeScript interfaces search structures represent karne ke liye
interface UserType {
  id: string;
  name: string | null;
  username: string;
  imageUrl: string | null;
  bio: string | null;
  postsCount: number;
}

interface PostType {
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
}

export default function ExploreSearchPage() {
  const [searchTerm, setSearchTerm] = useState(""); // Search bar ke typing text ki raw local state.
  const debouncedSearch = useDebounce(searchTerm, 300); // 300ms ke delay ke sath debounced state key create ki.
  const [results, setResults] = useState<{ users: UserType[]; posts: PostType[] }>({
    users: [],
    posts: [],
  }); // Search result values hold karne ke liye state.
  const [isLoading, setIsLoading] = useState(false); // API lookup loading spinner state.
  const [activeTab, setActiveTab] = useState<"posts" | "users">("posts"); // Active category selection tab ("posts" ya "users").

  // useEffect triggers tab humari debounced query value change hoti hai.
  // Jab user typing rok dega aur 300ms beet jayenge tabhi yeh trigger hoga.
  useEffect(() => {
    const fetchSearchResults = async () => {
      // Best Practice: Agar search query 2 character se choti hai, toh state reset karke call bypass kar denge.
      if (debouncedSearch.length < 2) {
        setResults({ users: [], posts: [] });
        return;
      }

      setIsLoading(true); // Loading spinner show karenge.

      try {
        // Axios client se backend API GET `/api/search?q=query` hit karenge.
        const response = await axios.get("/api/search", {
          params: { q: debouncedSearch },
        });

        // Backend response data ko state mein save karenge.
        setResults(response.data);
      } catch (error) {
        console.error("[Explore] Search request failed:", error);
      } finally {
        setIsLoading(false); // loading block complete.
      }
    };

    fetchSearchResults();
  }, [debouncedSearch]); // Dependency array: sirf debounced query change hone par hi API hit hogi.

  // Clear button click par text input aur results reset karne ka helper.
  const handleClearSearch = () => {
    setSearchTerm("");
    setResults({ users: [], posts: [] });
  };

  return (
    <div className="w-full flex flex-col gap-6 select-none animate-fade-in">
      {/* 1. Page Header Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-neutral-900 dark:text-neutral-50 bg-gradient-to-r from-neutral-900 via-indigo-950 to-neutral-900 dark:from-neutral-50 dark:via-indigo-200 dark:to-neutral-50 bg-clip-text text-transparent">
          Explore
        </h1>
        <p className="text-xs text-neutral-400 dark:text-neutral-500 font-semibold mt-0.5">
          Find posts, hashtags, locations, or other vibesters
        </p>
      </div>

      {/* 2. Premium Search Input Container */}
      <div className="relative w-full overflow-hidden rounded-[2rem] bg-white/40 dark:bg-zinc-950/45 backdrop-blur-md border border-black/[0.05] dark:border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.015)] p-2 flex items-center">
        <div className="pl-4 pr-2 text-neutral-400 dark:text-neutral-500 shrink-0">
          <Search className="h-5 w-5" />
        </div>
        <input
          type="text"
          placeholder="Search creators, hashtags (#nature), captions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)} // User input typed characters state mein save kar raha hai
          className="flex-1 bg-transparent border-0 text-sm py-2.5 px-1 outline-none text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 font-semibold"
        />
        {searchTerm && (
          // Clear Search button: sirf tabhi show hoga jab input field me koi text ho.
          <button
            onClick={handleClearSearch}
            className="h-8 w-8 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-500 dark:text-neutral-400 flex items-center justify-center transition-colors duration-200 mr-2"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* 3. Category Tabs (Switch posts vs users results) */}
      <div className="flex gap-2.5 border-b border-black/[0.04] dark:border-white/[0.04] pb-2 mt-1">
        <button
          onClick={() => setActiveTab("posts")}
          className={`px-4.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
            activeTab === "posts"
              ? "bg-neutral-950 text-neutral-50 dark:bg-neutral-50 dark:text-neutral-950 shadow-md shadow-black/5"
              : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
          }`}
        >
          Posts ({results.posts.length})
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
            activeTab === "users"
              ? "bg-neutral-950 text-neutral-50 dark:bg-neutral-50 dark:text-neutral-950 shadow-md shadow-black/5"
              : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
          }`}
        >
          Users ({results.users.length})
        </button>
      </div>

      {/* 4. Results Render Block */}
      <div className="flex flex-col gap-6">
        {isLoading ? (
          /* Case A: Loading Spinner State */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Loader2 className="h-9 w-9 animate-spin text-indigo-500 dark:text-indigo-400 mb-3" />
            <p className="text-xs text-neutral-400 dark:text-neutral-500 font-semibold uppercase tracking-wider">
              Searching the database...
            </p>
          </div>
        ) : searchTerm.length < 2 ? (
          /* Case B: Welcome/Placeholder state before typing query */
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white/20 dark:bg-zinc-950/20 rounded-[2.5rem] border border-dashed border-black/[0.08] dark:border-white/[0.1] p-8">
            <div className="bg-indigo-55/5 dark:bg-indigo-950/20 p-4.5 rounded-3xl mb-4 border border-indigo-100/50 dark:border-indigo-950/40">
              <Search className="h-8 w-8 text-indigo-500 dark:text-indigo-400" />
            </div>
            <h4 className="font-extrabold text-neutral-800 dark:text-neutral-200 mb-1 text-base md:text-lg">
              Start Searching
            </h4>
            <p className="text-xs md:text-sm text-neutral-400 dark:text-neutral-500 max-w-xs leading-relaxed">
              Type at least 2 characters to search for posts, hashtags (#fun), users, or locations.
            </p>
          </div>
        ) : activeTab === "posts" ? (
          /* Case C: Render POSTS search results */
          results.posts.length > 0 ? (
            results.posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))
          ) : (
            /* Empty Posts results state */
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white/20 dark:bg-zinc-950/20 rounded-[2.5rem] border border-dashed border-black/[0.08] dark:border-white/[0.1] p-8">
              <Rss className="h-8 w-8 text-neutral-400 dark:text-neutral-500 mb-3.5" />
              <h4 className="font-bold text-neutral-800 dark:text-neutral-200 mb-1 text-base">
                No Posts Found
              </h4>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 max-w-xs">
                We could not find any posts matching &quot;{searchTerm}&quot;. Try checking your spelling or hashtags.
              </p>
            </div>
          )
        ) : (
          /* Case D: Render USERS search results */
          results.users.length > 0 ? (
            <div className="grid grid-cols-1 gap-4.5">
              {results.users.map((user) => (
                <div
                  key={user.id}
                  className="w-full overflow-hidden rounded-[2rem] bg-white/40 dark:bg-zinc-950/45 backdrop-blur-md border border-black/[0.05] dark:border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.015)] p-4 md:p-5 flex items-center justify-between gap-4 transition-all duration-300 hover:shadow-md hover:border-black/[0.08] dark:hover:border-white/[0.12] group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* User Profile photo avatar */}
                    <div className="h-11 w-11 rounded-full border border-black/5 dark:border-white/10 bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center overflow-hidden shrink-0">
                      {user.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={user.imageUrl}
                          alt={`${user.name || user.username}'s avatar`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-black text-neutral-400 dark:text-neutral-500">
                          {user.username.substring(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-neutral-900 dark:text-neutral-50 truncate group-hover:underline">
                        {user.name || user.username}
                      </span>
                      <span className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 mt-0.5">
                        @{user.username}
                      </span>
                      {user.bio && (
                        <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-medium truncate max-w-[180px] md:max-w-[320px] mt-1">
                          {user.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* View Profile Action Link Button */}
                  <Link href={`/profile/${user.username}`}>
                    <button className="h-9.5 px-4 rounded-xl bg-black/[0.03] hover:bg-neutral-950 hover:text-white dark:bg-white/[0.04] dark:hover:bg-white dark:hover:text-black text-neutral-800 dark:text-neutral-200 border border-black/[0.04] dark:border-white/[0.06] flex items-center gap-1.5 text-xs font-bold transition-all duration-200 hover:scale-102 shrink-0">
                      <span>View Profile</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            /* Empty Users results state */
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white/20 dark:bg-zinc-950/20 rounded-[2.5rem] border border-dashed border-black/[0.08] dark:border-white/[0.1] p-8">
              <Users className="h-8 w-8 text-neutral-400 dark:text-neutral-500 mb-3.5" />
              <h4 className="font-bold text-neutral-800 dark:text-neutral-200 mb-1 text-base">
                No Users Found
              </h4>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 max-w-xs">
                We could not find any creators matching &quot;{searchTerm}&quot;. Make sure the username is spelled correctly.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
