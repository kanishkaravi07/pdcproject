import QuestionsList from "../questions-list";
import { getQuestionsPage } from "@/lib/questions";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

export default async function PopularPage() {
  const { questions, hasMore } = await getQuestionsPage(0, PAGE_SIZE, "popular");

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 space-y-6">
      <header className="space-y-2 border-b border-border pb-5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
          All-Time Engagement
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
          <span>📈</span> Popular Questions
        </h1>
        <p className="text-sm text-muted">
          Questions with the highest overall votes and total community answers.
        </p>
      </header>

      <QuestionsList initialQuestions={questions} initialHasMore={hasMore} tab="popular" />
    </main>
  );
}
