"use client";

import React, { useState, useEffect, useRef } from "react";
import { Loader2, Send } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface CommentType {
  id: string;
  content: string;
  createdAt: Date | string;
  User: {
    id: string;
    name: string | null;
    username: string;
    imageUrl: string | null;
  };
}

interface CommentSectionProps {
  postId: string;
  onCommentAdded?: (newCount: number) => void;
  initialCommentsCount: number;
}

// Format date helper (Moved outside component render block to keep it pure)
const formatTime = (d: Date | string) => {
  const date = new Date(d);
  const ms = Date.now() - date.getTime();
  const mins = Math.floor(ms / 60000);
  const hrs = Math.floor(ms / 3600000);
  const days = Math.floor(ms / 86400000);
  if (mins < 1) return "Just now";
  if (hrs < 1) return `${mins}m ago`;
  if (days < 1) return `${hrs}h ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export default function CommentSection({
  postId,
  onCommentAdded,
  initialCommentsCount,
}: CommentSectionProps) {
  const { userId } = useAuth();
  const [comments, setComments] = useState<CommentType[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await axios.get(`/api/posts/${postId}/comments`);
        setComments(response.data.comments || []);
      } catch (error) {
        console.error("[CommentSection] Failed to fetch comments:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComments();
  }, [postId]);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (comments.length > 0 && !isLoading) {
      scrollToBottom();
    }
  }, [comments, isLoading]);

  // Submit comment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      alert("Please sign in to comment!");
      return;
    }
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    const originalComments = [...comments];
    const textToSubmit = newComment.trim();
    setNewComment("");

    // Optimistic UI update
    const tempCommentId = crypto.randomUUID();
    const optimisticComment: CommentType = {
      id: tempCommentId,
      content: textToSubmit,
      createdAt: new Date().toISOString(),
      User: {
        id: userId,
        name: "You",
        username: "current_user",
        imageUrl: null, // fallback to placeholder in render
      },
    };

    setComments((prev) => [...prev, optimisticComment]);
    if (onCommentAdded) {
      onCommentAdded(initialCommentsCount + 1);
    }

    try {
      const response = await axios.post(`/api/posts/${postId}/comments`, {
        content: textToSubmit,
      });

      // Update state with actual comment saved to DB
      setComments((prev) =>
        prev.map((c) => (c.id === tempCommentId ? response.data.comment : c))
      );
    } catch (error) {
      console.error("[CommentSection] Error posting comment:", error);
      // Rollback on error
      setComments(originalComments);
      if (onCommentAdded) {
        onCommentAdded(initialCommentsCount);
      }
      setNewComment(textToSubmit);
      alert("Failed to post comment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="w-full flex flex-col gap-4 border-t border-black/[0.04] dark:border-white/[0.04] pt-4 mt-1 animate-fade-in">
      <h5 className="text-xs font-black tracking-wider text-neutral-400 dark:text-neutral-500 uppercase px-1">
        Comments ({comments.length})
      </h5>

      {/* Comments list container */}
      <div className="flex flex-col gap-3.5 max-h-[220px] overflow-y-auto scrollbar-none px-1 py-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 text-indigo-500 animate-spin" />
          </div>
        ) : comments.length > 0 ? (
          <>
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 text-xs leading-relaxed items-start group">
                <Link href={`/profile/${comment.User.username}`} className="shrink-0">
                  <div className="h-7 w-7 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-black/5 dark:border-white/10 flex items-center justify-center overflow-hidden">
                    {comment.User.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={comment.User.imageUrl}
                        alt={comment.User.username}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="font-bold text-[10px] text-neutral-500 uppercase">
                        {comment.User.username.substring(0, 2)}
                      </span>
                    )}
                  </div>
                </Link>

                <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <Link
                      href={`/profile/${comment.User.username}`}
                      className="font-bold text-neutral-800 dark:text-neutral-200 hover:underline"
                    >
                      {comment.User.name || comment.User.username}
                    </Link>
                    <span className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500">
                      @{comment.User.username}
                    </span>
                    <span className="text-[9px] font-semibold text-neutral-400 dark:text-neutral-500">
                      • {formatTime(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-neutral-700 dark:text-neutral-300 font-medium text-xs whitespace-pre-wrap break-all leading-normal">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))}
            <div ref={commentsEndRef} />
          </>
        ) : (
          <p className="text-xs text-neutral-400 dark:text-neutral-500 text-center py-4 italic font-medium">
            Be the first to comment on this post
          </p>
        )}
      </div>

      {/* Add comment input box */}
      <form onSubmit={handleSubmit} className="flex gap-2 items-center mt-1">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          maxLength={500}
          disabled={isSubmitting}
          className="flex-1 h-9 rounded-xl bg-neutral-50 dark:bg-zinc-950/60 border border-black/[0.05] dark:border-white/[0.06] hover:border-black/10 dark:hover:border-white/10 focus:border-indigo-500 dark:focus:border-indigo-500 focus:outline-none px-3.5 text-xs text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 font-semibold transition-all duration-200"
        />
        <Button
          type="submit"
          size="icon"
          disabled={isSubmitting || !newComment.trim()}
          className="h-9 w-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 active:scale-95 transition-all select-none border-transparent"
        >
          {isSubmitting ? (
            <Loader2 className="h-4.5 w-4.5 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
