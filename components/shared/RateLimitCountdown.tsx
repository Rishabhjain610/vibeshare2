"use client";

import React, { useState, useEffect } from "react";
import { ShieldAlert, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RateLimitCountdownProps {
  initialResetSeconds: number;
}

export default function RateLimitCountdown({
  initialResetSeconds,
}: RateLimitCountdownProps) {
  const [secondsLeft, setSecondsLeft] = useState(initialResetSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft]);

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[50vh] p-6 text-center select-none animate-fade-in">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-red-500/20 rounded-full blur-2xl animate-pulse" />
        <div className="relative bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 p-4 rounded-3xl">
          <ShieldAlert className="h-10 w-10 text-red-500 dark:text-red-400" />
        </div>
      </div>

      <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50 mb-2">
        Rate Limit Exceeded
      </h1>
      <p className="text-neutral-500 dark:text-neutral-400 max-w-md mb-6 leading-relaxed">
        You are sending too many requests to this profile. To protect our systems and ensure high performance for everyone, we have temporarily rate limited your requests.
      </p>

      <div className="bg-white/40 dark:bg-zinc-950/45 backdrop-blur-md border border-black/[0.05] dark:border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-6 rounded-3xl mb-8 flex flex-col items-center min-w-[200px]">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1">
          Try Again In
        </span>
        <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-pink-500 font-mono tracking-tighter">
          {secondsLeft}s
        </span>
      </div>

      <Button
        onClick={handleRetry}
        disabled={secondsLeft > 0}
        className="rounded-full px-6 py-5 gap-2 bg-neutral-900 dark:bg-neutral-50 text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all duration-200 shadow-md font-medium"
      >
        <RefreshCw className={`h-4 w-4 ${secondsLeft > 0 ? "" : "animate-spin-slow"}`} />
        Retry Now
      </Button>
    </div>
  );
}
