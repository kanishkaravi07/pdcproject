"use client";

import React, { useState } from "react";
import Link from "next/link";
import { getVoterId } from "@/lib/voter";
import { useAuth } from "@/lib/auth-context";
import UserAvatar from "./UserAvatar";

export type QuestionCardProps = {
  id: string;
  body: string;
  author: string | null;
  votes: number;
  answers_count?: number;
  comments_count?: number;
  has_accepted_answer?: boolean;
  created_at?: string;
  onVoteSuccess?: () => void;
};

export default function QuestionCard({
  id,
  body,
  author,
  votes: initialVotes,
  answers_count = 0,
  comments_count = 0,
  has_accepted_answer = false,
  created_at,
  onVoteSuccess,
}: QuestionCardProps) {
  const { user } = useAuth();
  const [votes, setVotes] = useState(initialVotes);
  const [hasVoted, setHasVoted] = useState(false);
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isVoting) return;

    // Optimistic UI update
    setVotes((v) => v + 1);
    setHasVoted(true);
    setIsVoting(true);

    try {
      const res = await fetch(`/api/questions/${id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voterId: getVoterId(),
          userId: user?.id || null,
        }),
      });

      if (!res.ok) {
        // Rollback on duplicate or failure
        setVotes((v) => v - 1);
        setHasVoted(false);
      } else {
        onVoteSuccess?.();
      }
    } catch {
      setVotes((v) => v - 1);
      setHasVoted(false);
    } finally {
      setIsVoting(false);
    }
  };

  const formattedTime = created_at
    ? new Date(created_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div className="group flex items-start gap-3.5 rounded-2xl border border-border bg-surface p-4 shadow-xs transition-all hover:border-brand/40 hover:shadow-md">
      {/* Upvote Button */}
      <button
        onClick={handleVote}
        disabled={isVoting}
        className={`flex shrink-0 flex-col items-center gap-0.5 rounded-xl border px-3 py-2 transition-all ${
          hasVoted
            ? "border-brand bg-brand-soft text-brand font-bold"
            : "border-border text-brand hover:border-brand hover:bg-brand-soft"
        }`}
      >
        <span className="text-xs leading-none">▲</span>
        <span className="text-xs font-semibold leading-none tabular-nums">
          {votes}
        </span>
      </button>

      {/* Main Content */}
      <div className="min-w-0 flex-1 pt-0.5 space-y-2">
        <Link href={`/questions/${id}`} className="block group-hover:text-brand transition-colors">
          <p className="text-sm font-medium leading-snug text-foreground">
            {body}
          </p>
        </Link>

        {/* Badges & Meta Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted pt-1">
          <div className="flex items-center gap-2">
            <UserAvatar name={author} size="sm" />
            <span className="font-medium text-foreground">{author || "Anonymous"}</span>
            {formattedTime && <span className="text-muted/60">• {formattedTime}</span>}
          </div>

          <div className="flex items-center gap-2">
            {has_accepted_answer && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 border border-emerald-200">
                ✓ Accepted
              </span>
            )}

            <Link
              href={`/questions/${id}`}
              className="inline-flex items-center gap-1 rounded-lg bg-background px-2.5 py-1 text-[11px] font-medium hover:bg-brand-soft hover:text-brand transition-colors"
            >
              💬 {answers_count} {answers_count === 1 ? "answer" : "answers"}
            </Link>

            {comments_count > 0 && (
              <span className="text-[11px] text-muted">
                💭 {comments_count}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
