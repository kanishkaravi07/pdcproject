"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getVoterId } from "@/lib/voter";
import UserAvatar from "./UserAvatar";
import CommentSection, { CommentItem } from "./CommentSection";

export type AnswerItem = {
  id: string;
  question_id: string;
  user_id?: string | null;
  author: string | null;
  content: string;
  is_accepted: boolean;
  votes: number;
  created_at: string;
  comments?: CommentItem[];
};

export default function AnswerCard({
  answer,
  questionUserId,
  onAnswerUpdated,
}: {
  answer: AnswerItem;
  questionUserId?: string | null;
  onAnswerUpdated?: () => void;
}) {
  const { user } = useAuth();
  const [votes, setVotes] = useState(answer.votes);
  const [hasVoted, setHasVoted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(answer.content);
  const [isAccepting, setIsAccepting] = useState(false);

  const isAnswerOwner = user?.id && answer.user_id === user.id;
  const isQuestionOwner = user?.id && questionUserId === user.id;

  const handleVote = async () => {
    if (hasVoted) return;
    setVotes((v) => v + 1);
    setHasVoted(true);

    try {
      const res = await fetch(`/api/answers/${answer.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voterId: getVoterId(),
          userId: user?.id || null,
        }),
      });

      if (!res.ok) {
        setVotes((v) => v - 1);
        setHasVoted(false);
      }
    } catch {
      setVotes((v) => v - 1);
      setHasVoted(false);
    }
  };

  const handleToggleAccept = async () => {
    if (!isQuestionOwner || isAccepting) return;
    setIsAccepting(true);

    try {
      const res = await fetch(`/api/answers/${answer.id}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: answer.question_id,
          userId: user.id,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to update accepted status");
      } else {
        onAnswerUpdated?.();
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim() || !user) return;
    try {
      const res = await fetch(`/api/answers/${answer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: editContent.trim(),
          userId: user.id,
        }),
      });

      if (!res.ok) throw new Error("Failed to update answer");

      setIsEditing(false);
      onAnswerUpdated?.();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async () => {
    if (!user || !confirm("Are you sure you want to delete your answer?")) return;
    try {
      const res = await fetch(`/api/answers/${answer.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!res.ok) throw new Error("Failed to delete answer");

      onAnswerUpdated?.();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div
      className={`rounded-2xl border p-4 shadow-xs transition-all ${
        answer.is_accepted
          ? "border-emerald-300 bg-emerald-50/30 ring-1 ring-emerald-200"
          : "border-border bg-surface"
      }`}
    >
      {/* Accepted Answer Indicator */}
      {answer.is_accepted && (
        <div className="mb-3 flex items-center gap-1.5 rounded-xl bg-emerald-100/80 px-3 py-1 text-xs font-semibold text-emerald-700 w-fit">
          <span>✓</span> Accepted Answer
        </div>
      )}

      <div className="flex items-start gap-3.5">
        {/* Answer Upvote Button */}
        <button
          onClick={handleVote}
          className={`flex shrink-0 flex-col items-center gap-0.5 rounded-xl border px-3 py-2 transition-colors ${
            hasVoted
              ? "border-brand bg-brand-soft text-brand font-bold"
              : "border-border text-muted hover:border-brand hover:bg-brand-soft hover:text-brand"
          }`}
        >
          <span className="text-xs leading-none">▲</span>
          <span className="text-xs font-semibold leading-none tabular-nums">
            {votes}
          </span>
        </button>

        {/* Content */}
        <div className="min-w-0 flex-1 space-y-2">
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                rows={3}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full rounded-xl border bg-background p-3 text-sm outline-none focus:border-brand resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  className="rounded-xl bg-brand px-4 py-1.5 text-xs font-medium text-white hover:bg-brand-strong"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="rounded-xl border px-3 py-1.5 text-xs text-muted hover:bg-background"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">
              {answer.content}
            </p>
          )}

          {/* Answer Footer */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs text-muted border-t border-border/40">
            <div className="flex items-center gap-2">
              <UserAvatar name={answer.author} size="sm" />
              <span className="font-medium text-foreground">{answer.author || "Anonymous"}</span>
              <span className="text-muted/60">
                • {new Date(answer.created_at).toLocaleDateString()}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Question Owner Accept Toggle */}
              {isQuestionOwner && (
                <button
                  onClick={handleToggleAccept}
                  disabled={isAccepting}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    answer.is_accepted
                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                      : "bg-background border border-border text-muted hover:border-emerald-400 hover:text-emerald-600"
                  }`}
                >
                  {answer.is_accepted ? "✓ Accepted" : "Mark as Accepted"}
                </button>
              )}

              {/* Answer Owner Controls */}
              {isAnswerOwner && !isEditing && (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-muted hover:text-brand transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="text-muted hover:text-red-500 transition-colors"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Nested Comments on Answer */}
          <CommentSection answerId={answer.id} initialComments={answer.comments || []} />
        </div>
      </div>
    </div>
  );
}
