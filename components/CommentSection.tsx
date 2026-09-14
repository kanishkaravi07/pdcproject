"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getVoterId } from "@/lib/voter";

export type CommentItem = {
  id: string;
  user_id?: string | null;
  author: string | null;
  content: string;
  created_at: string;
};

export default function CommentSection({
  questionId,
  answerId,
  initialComments = [],
}: {
  questionId?: string;
  answerId?: string;
  initialComments?: CommentItem[];
}) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<CommentItem[]>(initialComments);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [showInput, setShowInput] = useState(false);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: questionId || null,
          answerId: answerId || null,
          content: draft.trim(),
          userId: user?.id || null,
          authorName: profile?.display_name || profile?.username || "Guest",
        }),
      });

      const newComment = await res.json();
      if (!res.ok) throw new Error(newComment.error || "Failed to add comment");

      setComments((prev) => [...prev, newComment]);
      setDraft("");
      setShowInput(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (commentId: string) => {
    if (!editDraft.trim() || !user) return;
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: editDraft.trim(),
          userId: user.id,
        }),
      });

      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error);

      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, content: updated.content } : c))
      );
      setEditingId(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!user || !confirm("Delete this comment?")) return;
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!res.ok) throw new Error("Failed to delete comment");

      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="mt-3 border-t border-border/50 pt-3 space-y-2">
      {/* Existing Comments List */}
      <div className="space-y-1.5">
        {comments.map((c) => (
          <div
            key={c.id}
            className="flex items-start justify-between gap-2 text-xs bg-background/50 rounded-lg p-2 border border-border/40"
          >
            {editingId === c.id ? (
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={editDraft}
                  onChange={(e) => setEditDraft(e.target.value)}
                  className="flex-1 rounded-md border bg-surface px-2 py-1 text-xs outline-none"
                />
                <button
                  onClick={() => handleEdit(c.id)}
                  className="text-xs text-brand font-medium hover:underline"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="text-xs text-muted hover:underline"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <p className="text-muted leading-relaxed flex-1">
                  <span className="font-semibold text-foreground mr-1.5">
                    {c.author || "Anonymous"}:
                  </span>
                  {c.content}
                </p>

                {user && user.id === c.user_id && (
                  <div className="flex items-center gap-1.5 shrink-0 opacity-70 hover:opacity-100">
                    <button
                      onClick={() => {
                        setEditingId(c.id);
                        setEditDraft(c.content);
                      }}
                      className="text-[10px] text-muted hover:text-brand"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-[10px] text-muted hover:text-red-500"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Toggle Add Comment */}
      {!showInput ? (
        <button
          onClick={() => setShowInput(true)}
          className="text-xs text-muted hover:text-brand font-medium inline-flex items-center gap-1"
        >
          + Add comment
        </button>
      ) : (
        <form onSubmit={handleAddComment} className="flex gap-2 pt-1">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write a quick comment..."
            className="flex-1 rounded-xl border bg-background px-3 py-1.5 text-xs outline-none focus:border-brand"
          />
          <button
            type="submit"
            disabled={loading || !draft.trim()}
            className="rounded-xl bg-brand px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-strong disabled:opacity-50"
          >
            Comment
          </button>
          <button
            type="button"
            onClick={() => setShowInput(false)}
            className="rounded-xl border px-2.5 py-1.5 text-xs text-muted hover:bg-background"
          >
            Cancel
          </button>
        </form>
      )}
    </div>
  );
}
