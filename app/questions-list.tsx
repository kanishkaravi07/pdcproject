"use client";

import { useState, useEffect } from "react";
import QuestionCard, { QuestionCardProps } from "@/components/QuestionCard";

export default function QuestionsList({
  initialQuestions,
  initialHasMore,
  tab = "all",
}: {
  initialQuestions: QuestionCardProps[];
  initialHasMore: boolean;
  tab?: "all" | "trending" | "popular" | "recent";
}) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [query, setQuery] = useState("");
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);

  // Debounced search (300ms)
  useEffect(() => {
    const id = setTimeout(async () => {
      const url = query
        ? `/api/questions?q=${encodeURIComponent(query)}&tab=${tab}`
        : `/api/questions?tab=${tab}`;
      const res = await fetch(url);
      const data = await res.json();
      setQuestions(data.questions || []);
      setHasMore(data.hasMore || false);
    }, 300);

    return () => clearTimeout(id);
  }, [query, tab]);

  async function loadMore() {
    setLoading(true);
    const res = await fetch(`/api/questions?offset=${questions.length}&tab=${tab}`);
    const data = await res.json();
    setQuestions((qs) => [...qs, ...(data.questions || [])]);
    setHasMore(data.hasMore || false);
    setLoading(false);
  }

  return (
    <div className="space-y-5">
      {/* Search Bar + Interactivity indicator */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions by keyword or topic…"
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none placeholder:text-muted focus:border-brand shadow-xs"
          />
        </div>
        <span className="shrink-0 text-xs text-muted">
          {hydrated ? "Interactive ✓" : "Loading…"}
        </span>
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        {questions.map((q) => (
          <QuestionCard key={q.id} {...q} />
        ))}
      </div>

      {questions.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center space-y-2">
          <p className="text-base font-semibold text-foreground">No questions found</p>
          <p className="text-xs text-muted">Try searching with a different term or be the first to ask!</p>
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            onClick={loadMore}
            disabled={loading}
            className="rounded-xl border border-border bg-surface px-6 py-2.5 text-sm font-semibold transition-colors hover:border-brand hover:text-brand disabled:opacity-50 shadow-xs"
          >
            {loading ? "Loading..." : "Load More Questions"}
          </button>
        </div>
      )}
    </div>
  );
}
