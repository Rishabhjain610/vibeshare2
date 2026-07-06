"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface LayoutContainerProps {
  children: React.ReactNode;
}

export default function LayoutContainer({ children }: LayoutContainerProps) {
  const pathname = usePathname();
  const isChat = pathname === "/chat" || pathname?.startsWith("/chatwithsummary");
  
  return (
    <div className={cn("w-full flex flex-col gap-6 transition-all duration-300", isChat ? "max-w-6xl" : "max-w-3xl")}>
      {children}
    </div>
  );
}
