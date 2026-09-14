"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";

export default function AskQuestionModal({
  isOpen,
  onClose,
  onQuestionCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onQuestionCreated?: (question: any) => void;
}) {
  const { user, profile, openAuthModal } = useAuth();
  const [body, setBody] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: body.trim(),
          author: profile?.display_name || profile?.username || authorName.trim() || "Anonymous",
          userId: user?.id || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to ask question");

      setBody("");
      onQuestionCreated?.(data);
      onClose();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border bg-surface p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">Ask a Question</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted hover:bg-background transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">
              Your Question
            </label>
            <textarea
              required
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="What would you like to ask the community? Be specific..."
              className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none placeholder:text-muted focus:border-brand resize-none"
            />
          </div>

          {!user && (
            <div>
              <label className="block text-xs font-medium text-muted mb-1">
                Your Name (Optional / Post as Guest)
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="e.g. Alex"
                className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none placeholder:text-muted focus:border-brand"
              />
              <p className="mt-1 text-xs text-muted">
                Tip:{" "}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    openAuthModal("login");
                  }}
                  className="text-brand font-medium hover:underline"
                >
                  Sign in
                </button>{" "}
                to earn reputation points for your question.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:bg-background"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !body.trim()}
              className="rounded-xl bg-brand px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-strong disabled:opacity-50"
            >
              {loading ? "Posting..." : "Post Question"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
