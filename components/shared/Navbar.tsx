"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Sun, Moon } from "lucide-react";
import { UserButton, SignInButton, Show } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  // Initialize theme
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme || (systemPrefersDark ? "dark" : "light");

    setTheme(initialTheme);
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

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

  if (!mounted) {
    return (
      <header className="md:hidden sticky top-0 z-50 w-full h-16 border-b border-black/[0.05] dark:border-white/[0.08] bg-white/75 dark:bg-black/75 backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
            <span className="hidden md:inline-block text-lg font-semibold bg-neutral-200 dark:bg-neutral-800 h-5 w-20 animate-pulse rounded" />
          </div>
          <div className="h-8 w-8 rounded-full bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
        </div>
      </header>
    );
  }

  return (
    <header className="md:hidden sticky top-0 z-50 w-full h-16 border-b border-black/[0.05] dark:border-white/[0.08] bg-white/75 dark:bg-black/75 backdrop-blur-md transition-colors duration-250 ease-in-out">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left Side: Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 dark:focus-visible:ring-neutral-300 rounded-lg p-1"
          aria-label="VibeShare Home"
        >
          <div className="flex items-center justify-center">
            {/* Custom SVG Logo */}
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
          <span className="hidden md:inline-block text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 transition-opacity duration-250 ease-in-out group-hover:opacity-80">
            VibeShare
          </span>
        </Link>

        {/* Right Side: Mobile Controls */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-black/[0.03] dark:hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 dark:focus-visible:ring-neutral-300"
            aria-label="Toggle Theme"
          >
            {theme === "light" ? (
              <Moon className="h-4.5 w-4.5 transition-transform duration-250 ease-in-out" />
            ) : (
              <Sun className="h-4.5 w-4.5 transition-transform duration-250 ease-in-out" />
            )}
          </Button>

          {/* Clerk Auth Integration */}
          <Show when="signed-in">
            <div className="flex items-center p-0.5">
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
            <SignInButton mode="modal">
              <Button
                size="sm"
                className="rounded-full px-3 text-xs font-medium bg-neutral-950 hover:bg-neutral-800 text-neutral-50 dark:bg-neutral-50 dark:hover:bg-neutral-200 dark:text-neutral-950 transition-all duration-250 ease-in-out shadow-sm"
              >
                Sign In
              </Button>
            </SignInButton>
          </Show>
        </div>
      </div>
    </header>
  );
};

export default Navbar;