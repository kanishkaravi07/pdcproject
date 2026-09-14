import LeaderboardCard from "@/components/LeaderboardCard";
import { getLeaderboard } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const leaderboard = await getLeaderboard(50);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 space-y-8">
      <header className="space-y-2 border-b border-border pb-5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
          Community Rankings
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
          <span>🏆</span> Leaderboard
        </h1>
        <p className="text-sm text-muted">
          Top contributors ranked by reputation earned from quality questions, helpful answers, and accepted solutions.
        </p>
      </header>

      {/* Reputation Rules Card */}
      <div className="rounded-2xl border border-brand/20 bg-brand-soft/40 p-4 space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-brand">
          💡 How to Earn Reputation Points
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-foreground font-medium pt-1">
          <div className="bg-surface p-2 rounded-xl border border-border">
            <span className="text-brand font-bold">+5 pts</span> Ask a question
          </div>
          <div className="bg-surface p-2 rounded-xl border border-border">
            <span className="text-brand font-bold">+10 pts</span> Question upvote
          </div>
          <div className="bg-surface p-2 rounded-xl border border-border">
            <span className="text-brand font-bold">+5 pts</span> Post an answer
          </div>
          <div className="bg-surface p-2 rounded-xl border border-border">
            <span className="text-brand font-bold">+10 pts</span> Answer upvote
          </div>
          <div className="bg-surface p-2 rounded-xl border border-border col-span-2 sm:col-span-1">
            <span className="text-emerald-600 font-bold">+25 pts</span> Accepted answer
          </div>
        </div>
      </div>

      {/* Leaderboard Table / Cards */}
      <div className="space-y-3">
        {leaderboard.length > 0 ? (
          leaderboard.map((user) => <LeaderboardCard key={user.id} user={user} />)
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted">
            No ranked users yet. Sign up and start asking or answering to climb the leaderboard!
          </div>
        )}
      </div>
    </main>
  );
}
