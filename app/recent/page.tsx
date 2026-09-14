import QuestionsList from "../questions-list";
import { getQuestionsPage } from "@/lib/questions";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

export default async function RecentPage() {
  const { questions, hasMore } = await getQuestionsPage(0, PAGE_SIZE, "recent");

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 space-y-6">
      <header className="space-y-2 border-b border-border pb-5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
          Latest Activity
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
          <span>🕐</span> Recently Active Questions
        </h1>
        <p className="text-sm text-muted">
          Sorted by the latest activity timestamp including new answers, comments, and votes.
        </p>
      </header>

      <QuestionsList initialQuestions={questions} initialHasMore={hasMore} tab="recent" />
    </main>
  );
}
