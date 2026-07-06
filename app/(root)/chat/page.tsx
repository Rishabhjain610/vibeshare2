"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useUser } from "@clerk/nextjs";
import {
  Send,
  Sparkles,
  Bot,
  User,
  RefreshCw,
  Trash2,
  Square,
  ChevronDown,
  ChevronRight,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ToolCard } from "@/components/ai/ToolCard";

// ─── Thinking Block Component ─────────────────────────────────────────────────
function ThinkingBlock({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);

  if (!text || !text.trim()) return null;

  return (
    <div className="mb-3 rounded-xl border border-violet-200/60 dark:border-violet-900/40 bg-violet-50/60 dark:bg-violet-950/20 overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2 px-3.5 py-2.5 text-left hover:bg-violet-100/50 dark:hover:bg-violet-900/20 transition-colors group"
      >
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <Brain className="h-3.5 w-3.5 text-violet-500 shrink-0" />
          <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 tracking-wide">
            Thinking
          </span>
          <span className="text-[10px] text-violet-400/70 dark:text-violet-500/60 truncate ml-1 hidden sm:block">
            {expanded ? "" : text.trim().split("\n")[0].slice(0, 80) + (text.length > 80 ? "…" : "")}
          </span>
        </div>
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-violet-400 shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-violet-400 shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-3 pt-0 border-t border-violet-200/40 dark:border-violet-900/30">
          <pre className="text-[11px] leading-relaxed text-violet-700 dark:text-violet-300 font-mono whitespace-pre-wrap break-words mt-2.5 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-violet-300 dark:scrollbar-thumb-violet-700">
            {text.trim()}
          </pre>
        </div>
      )}
    </div>
  );
}

// ─── Main Chat Page ───────────────────────────────────────────────────────────
export default function ChatPage() {
  const [selectedModel, setSelectedModel] = useState("minimax-m3:cloud");

  // AI SDK v7: transport must carry the model in the body
  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat", body: { model: selectedModel } }),
    [selectedModel]
  );

  const { messages, status, sendMessage, regenerate, setMessages, error, stop } = useChat({ transport });
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isLoading = status === "streaming" || status === "submitted";

  const { user } = useUser();
  const greeting = (() => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good morning";
    if (hr < 17) return "Good afternoon";
    return "Good evening";
  })();
  const displayName = user?.firstName || user?.username || "";

  // Debug: log messages and errors to browser console
  useEffect(() => {
    console.log("[useChat] status:", status, "| messages:", messages.length, "| error:", error);
    if (messages.length > 0) {
      console.log("[useChat] last message:", JSON.stringify(messages[messages.length - 1]).substring(0, 300));
    }
  }, [messages, status, error]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) { stop(); return; }
    if (!input || !input.trim()) return;
    // AI SDK v7: model is in the transport body, not per-sendMessage
    sendMessage({ text: input.trim() });
    setInput("");
  };

  const handleClearChat = () => setMessages([]);

  // ─── Markdown renderer ──────────────────────────────────────────────────────
  const renderBoldText = (text: string) => {
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, i) =>
      i % 2 === 1
        ? <strong key={i} className="font-bold text-neutral-950 dark:text-neutral-50">{part}</strong>
        : part
    );
  };

  const formatMessageContent = (content: string) => {
    if (!content) return null;
    const lines = content.split("\n");
    const elements: React.ReactNode[] = [];
    
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      // 1. Match markdown table syntax: lines starting with |
      if (trimmed.startsWith("|")) {
        const tableRows: string[][] = [];
        
        while (i < lines.length && lines[i].trim().startsWith("|")) {
          const rowStr = lines[i].trim();
          // Check if this is the separator row (like |---|---| or | :--- | ---: |)
          const isSeparator = /^\|[\s:-|]*\|$/.test(rowStr) && 
            (rowStr.includes("-") || rowStr.includes(":"));

          if (!isSeparator) {
            const cells = rowStr.split("|").map(c => c.trim());
            // Since the row starts and ends with |, split will result in empty first and last elements
            if (cells[0] === "") cells.shift();
            if (cells[cells.length - 1] === "") cells.pop();
            tableRows.push(cells);
          }
          i++;
        }

        if (tableRows.length > 0) {
          const headerCells = tableRows[0];
          const bodyRows = tableRows.slice(1);

          elements.push(
            <div key={`table-${i}`} className="my-4 overflow-x-auto rounded-xl border border-black/5 dark:border-white/10 shadow-sm max-w-4xl">
              <table className="min-w-full divide-y divide-black/5 dark:divide-white/10 text-xs">
                <thead className="bg-neutral-50 dark:bg-zinc-900">
                  <tr>
                    {headerCells.map((cell, cellIdx) => (
                      <th key={cellIdx} className="px-4 py-2.5 text-left font-bold text-neutral-900 dark:text-neutral-50 uppercase tracking-wider">
                        {renderBoldText(cell)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5 bg-white dark:bg-zinc-950/20">
                  {bodyRows.map((row, rowIdx) => (
                    <tr key={rowIdx} className="hover:bg-neutral-50/50 dark:hover:bg-zinc-900/20 transition-colors">
                      {row.map((cell, cellIdx) => (
                        <td key={cellIdx} className="px-4 py-2 text-neutral-800 dark:text-neutral-200 whitespace-nowrap">
                          {renderBoldText(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          continue; // skip incrementing i since the while loop already did it
        }
      }

      // 2. Match markdown image syntax: ![alt](url)
      const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (imgMatch) {
        const alt = imgMatch[1];
        const src = imgMatch[2];
        elements.push(
          <div key={i} className="my-3 overflow-hidden rounded-xl border border-black/5 dark:border-white/10 shadow-sm max-w-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={alt} className="w-full h-auto object-cover max-h-96" />
            <div className="bg-neutral-50 dark:bg-zinc-900 px-3 py-1.5 border-t border-black/5 dark:border-white/5 text-[10px] text-neutral-500 font-semibold italic">
              {alt || "AI Generated Image"}
            </div>
          </div>
        );
        i++;
        continue;
      }

      // 3. Match bullet lists: consecutive lines starting with - or *
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        const listItems: string[] = [];
        while (i < lines.length && (lines[i].trim().startsWith("- ") || lines[i].trim().startsWith("* "))) {
          const itemTrimmed = lines[i].trim();
          listItems.push(itemTrimmed.substring(2));
          i++;
        }
        elements.push(
          <ul key={`list-${i}`} className="list-disc pl-5 mb-3 space-y-1">
            {listItems.map((item, idx) => (
              <li key={idx} className="text-sm text-neutral-800 dark:text-neutral-200">
                {renderBoldText(item)}
              </li>
            ))}
          </ul>
        );
        continue;
      }

      // 4. Headers & Paragraphs
      if (trimmed.startsWith("### ")) {
        elements.push(
          <h5 key={i} className="text-sm font-bold text-neutral-900 dark:text-neutral-50 mt-3 mb-1">
            {renderBoldText(trimmed.replace("### ", ""))}
          </h5>
        );
      } else if (trimmed.startsWith("## ")) {
        elements.push(
          <h4 key={i} className="text-base font-black text-neutral-900 dark:text-neutral-50 mt-4 mb-2">
            {renderBoldText(trimmed.replace("## ", ""))}
          </h4>
        );
      } else if (trimmed) {
        elements.push(
          <p key={i} className="text-[15px] leading-relaxed mb-2 last:mb-0 text-neutral-800 dark:text-neutral-200">
            {renderBoldText(trimmed)}
          </p>
        );
      }
      i++;
    }
    return elements;
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col h-[calc(100vh-4.5rem)] pb-0 select-none animate-fade-in font-sans">

      {/* 1. Header */}
      <div className="flex items-center justify-between py-4 border-b border-black/[0.03] dark:border-white/[0.03] mb-4">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 bg-neutral-900 dark:bg-zinc-100 text-white dark:text-black rounded-lg flex items-center justify-center font-bold">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-tight text-neutral-900 dark:text-neutral-50">AI Copilot</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearChat}
                className="h-8 rounded-lg px-2.5 text-neutral-400 hover:text-rose-500 hover:bg-rose-500/[0.04] transition-colors flex items-center gap-1 text-xs"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => regenerate()}
                className="h-8 w-8 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-zinc-900"
                title="Regenerate last response"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 2. Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-none px-2 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto text-center py-20">
            <h2 className="text-3xl md:text-4xl font-serif font-normal text-neutral-900 dark:text-neutral-50 tracking-tight mb-2">
              {greeting}{displayName ? `, ${displayName}` : ""}
            </h2>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 font-medium">How can I help you today?</p>
          </div>
        ) : (
          <div className="space-y-8">
            {messages.map((message: any) => {
              const isUser = message.role === "user";

              // Extract thinking/reasoning parts
              const reasoningParts = message.parts?.filter((p: any) => p.type === "reasoning") || [];
              const reasoningText = reasoningParts.map((p: any) => p.reasoning || p.text || "").join("\n\n");

              // Extract tool parts — AI SDK v7 uses type like "tool-{toolName}" not "tool-call"
              const toolCallParts = (message.parts || []).filter((p: any) =>
                p.type === "tool-call" || (p.type?.startsWith("tool-") && p.type !== "tool-result")
              );
              const toolResultParts = (message.parts || []).filter((p: any) => p.type === "tool-result");
              const hasToolError = toolCallParts.some((p: any) => p.state === "output-error");

              // Extract text — handle all AIMessage formats robustly
              const textContent = (() => {
                // Try parts array first (AI SDK v7 UIMessage format)
                if (Array.isArray(message.parts) && message.parts.length > 0) {
                  const fromParts = message.parts
                    .filter((p: any) => p.type === "text")
                    .map((p: any) => p.text || "")
                    .join("");
                  if (fromParts) return fromParts;
                }
                // Fall back to plain .content string (older format or streaming)
                if (typeof message.content === "string") return message.content;
                // Fall back to .content array (OpenAI-style)
                if (Array.isArray(message.content)) {
                  return message.content
                    .filter((c: any) => c.type === "text")
                    .map((c: any) => c.text || "")
                    .join("");
                }
                return "";
              })();

              return (
                <div key={message.id} className="space-y-3">
                  {/* 🧠 Thinking block — only for assistant messages */}
                  {!isUser && reasoningText && (
                    <ThinkingBlock text={reasoningText} />
                  )}

                  {/* 🔧 Tool Cards — Only show visual charts (generateChartData) */}
                  {toolCallParts.map((tc: any, idx: number) => {
                    const isError = tc.state === "output-error";
                    const toolName = tc.toolName || tc.type || "unknown-tool";
                    const displayName = toolName?.startsWith("tool-") ? toolName.slice(5) : toolName;
                    
                    if (displayName === "generateChartData") {
                      const args = tc.args || tc.input;
                      const result = tc.result || tc.output;
                      return (
                        <ToolCard
                          key={tc.toolCallId || idx}
                          toolName={toolName}
                          state={isError ? "error" : result !== undefined ? "result" : "call"}
                          args={args}
                          result={result}
                          error={tc.errorText}
                        />
                      );
                    }
                    return null;
                  })}

                  {/* 💬 Message Bubble */}
                  {!textContent && !isUser && hasToolError && (
                    <div className="flex items-start gap-4 max-w-5xl mr-auto">
                      <div className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center font-bold text-xs border border-black/5 dark:border-white/5 bg-neutral-900 dark:bg-zinc-100 text-white dark:text-black">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="p-3 text-[15px] leading-relaxed text-neutral-500 dark:text-neutral-400 italic">
                        I encountered an error while processing your request. Please try again.
                      </div>
                    </div>
                  )}
                  {textContent && (
                    <div className={cn("flex items-start gap-4 max-w-5xl", isUser ? "ml-auto flex-row-reverse" : "mr-auto")}>
                      <div className={cn(
                        "h-8 w-8 shrink-0 rounded-lg flex items-center justify-center font-bold text-xs border border-black/5 dark:border-white/5",
                        isUser
                          ? "bg-zinc-100 dark:bg-zinc-900 text-neutral-600 dark:text-neutral-400"
                          : "bg-neutral-900 dark:bg-zinc-100 text-white dark:text-black"
                      )}>
                        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                      </div>

                      <div className={cn(
                        "p-3 text-[15px] leading-relaxed transition-all duration-200",
                        isUser
                          ? "bg-neutral-100 dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 rounded-2xl px-4 py-3"
                          : "text-neutral-800 dark:text-neutral-200 font-normal prose prose-neutral dark:prose-invert max-w-4xl"
                      )}>
                        {formatMessageContent(textContent)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Loading dots while waiting for first token */}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex items-start gap-4 mr-auto max-w-5xl">
                <div className="h-8 w-8 shrink-0 rounded-lg bg-neutral-900 dark:bg-zinc-100 text-white dark:text-black flex items-center justify-center font-bold text-xs shadow-sm">
                  <Brain className="h-4 w-4 animate-pulse" />
                </div>
                <div className="p-3 text-neutral-400 dark:text-neutral-500 text-sm flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 bg-violet-400 rounded-full animate-bounce" />
                </div>
              </div>
            )}

            {/* Errors */}
            {error && (
              <div className="flex items-start gap-3.5 bg-rose-50 dark:bg-rose-950/10 p-4 rounded-2xl border border-rose-100 dark:border-rose-950/30 text-rose-600 dark:text-rose-400 max-w-[90%] mx-auto">
                <Bot className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-xs uppercase tracking-wider mb-1">Inference Offline</h5>
                  <p className="text-xs leading-relaxed font-semibold">
                    Unable to stream response. Verify Ollama is running and model &apos;{selectedModel}&apos; is loaded.
                  </p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 3. Input bar */}
      <div className="mt-2 pt-2 border-t border-black/[0.02] dark:border-white/[0.02]">
        <form
          onSubmit={handleFormSubmit}
          className="max-w-5xl mx-auto w-full bg-neutral-50 dark:bg-zinc-950/40 border border-black/5 dark:border-white/10 rounded-2xl p-2 flex flex-col gap-2 shadow-sm focus-within:border-black/10 dark:focus-within:border-white/20 transition-all"
        >
          <input
            type="text"
            value={input || ""}
            onChange={handleInputChange}
            placeholder="Send a message..."
            className="w-full h-11 bg-transparent px-4 text-[15px] font-normal text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none"
          />

          <div className="flex items-center justify-between px-3 pt-1 border-t border-black/[0.03] dark:border-white/[0.03]">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-transparent text-xs font-bold text-neutral-500 dark:text-neutral-400 border border-black/5 dark:border-white/10 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-black/10 dark:focus:ring-white/10 hover:bg-neutral-50 dark:hover:bg-zinc-900 cursor-pointer outline-none"
            >
              <option value="minimax-m3:cloud" className="bg-white dark:bg-zinc-950">Minimax (Local Ollama)</option>
              <option value="qwen-cloud" className="bg-white dark:bg-zinc-950">Qwen (Groq Cloud)</option>
            </select>

            {isLoading ? (
              <Button
                type="button"
                size="icon"
                onClick={() => stop()}
                className="h-8 w-8 rounded-xl shrink-0 active:scale-95 transition-all flex items-center justify-center border-none shadow-md bg-rose-600 hover:bg-rose-500 text-white"
              >
                <Square className="h-3 w-3 fill-current" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon"
                disabled={!input || !input.trim()}
                className="h-8 w-8 rounded-xl shrink-0 active:scale-95 transition-all flex items-center justify-center border-none shadow-md bg-neutral-900 dark:bg-zinc-100 text-white dark:text-black hover:opacity-90 disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </form>
      </div>

    </div>
  );
}