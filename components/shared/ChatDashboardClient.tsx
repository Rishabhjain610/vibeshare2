"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSocket } from "@/hooks/useSocket";
import {
  Search,
  Send,
  Loader2,
  Sparkles,
  MessageCircle,
  AlertCircle,
  X,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import axios from "axios";

interface ChatUser {
  id: string;
  name: string | null;
  username: string;
  imageUrl: string | null;
  bio: string | null;
}

interface MessageType {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: Date | string;
}

interface ChatDashboardClientProps {
  users: ChatUser[];
  currentUserId: string;
  _currentUserAvatar: string | null;
  defaultUserId?: string;
}

export default function ChatDashboardClient({
  users,
  currentUserId,
  _currentUserAvatar,
  defaultUserId,
}: ChatDashboardClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeRecipient, setActiveRecipient] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [newMessageText, setNewMessageText] = useState("");
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  // AI Summarizer states
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [ollamaError, setOllamaError] = useState<string | null>(null);

  // 1. Establish WebSocket Connection using our custom hook
  const { socket, isConnected } = useSocket(currentUserId);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll messages list to the bottom when new message arrives or recipient changes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 2. Fetch conversation history when selected recipient changes
  useEffect(() => {
    if (!activeRecipient) return;

    const fetchMessages = async () => {
      setIsMessagesLoading(true);
      try {
        const response = await axios.get(`/api/chatwithsummary/messages`, {
          params: { recipientId: activeRecipient.id },
        });
        setMessages(response.data.messages || []);
      } catch (err) {
        console.error("[ChatDashboardClient] Failed to load messages:", err);
      } finally {
        setIsMessagesLoading(false);
      }
    };

    fetchMessages();
  }, [activeRecipient]);

  // Auto-select recipient if defaultUserId is provided
  useEffect(() => {
    if (defaultUserId && users.length > 0) {
      const targetUser = users.find((u) => u.id === defaultUserId);
      if (targetUser) {
        setActiveRecipient(targetUser);
      }
    }
  }, [defaultUserId, users]);

  // 3. Socket event listener: Append incoming messages to history in real-time
  useEffect(() => {
    if (!socket) return;

    const handleMessageReceived = (incomingMsg: MessageType) => {
      // Show message only if it comes from the currently open recipient chat
      if (activeRecipient && incomingMsg.senderId === activeRecipient.id) {
        setMessages((prev) => [...prev, incomingMsg]);
      }
    };

    socket.on("message-received", handleMessageReceived);

    return () => {
      socket.off("message-received", handleMessageReceived);
    };
  }, [socket, activeRecipient]);

  // 4. Send Message Handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRecipient || !newMessageText.trim() || isSending) return;

    const textToSubmit = newMessageText.trim();
    setNewMessageText("");
    setIsSending(true);

    const originalMessages = [...messages];
    const tempId = crypto.randomUUID();

    // Optimistic message object for immediate UI feedback
    const optimisticMessage: MessageType = {
      id: tempId,
      senderId: currentUserId,
      receiverId: activeRecipient.id,
      content: textToSubmit,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const response = await axios.post("/api/chatwithsummary/messages", {
        recipientId: activeRecipient.id,
        content: textToSubmit,
      });

      const savedMessage = response.data.message;

      // Update state with exact DB record (guarantees DB synced id/timestamps)
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? savedMessage : m))
      );

      // Emit message to receiver's private room via WebSocket
      if (socket) {
        socket.emit("send-message", savedMessage);
      }
    } catch (err) {
      console.error("[ChatDashboardClient] Send message error:", err);
      setMessages(originalMessages); // Rollback on network failure
      setNewMessageText(textToSubmit);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  // 5. AI Conversation Summarizer trigger
  const handleSummarizeConversation = async () => {
    if (!activeRecipient) return;

    setIsSummarizing(true);
    setOllamaError(null);
    setSummary(null);
    setShowSummaryModal(true);

    try {
      const response = await axios.post("/api/chatwithsummary/summarize", {
        recipientId: activeRecipient.id,
      });
      setSummary(response.data.summary);
    } catch (err: any) {
      console.error("[ChatDashboardClient] Summarizer error:", err);
      const errMsg =
        err.response?.data?.error ||
        "Local LLM is not running. Please verify that the Ollama app is active, the qwen3.5:4b model is downloaded ('ollama run qwen3.5:4b'), and try again.";
      setOllamaError(errMsg);
    } finally {
      setIsSummarizing(false);
    }
  };

  // Filter users based on search bar input
  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full flex h-[calc(100vh-14rem)] md:h-[calc(100vh-11rem)] bg-white/40 dark:bg-zinc-950/45 border border-black/[0.05] dark:border-white/[0.08] rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-md">
      
      {/* LEFT: Creator List Sidebar */}
      <div className={cn(
        "w-full md:w-80 border-r border-black/[0.05] dark:border-white/[0.08] flex flex-col bg-white/20 dark:bg-black/10 shrink-0",
        activeRecipient && "hidden md:flex"
      )}>
        {/* Sidebar Search Bar */}
        <div className="p-4 border-b border-black/[0.04] dark:border-white/[0.04]">
          <div className="relative">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-neutral-400 dark:text-neutral-500" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-10 pr-4 rounded-full bg-black/[0.02] dark:bg-zinc-950/60 border border-black/[0.05] dark:border-white/[0.06] hover:border-black/10 dark:hover:border-white/10 focus:border-indigo-500 dark:focus:border-indigo-500 focus:outline-none text-xs text-neutral-800 dark:text-neutral-100 font-semibold transition-all duration-200"
            />
          </div>
        </div>

        {/* Users list feed */}
        <div className="flex-1 overflow-y-auto scrollbar-none p-3 space-y-1">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => setActiveRecipient(user)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-200 group hover:scale-101",
                  activeRecipient?.id === user.id
                    ? "bg-indigo-600/90 dark:bg-indigo-500/90 text-white shadow-lg shadow-indigo-600/10"
                    : "hover:bg-neutral-50/50 dark:hover:bg-zinc-900/30"
                )}
              >
                <div className="h-9 w-9 shrink-0 rounded-full border border-black/5 dark:border-white/10 bg-neutral-100 dark:bg-neutral-900 overflow-hidden flex items-center justify-center">
                  {user.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.imageUrl} alt={user.username} className="h-full w-full object-cover" />
                  ) : (
                    <span className={cn(
                      "font-bold text-xs uppercase",
                      activeRecipient?.id === user.id ? "text-white" : "text-neutral-500"
                    )}>
                      {user.username.substring(0, 2)}
                    </span>
                  )}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className={cn(
                    "text-xs font-bold truncate",
                    activeRecipient?.id === user.id ? "text-white" : "text-neutral-800 dark:text-neutral-200"
                  )}>
                    {user.name || user.username}
                  </span>
                  <span className={cn(
                    "text-[10px] font-semibold truncate mt-0.5",
                    activeRecipient?.id === user.id ? "text-white/70" : "text-neutral-400 dark:text-neutral-500"
                  )}>
                    @{user.username}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-neutral-400 dark:text-neutral-500 text-center py-8 italic font-medium">
              No creators found matching &quot;{searchQuery}&quot;
            </p>
          )}
        </div>
      </div>

      {/* RIGHT: Active Chat Room Box */}
      <div className={cn(
        "flex-1 flex flex-col bg-white/10 dark:bg-black/[0.02]",
        !activeRecipient && "hidden md:flex"
      )}>
        {activeRecipient ? (
          <>
            {/* Chat Box Header */}
            <div className="p-4 border-b border-black/[0.05] dark:border-white/[0.08] flex items-center justify-between bg-white/20 dark:bg-zinc-950/20 backdrop-blur-md">
              <div className="flex items-center gap-3">
                {/* Mobile Back Button */}
                <button
                  onClick={() => setActiveRecipient(null)}
                  className="md:hidden p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-zinc-900 transition-colors mr-1"
                >
                  <X className="h-4.5 w-4.5 text-neutral-600 dark:text-neutral-400" />
                </button>

                <div className="h-9 w-9 rounded-full border border-black/5 dark:border-white/10 overflow-hidden bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center">
                  {activeRecipient.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={activeRecipient.imageUrl} alt={activeRecipient.username} className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-bold text-xs text-neutral-500 uppercase">
                      {activeRecipient.username.substring(0, 2)}
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-1.5">
                    {activeRecipient.name || activeRecipient.username}
                    <span className={cn(
                      "h-1.5 w-1.5 rounded-full shrink-0",
                      isConnected ? "bg-emerald-500 animate-pulse" : "bg-neutral-300 dark:bg-neutral-700"
                    )} />
                  </h4>
                  <p className="text-[9px] font-semibold text-neutral-400 dark:text-neutral-500">
                    @{activeRecipient.username}
                  </p>
                </div>
              </div>

              {/* Header Right: AI Chat Summarizer trigger */}
              <Button
                onClick={handleSummarizeConversation}
                className="rounded-full h-8 px-3.5 bg-indigo-65 text-indigo-600 hover:bg-indigo-50 border border-indigo-150/60 dark:bg-indigo-950/25 dark:text-indigo-400 dark:hover:bg-indigo-950/40 dark:border-indigo-900/40 text-[10px] font-black uppercase tracking-wider transition-all select-none active:scale-95 flex items-center gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5 fill-indigo-100 dark:fill-indigo-950" />
                AI Summarize
              </Button>
            </div>

            {/* Chat Messages scroll area */}
            <div className="flex-1 overflow-y-auto scrollbar-none p-4 space-y-4">
              {isMessagesLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
                  <span className="text-[10px] text-neutral-400 font-semibold uppercase">Loading messages...</span>
                </div>
              ) : messages.length > 0 ? (
                messages.map((msg) => {
                  const isSender = msg.senderId === currentUserId;
                  return (
                    <div
                      key={msg.id}
                      className={cn("flex w-full", isSender ? "justify-end" : "justify-start")}
                    >
                      <div className={cn(
                        "max-w-[70%] rounded-2xl px-4 py-2.5 text-xs font-semibold leading-relaxed shadow-sm",
                        isSender
                          ? "bg-indigo-600 dark:bg-indigo-500 text-white rounded-tr-none"
                          : "bg-white dark:bg-zinc-900 text-neutral-800 dark:text-neutral-200 border border-black/[0.04] dark:border-white/[0.04] rounded-tl-none"
                      )}>
                        <p className="whitespace-pre-wrap break-all leading-normal">{msg.content}</p>
                        <span className={cn(
                          "text-[8px] font-medium block text-right mt-1.5 select-none",
                          isSender ? "text-white/60" : "text-neutral-400 dark:text-neutral-500"
                        )}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 gap-3">
                  <MessageCircle className="h-10 w-10 text-neutral-300 dark:text-neutral-700" />
                  <div>
                    <h5 className="font-extrabold text-neutral-700 dark:text-neutral-300 text-xs">Send a Vibe!</h5>
                    <p className="text-[10px] text-neutral-400 dark:text-neutral-500 max-w-[200px] mt-0.5 leading-relaxed">
                      Say hello to @{activeRecipient.username} to start the conversation history.
                    </p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Message Input Bar */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-black/[0.05] dark:border-white/[0.08] bg-white/20 dark:bg-zinc-950/20 backdrop-blur-md flex gap-2">
              <input
                type="text"
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                placeholder={`Message @${activeRecipient.username}...`}
                disabled={isSending}
                className="flex-1 h-9 rounded-xl bg-neutral-50 dark:bg-zinc-950/60 border border-black/[0.05] dark:border-white/[0.06] hover:border-black/10 dark:hover:border-white/10 focus:border-indigo-500 dark:focus:border-indigo-500 focus:outline-none px-3.5 text-xs text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 font-semibold transition-all duration-200"
              />
              <Button
                type="submit"
                disabled={isSending || !newMessageText.trim()}
                className="h-9 w-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 active:scale-95 transition-all select-none border-transparent"
              >
                {isSending ? (
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </>
        ) : (
          /* Empty Chat Area Placeholder */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none">
            <div className="bg-neutral-100 dark:bg-neutral-900 p-5 rounded-3xl mb-4 border border-black/[0.03] dark:border-white/[0.05]">
              <MessageCircle className="h-10 w-10 text-indigo-500 dark:text-indigo-400" />
            </div>
            <h4 className="font-extrabold text-neutral-800 dark:text-neutral-200 mb-1.5 text-sm md:text-base">
              No Chat Active
            </h4>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 max-w-xs leading-relaxed">
              Select a creator from the left list sidebar panel to start messaging in real-time.
            </p>
          </div>
        )}
      </div>

      {/* AI Chat Summarizer Glassmorphic Modal Dialog */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in select-text">
          <div className="bg-white/90 dark:bg-zinc-950/90 border border-black/[0.08] dark:border-white/[0.1] rounded-[2.5rem] shadow-2xl p-6 md:p-8 max-w-lg w-full flex flex-col gap-5 max-h-[80vh] overflow-hidden backdrop-blur-md">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-3 border-b border-black/[0.04] dark:border-white/[0.04]">
              <div className="flex items-center gap-2.5">
                <div className="bg-indigo-50 dark:bg-indigo-950/30 p-2 rounded-2xl">
                  <Cpu className="h-5 w-5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-black text-sm md:text-base text-neutral-900 dark:text-neutral-50 flex items-center gap-1.5">
                    AI Summary
                    <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-indigo-200/50 dark:border-indigo-900/40">
                      qwen3.5:4b
                    </span>
                  </h3>
                  <p className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500">
                    Direct transcript overview with @{activeRecipient?.username}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSummaryModal(false)}
                className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-zinc-900 transition-colors"
              >
                <X className="h-4.5 w-4.5 text-neutral-500" />
              </button>
            </div>

            {/* Modal Body: summary text list */}
            <div className="flex-1 overflow-y-auto scrollbar-none pr-1">
              {isSummarizing ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                  <div className="text-center">
                    <span className="text-xs font-black uppercase text-neutral-600 dark:text-neutral-400 tracking-wider">
                      Analyzing Transcript...
                    </span>
                    <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1">
                      Local LLM qwen3.5:4b is processing chat history
                    </p>
                  </div>
                </div>
              ) : ollamaError ? (
                <div className="flex items-start gap-3 bg-rose-50 dark:bg-rose-950/20 p-4 rounded-3xl border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-xs uppercase tracking-wider mb-1">AI Offline</h5>
                    <p className="text-xs leading-relaxed font-semibold">{ollamaError}</p>
                  </div>
                </div>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed font-semibold text-neutral-700 dark:text-neutral-300">
                  {summary ? (
                    renderMarkdown(summary)
                  ) : (
                    <p className="italic text-neutral-400 dark:text-neutral-500">
                      Failed to fetch summary. Send some messages first to generate a transcript!
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer Button */}
            <div className="pt-3 border-t border-black/[0.04] dark:border-white/[0.04] flex justify-end">
              <Button
                onClick={() => setShowSummaryModal(false)}
                className="rounded-full h-9 px-6 bg-neutral-900 dark:bg-neutral-50 text-white dark:text-black font-semibold text-xs active:scale-95 transition-all select-none border-transparent"
              >
                Close Summary
              </Button>
            </div>
            
          </div>
        </div>
      )}
      
    </div>
  );
}

// Custom lightweight Markdown-to-React elements parser
function renderMarkdown(text: string) {
  if (!text) return null;

  const lines = text.split("\n");
  const renderedElements: React.ReactNode[] = [];

  let listItems: React.ReactNode[] = [];

  const flushList = (key: string | number) => {
    if (listItems.length > 0) {
      renderedElements.push(
        <ul key={`list-${key}`} className="list-disc pl-5 mb-3 space-y-1">
          {listItems}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Headers (##, ###)
    if (trimmed.startsWith("## ")) {
      flushList(index);
      renderedElements.push(
        <h4 key={index} className="text-sm font-black text-neutral-900 dark:text-neutral-50 mt-4 mb-2">
          {parseBoldText(trimmed.replace("## ", ""))}
        </h4>
      );
    } else if (trimmed.startsWith("### ")) {
      flushList(index);
      renderedElements.push(
        <h5 key={index} className="text-xs font-bold text-neutral-900 dark:text-neutral-50 mt-3 mb-1.5">
          {parseBoldText(trimmed.replace("### ", ""))}
        </h5>
      );
    }
    // Bullet points (- or *)
    else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const content = trimmed.substring(2);
      listItems.push(
        <li key={`${index}-li`} className="text-xs text-neutral-700 dark:text-neutral-300">
          {parseBoldText(content)}
        </li>
      );
    } else {
      flushList(index);
      if (trimmed.length > 0) {
        renderedElements.push(
          <p key={index} className="text-xs text-neutral-700 dark:text-neutral-300 mb-2 leading-relaxed">
            {parseBoldText(trimmed)}
          </p>
        );
      }
    }
  });

  flushList("end");
  return renderedElements;
}

// Helper to parse **bold** text in a line
function parseBoldText(text: string): React.ReactNode {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return <strong key={i} className="font-bold text-neutral-950 dark:text-neutral-50">{part}</strong>;
    }
    return part;
  });
}

