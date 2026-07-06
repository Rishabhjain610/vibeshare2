"use client";

import React, { useState, useEffect } from "react";
import { Brain, Cpu, Sparkles, CheckCircle2, ChevronRight } from "lucide-react";

interface AgentStatusProps {
  status: string;
}

export function AgentStatus({ status }: AgentStatusProps) {
  const [stages, setStages] = useState<{ id: string; label: string; icon: any; status: "pending" | "running" | "done" }[]>([
    { id: "planner", label: "Planner Agent Thinking...", icon: <Brain className="h-3 w-3" />, status: "running" },
    { id: "analytics", label: "Analytics Agent Running...", icon: <Cpu className="h-3 w-3" />, status: "pending" },
    { id: "content", label: "Generating Response...", icon: <Sparkles className="h-3 w-3" />, status: "pending" }
  ]);

  useEffect(() => {
    if (status === "streaming") {
      const timer1 = setTimeout(() => {
        setStages(prev => prev.map(s => s.id === "planner" ? { ...s, status: "done" } : s.id === "analytics" ? { ...s, status: "running" } : s));
      }, 2500);

      const timer2 = setTimeout(() => {
        setStages(prev => prev.map(s => s.id === "analytics" ? { ...s, status: "done" } : s.id === "content" ? { ...s, status: "running" } : s));
      }, 5000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    } else if (status === "ready") {
      setStages(prev => prev.map(s => ({ ...s, status: "done" })));
    }
  }, [status]);

  return (
    <div className="flex flex-col gap-2 my-3 max-w-xl rounded-xl border border-neutral-200/80 dark:border-zinc-800/80 bg-neutral-50/50 dark:bg-zinc-950/60 p-3.5 shadow-sm select-none">
      <span className="text-[9px] font-bold text-neutral-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
        Multi-Agent Workflow
      </span>
      <div className="flex items-center gap-2.5 flex-wrap">
        {stages.map((stage, idx) => (
          <React.Fragment key={stage.id}>
            <div className="flex items-center gap-1.5">
              <div className={`h-5 w-5 rounded-md flex items-center justify-center border text-[10px] ${
                stage.status === "done"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                  : stage.status === "running"
                  ? "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400 animate-pulse"
                  : "bg-neutral-100 dark:bg-zinc-900 border-neutral-200 dark:border-zinc-800/80 text-neutral-400 dark:text-zinc-500"
              }`}>
                {stage.status === "done" ? <CheckCircle2 className="h-3 w-3" /> : stage.icon}
              </div>
              <span className={`text-[11px] font-semibold ${
                stage.status === "done"
                  ? "text-neutral-500 dark:text-zinc-400"
                  : stage.status === "running"
                  ? "text-blue-600 dark:text-blue-400 font-bold"
                  : "text-neutral-400 dark:text-zinc-600"
              }`}>
                {stage.status === "done" ? stage.label.replace("Running...", "Done").replace("Thinking...", "Done") : stage.label}
              </span>
            </div>
            {idx < stages.length - 1 && <ChevronRight className="h-3 w-3 text-neutral-300 dark:text-zinc-700" />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
