"use client";

import React, { useEffect, useState } from "react";
import PollCard from "@/components/PollCard";
import CreatePollModal from "@/components/CreatePollModal";
import { PollItem } from "@/lib/polls";

export default function PollsPage() {
  const [polls, setPolls] = useState<PollItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchPolls = async () => {
    try {
      const res = await fetch("/api/polls");
      if (res.ok) {
        const data = await res.json();
        setPolls(data);
      }
    } catch (err) {
      console.error("Failed to load polls:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolls();
  }, []);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
            <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
            Supabase Realtime
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <span>🗳️</span> Live Community Polls
          </h1>
          <p className="text-sm text-muted">
            Vote on community questions in real-time. Votes update instantly without refreshing.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-brand-strong shrink-0"
        >
          + Create Poll
        </button>
      </header>

      {loading ? (
        <p className="text-center py-10 text-sm text-muted">Loading live polls...</p>
      ) : (
        <div className="space-y-6">
          {polls.map((poll) => (
            <PollCard key={poll.id} initialPoll={poll} />
          ))}

          {polls.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center space-y-3">
              <p className="text-base font-semibold text-foreground">No active polls</p>
              <p className="text-xs text-muted">Be the first to create a live poll for the community!</p>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="rounded-xl bg-brand-soft px-4 py-2 text-xs font-semibold text-brand hover:bg-brand/20"
              >
                Create First Poll
              </button>
            </div>
          )}
        </div>
      )}

      <CreatePollModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onPollCreated={fetchPolls}
      />
    </main>
  );
}