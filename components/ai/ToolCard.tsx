"use client";

import React from "react";
import { Wrench, CheckCircle, Loader2, BarChart2 } from "lucide-react";
import { motion } from "framer-motion";

interface ToolCardProps {
  toolName: string;
  state: "call" | "result" | "error";
  args?: any;
  result?: any;
  error?: string;
}

export function ToolCard({ toolName, state, args, result, error }: ToolCardProps) {
  // In AI SDK v7, toolName might be the full type like "tool-searchLatestNews"
  const displayName = toolName?.startsWith("tool-") ? toolName.slice(5) : toolName;
  // Check if we are rendering performance chart data
  const isChart = displayName === "generateChartData" && state === "result" && Array.isArray(result);
  const isError = state === "error" || !!error;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-3 max-w-2xl rounded-xl border border-neutral-200/80 dark:border-zinc-800/80 bg-neutral-50/50 dark:bg-zinc-950/70 p-4 backdrop-blur-sm shadow-sm"
    >
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-neutral-200/60 dark:border-zinc-800/60 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            {isChart ? <BarChart2 className="h-4 w-4" /> : <Wrench className="h-3.5 w-3.5" />}
          </div>
          <div>
            <h4 className="text-xs font-bold text-neutral-800 dark:text-zinc-200 capitalize">
              {isChart ? "Performance Breakdown Chart" : displayName.replace(/([A-Z])/g, " $1").trim() + " Tool"}
            </h4>
            <span className="text-[9px] font-bold text-neutral-400 dark:text-zinc-500 uppercase tracking-wider">
              {isChart ? "Visual Analytics Report" : "AI Agent Execution"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {isError ? (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-full">
              ⚠ Error
            </span>
          ) : state === "call" ? (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full">
              <Loader2 className="h-2.5 w-2.5 animate-spin" />
              Running
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <CheckCircle className="h-2.5 w-2.5" />
              Completed
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3 text-xs">
        {/* Render input params */}
        {args && !isChart && (
          <div>
            <span className="text-[10px] font-bold text-neutral-400 dark:text-zinc-500 uppercase tracking-wider">Input parameters:</span>
            <pre className="mt-1 p-2 bg-neutral-100/80 dark:bg-zinc-900/50 border border-neutral-200/80 dark:border-zinc-800/40 rounded-lg text-neutral-800 dark:text-zinc-300 font-mono text-[10px] overflow-x-auto">
              {JSON.stringify(args, null, 2)}
            </pre>
          </div>
        )}

        {/* Visual Chart rendering for generateChartData */}
        {isChart ? (
          <div className="mt-2.5 pt-1">
            {/* Draw Columns Chart */}
            <div className="flex items-end justify-between h-40 gap-3 px-2 border-b border-neutral-200 dark:border-zinc-800/80 pb-1">
              {result.map((item: any, idx: number) => {
                // Find max likes in set to scale bar heights dynamically
                const maxLikes = Math.max(...result.map((r: any) => r.likes), 10);
                const heightPercentage = Math.min((item.likes / maxLikes) * 100, 100);

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center group h-full justify-end relative">
                    {/* Tooltip on Hover */}
                    <div className="absolute bottom-full mb-2 bg-neutral-900 dark:bg-zinc-950 border border-neutral-800 dark:border-zinc-800 text-[10px] text-zinc-300 px-2 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-10 w-28 text-center font-sans">
                      <p className="font-bold text-zinc-200 truncate">{item.caption}</p>
                      <p className="mt-0.5 text-blue-400 font-semibold">{item.likes} Likes</p>
                      <p className="text-zinc-500 text-[9px]">{item.comments} Comments</p>
                    </div>

                    {/* Likes Bar */}
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPercentage}%` }}
                      transition={{ duration: 0.5, delay: idx * 0.05 }}
                      className="w-full min-h-[4px] rounded-t-md bg-gradient-to-t from-blue-600 to-blue-500 group-hover:from-blue-500 group-hover:to-blue-400 transition-colors shadow-sm"
                    />
                  </div>
                );
              })}
            </div>

            {/* X-Axis Labels */}
            <div className="flex justify-between mt-2.5 px-2 text-[10px] text-neutral-400 dark:text-zinc-500 font-semibold uppercase tracking-wider">
              {result.map((item: any, idx: number) => (
                <span key={idx} className="flex-1 text-center truncate">{item.date}</span>
              ))}
            </div>
            
            {/* Chart Legend */}
            <div className="flex justify-center gap-4 mt-4 pt-1.5 border-t border-neutral-200 dark:border-zinc-900/60 text-[9px] text-neutral-400 dark:text-zinc-400 font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-blue-500" /> Post Likes
              </span>
            </div>
          </div>
        ) : (
          /* Default raw JSON results display for standard tools */
          state === "result" && result && (
            <div>
              <span className="text-[10px] font-bold text-neutral-400 dark:text-zinc-500 uppercase tracking-wider">Output results:</span>
              <pre className="mt-1 p-2 bg-neutral-100/85 dark:bg-zinc-900 border border-neutral-200/80 dark:border-zinc-800 rounded-lg text-neutral-800 dark:text-zinc-300 font-mono text-[10px] overflow-x-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )
        )}
      </div>
    </motion.div>
  );
}
