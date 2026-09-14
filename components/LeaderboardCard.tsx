import React from "react";
import UserAvatar from "./UserAvatar";
import { LeaderboardUser } from "@/lib/leaderboard";

export default function LeaderboardCard({ user }: { user: LeaderboardUser }) {
  const getRankBadge = (rank: number) => {
    if (rank === 1) return <span className="text-xl">🥇</span>;
    if (rank === 2) return <span className="text-xl">🥈</span>;
    if (rank === 3) return <span className="text-xl">🥉</span>;
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-background font-bold text-xs text-muted border border-border">
        #{rank}
      </span>
    );
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4 shadow-xs transition-all hover:border-brand/40 hover:shadow-md">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex w-8 justify-center shrink-0">{getRankBadge(user.rank)}</div>

        <UserAvatar
          name={user.display_name || user.username}
          avatarUrl={user.avatar_url}
          size="md"
        />

        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-bold text-foreground truncate">
            {user.display_name || user.username}
          </h4>
          <p className="text-xs text-muted truncate">@{user.username}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0 text-right">
        <div className="hidden sm:block text-xs text-muted">
          <div>{user.questions_count} questions</div>
          <div>{user.answers_count} answers</div>
        </div>

        <div className="rounded-xl bg-brand-soft px-3 py-1.5 text-center border border-brand/20">
          <span className="block text-xs font-extrabold text-brand tabular-nums">
            {user.reputation}
          </span>
          <span className="block text-[9px] uppercase tracking-wider font-semibold text-brand/80">
            pts
          </span>
        </div>
      </div>
    </div>
  );
}
