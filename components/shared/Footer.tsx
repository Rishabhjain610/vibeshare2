"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Rss, Search, User, Clapperboard, Film, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const footerLinks = [
  { label: "Feed", href: "/", icon: Rss },
  { label: "Reels", href: "/reels", icon: Clapperboard },
  { label: "Explore", href: "/explore", icon: Search },
  { label: "AI Copilot", href: "/chat", icon: Sparkles },
  { label: "Create Reel", href: "/create-reel", icon: Film },
  { label: "Profile", href: "/profile", icon: User },
];

const Footer = () => {
  const pathname = usePathname();

  return (
    <footer className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-black/[0.05] dark:border-white/[0.08] bg-white/80 dark:bg-black/80 backdrop-blur-md z-50 flex items-center justify-around px-2 select-none shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
      {footerLinks.map((link) => {
        const isActive = pathname === link.href;
        const Icon = link.icon;

        return (
          <Link
            key={link.label}
            href={link.href}
            className={cn(
              "flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 dark:focus-visible:ring-neutral-300",
              isActive
                ? "text-neutral-950 dark:text-neutral-50 scale-110"
                : "text-neutral-400 hover:text-neutral-900 dark:text-neutral-500 dark:hover:text-neutral-200"
            )}
            aria-label={link.label}
          >
            <Icon className="h-5.5 w-5.5" />
          </Link>
        );
      })}
    </footer>
  );
};

export default Footer;