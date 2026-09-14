"use client";

import React, { useState, useEffect } from "react";
import { getVoterId } from "@/lib/voter";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import { PollItem } from "@/lib/polls";
import UserAvatar from "./UserAvatar";

export default function PollCard({ initialPoll }: { initialPoll: PollItem }) {
  const { user } = useAuth();
  const supabase = createClient();

  const [poll, setPoll] = useState<PollItem>(initialPoll);
  const [votedOptionId, setVotedOptionId] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Supabase Realtime channel for live updates
  useEffect(() => {
    const channel = supabase
      .channel(`poll-${poll.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "poll_votes",
          filter: `poll_id=eq.${poll.id}`,
        },
        (payload) => {
          // Increment count for voted option
          const newOptionId = payload.new.option_id;
          setPoll((prev) => {
            const updatedOptions = prev.options.map((opt) =>
              opt.id === newOptionId ? { ...opt, votes_count: opt.votes_count + 1 } : opt
            );
            const newTotal = prev.total_votes + 1;
            updatedOptions.forEach((opt) => {
              opt.percentage = newTotal > 0 ? Math.round((opt.votes_count / newTotal) * 100) : 0;
            });
            return {
              ...prev,
              total_votes: newTotal,
              options: updatedOptions,
            };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [poll.id]);

  const handleVote = async (optionId: string) => {
    if (isVoting || votedOptionId) return;

    setErrorMsg("");
    setIsVoting(true);
    const voterId = getVoterId();

    try {
      const res = await fetch(`/api/polls/${poll.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          optionId,
          voterId,
          userId: user?.id || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to submit vote");
      } else {
        setVotedOptionId(optionId);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to vote");
    } finally {
      setIsVoting(false);
    }
  };

  const formattedDate = new Date(poll.created_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs space-y-4 transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-0.5 text-[11px] font-semibold text-brand mb-2">
            🗳️ Live Poll
          </span>
          <h3 className="text-base font-semibold text-foreground tracking-tight leading-snug">
            {poll.question}
          </h3>
        </div>
      </div>

      {errorMsg && (
        <p className="text-xs text-red-500 font-medium bg-red-50 p-2 rounded-lg border border-red-200">
          {errorMsg}
        </p>
      )}

      {/* Options List */}
      <div className="space-y-3 pt-1">
        {poll.options.map((opt) => {
          const isSelected = votedOptionId === opt.id;
          return (
            <div key={opt.id} className="space-y-1.5">
              <button
                onClick={() => handleVote(opt.id)}
                disabled={isVoting}
                className={`w-full flex items-center justify-between rounded-xl border p-3 text-sm font-medium transition-all text-left ${
                  isSelected
                    ? "border-brand bg-brand-soft/40 text-brand ring-1 ring-brand"
                    : "border-border bg-background/50 hover:border-brand/40 hover:bg-background"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected ? "border-brand bg-brand text-white text-[10px]" : "border-muted"
                    }`}
                  >
                    {isSelected && "✓"}
                  </span>
                  <span>{opt.option_text}</span>
                </span>
                <span className="text-xs font-semibold tabular-nums text-muted">
                  {opt.votes_count} {opt.votes_count === 1 ? "vote" : "votes"}
                </span>
              </button>

              {/* Animated Percentage Bar */}
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-border/40">
                <div
                  className="h-full bg-brand transition-all duration-500 ease-out"
                  style={{ width: `${opt.percentage}%` }}
                />
              </div>

              <div className="flex justify-end text-[11px] font-semibold text-muted tabular-nums">
                {opt.percentage}%
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted pt-2 border-t border-border/40">
        <div className="flex items-center gap-2">
          <UserAvatar name={poll.author} size="sm" />
          <span>By {poll.author || "Anonymous"}</span>
        </div>
        <span>
          {poll.total_votes} total votes • {formattedDate}
        </span>
      </div>
    </div>
  );
}
