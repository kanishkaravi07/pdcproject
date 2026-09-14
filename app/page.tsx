import Link from "next/link";
import { getQuestionsPage } from "@/lib/questions";
import { getPolls } from "@/lib/polls";
import { getLeaderboard } from "@/lib/leaderboard";
import QuestionCard from "@/components/QuestionCard";
import PollCard from "@/components/PollCard";
import LeaderboardCard from "@/components/LeaderboardCard";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [{ questions: trendingQs }, { questions: popularQs }, { questions: recentQs }, polls, leaderboard] =
    await Promise.all([
      getQuestionsPage(0, 4, "trending"),
      getQuestionsPage(0, 4, "popular"),
      getQuestionsPage(0, 4, "recent"),
      getPolls(),
      getLeaderboard(5),
    ]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 space-y-12">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-brand/20 bg-linear-to-b from-brand-soft/80 to-surface p-6 sm:p-10 shadow-sm">
        <div className="max-w-2xl space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            Live Q&amp;A &amp; Community Hub
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Ask questions, share knowledge, and vote in live polls.
          </h1>
          <p className="text-sm sm:text-base text-muted leading-relaxed">
            Welcome to Kealvi — a developer &amp; student community Q&amp;A platform. Get answers, upvote great solutions, earn reputation points, and rank on the leaderboard.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/questions"
              className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-strong"
            >
              Browse All Questions
            </Link>
            <Link
              href="/polls"
              className="rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-foreground transition-all hover:bg-background"
            >
              🗳️ Participate in Polls
            </Link>
            <Link
              href="/leaderboard"
              className="rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-foreground transition-all hover:bg-background"
            >
              🏆 View Leaderboard
            </Link>
          </div>
        </div>
      </section>

      {/* Grid Layout for Home Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-10">
          {/* 🔥 Trending Questions Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <span>🔥</span> Trending Questions
              </h2>
              <Link href="/trending" className="text-xs font-semibold text-brand hover:underline">
                View All →
              </Link>
            </div>

            <div className="space-y-3">
              {trendingQs.length > 0 ? (
                trendingQs.map((q) => <QuestionCard key={q.id} {...q} />)
              ) : (
                <p className="text-sm text-muted py-4">No trending questions right now.</p>
              )}
            </div>
          </section>

          {/* 📈 Popular Questions Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <span>📈</span> Popular Questions
              </h2>
              <Link href="/popular" className="text-xs font-semibold text-brand hover:underline">
                View All →
              </Link>
            </div>

            <div className="space-y-3">
              {popularQs.length > 0 ? (
                popularQs.map((q) => <QuestionCard key={q.id} {...q} />)
              ) : (
                <p className="text-sm text-muted py-4">No popular questions yet.</p>
              )}
            </div>
          </section>

          {/* 🕐 Recently Active Questions Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <span>🕐</span> Recently Active Questions
              </h2>
              <Link href="/recent" className="text-xs font-semibold text-brand hover:underline">
                View All →
              </Link>
            </div>

            <div className="space-y-3">
              {recentQs.length > 0 ? (
                recentQs.map((q) => <QuestionCard key={q.id} {...q} />)
              ) : (
                <p className="text-sm text-muted py-4">No recent activity.</p>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar Column (1 Col) */}
        <div className="space-y-10">
          {/* 🗳️ Live Polls Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
                <span>🗳️</span> Live Polls
              </h2>
              <Link href="/polls" className="text-xs font-semibold text-brand hover:underline">
                All Polls →
              </Link>
            </div>

            <div className="space-y-4">
              {polls.slice(0, 2).map((poll) => (
                <PollCard key={poll.id} initialPoll={poll} />
              ))}

              {polls.length === 0 && (
                <p className="text-xs text-muted">No active polls. Create one!</p>
              )}
            </div>
          </section>

          {/* 🏆 Leaderboard Preview */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
                <span>🏆</span> Top Contributors
              </h2>
              <Link href="/leaderboard" className="text-xs font-semibold text-brand hover:underline">
                Full Rank →
              </Link>
            </div>

            <div className="space-y-3">
              {leaderboard.length > 0 ? (
                leaderboard.map((user) => <LeaderboardCard key={user.id} user={user} />)
              ) : (
                <p className="text-xs text-muted">No contributors yet.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
