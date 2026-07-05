"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Rss, Search, Bell, User, ChevronLeft, ChevronRight, Clapperboard, PlusSquare, Sun, Moon, LogIn, Film, MessageSquare } from "lucide-react";
import { UserButton, SignInButton, Show } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const sidebarLinks = [
  { label: "Feed", href: "/", icon: Rss },
  { label: "Reels", href: "/reels", icon: Clapperboard },
  { label: "Explore", href: "/explore", icon: Search },
  { label: "Messages", href: "/chat", icon: MessageSquare },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Create Post", href: "/create-post", icon: PlusSquare },
  { label: "Create Reel", href: "/create-reel", icon: Film },
  { label: "Profile", href: "/profile", icon: User },
];

const LeftSidebar = () => {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Read initial collapse state from localStorage if available
  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored === "true") {
      setIsCollapsed(true);
    }
  }, []);

  // Sync theme status on mount
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  const toggleCollapse = () => {
    const nextCollapsed = !isCollapsed;
    setIsCollapsed(nextCollapsed);
    localStorage.setItem("sidebar-collapsed", String(nextCollapsed));
  };

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);

    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <aside
      className={cn(
        "relative hidden md:flex flex-col sticky top-0 h-screen border-r border-black/[0.05] dark:border-white/[0.08] bg-white dark:bg-black transition-all duration-300 ease-in-out z-40 select-none shrink-0",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Floating Collapse Toggle Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={toggleCollapse}
        className="absolute right-0 translate-x-1/2 top-[18px] z-50 h-7 w-7 rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-black shadow-sm text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 dark:focus-visible:ring-neutral-300"
        aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </Button>
      {/* Sidebar Header: Logo Area */}
      <div className="h-16 flex items-center px-6 border-b border-black/[0.05] dark:border-white/[0.08]">
        <Link
          href="/"
          className={cn(
            "flex items-center group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 dark:focus-visible:ring-neutral-300 rounded-lg p-1",
            isCollapsed ? "" : "gap-2.5"
          )}
          aria-label="VibeShare Home"
        >
          <div className="flex items-center justify-center">
            {/* Unique monochrome geometric SVG Logo */}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-6.5 w-6.5 text-neutral-900 dark:text-neutral-50 transition-transform duration-250 ease-in-out group-hover:scale-105"
              aria-hidden="true"
            >
              <path
                d="M12 2L22 8.5V15.5L12 22L2 15.5V8.5L12 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 12V22"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 12L22 8.5M12 12L2 8.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="12" r="2" fill="currentColor" />
              <circle cx="12" cy="5.5" r="1.5" fill="currentColor" />
              <circle cx="6.5" cy="18.5" r="1.5" fill="currentColor" />
              <circle cx="17.5" cy="18.5" r="1.5" fill="currentColor" />
            </svg>
          </div>
          <span
            className={cn(
              "text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 transition-all duration-300",
              isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
            )}
          >
            VibeShare
          </span>
        </Link>
      </div>

      {/* Sidebar Body: Navigation Links */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 flex flex-col">
        {sidebarLinks.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;

          return (
            <Link
              key={link.label}
              href={link.href}
              className={cn(
                "flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 dark:focus-visible:ring-neutral-300",
                isActive
                  ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-neutral-200/40 dark:border-neutral-700/40"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50 hover:bg-neutral-50 dark:hover:bg-neutral-900/50"
              )}
              aria-label={link.label}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span
                className={cn(
                  "transition-all duration-300 whitespace-nowrap",
                  isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                )}
              >
                {link.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer: Theme Toggle & Auth & Collapse */}
      <div className="p-3 border-t border-black/[0.05] dark:border-white/[0.08] flex flex-col gap-3">
        {/* Theme Toggle & User Profile */}
        <div className={cn(
          "flex items-center gap-3",
          isCollapsed ? "flex-col justify-center" : "justify-between"
        )}>
          {/* Theme Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
            aria-label="Toggle Theme"
          >
            {theme === "light" ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>

          {/* Clerk Auth Integration */}
          <Show when="signed-in">
            <div className="flex items-center justify-center p-0.5">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8 rounded-full border border-black/5 dark:border-white/10"
                  }
                }}
              />
            </div>
          </Show>

          <Show when="signed-out">
            {isCollapsed ? (
              <SignInButton mode="modal">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full flex text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50 hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
                  aria-label="Sign In"
                >
                  <LogIn className="h-5 w-5" />
                </Button>
              </SignInButton>
            ) : null}
            
            <SignInButton mode="modal">
              <Button
                className={cn(
                  "rounded-full px-4 text-xs font-medium bg-neutral-950 hover:bg-neutral-800 text-neutral-50 dark:bg-neutral-50 dark:hover:bg-neutral-200 dark:text-neutral-950 transition-all duration-250 ease-in-out shadow-sm border border-neutral-200 dark:border-neutral-800 h-8",
                  isCollapsed ? "hidden" : "flex-1"
                )}
              >
                Sign In
              </Button>
            </SignInButton>
          </Show>
        </div>

      </div>
    </aside>
  );
};

export default LeftSidebar;