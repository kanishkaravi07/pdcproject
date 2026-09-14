"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { getVoterId } from "@/lib/voter";
import { useAuth } from "@/lib/auth-context";
import UserAvatar from "@/components/UserAvatar";
import AnswerCard, { AnswerItem } from "@/components/AnswerCard";
import CommentSection, { CommentItem } from "@/components/CommentSection";

type QuestionDetail = {
  id: string;
  body: string;
  author: string | null;
  user_id?: string | null;
  created_at: string;
  votes: number;
  answers: AnswerItem[];
  comments: CommentItem[];
};

export default function QuestionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, profile, openAuthModal } = useAuth();

  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [votes, setVotes] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);

  const [answerDraft, setAnswerDraft] = useState("");
  const [guestAuthor, setGuestAuthor] = useState("");
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  const fetchQuestion = async () => {
    try {
      const res = await fetch(`/api/questions/${id}`);
      if (res.ok) {
        const data = await res.json();
        setQuestion(data);
        setVotes(data.votes);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestion();
  }, [id]);

  const handleQuestionVote = async () => {
    if (hasVoted) return;
    setVotes((v) => v + 1);
    setHasVoted(true);

    try {
      const res = await fetch(`/api/questions/${id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voterId: getVoterId(),
          userId: user?.id || null,
        }),
      });
      if (!res.ok) {
        setVotes((v) => v - 1);
        setHasVoted(false);
      }
    } catch {
      setVotes((v) => v - 1);
      setHasVoted(false);
    }
  };

  const handleAddAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerDraft.trim()) return;

    setSubmittingAnswer(true);
    try {
      const res = await fetch(`/api/questions/${id}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: answerDraft.trim(),
          userId: user?.id || null,
          authorName: profile?.display_name || profile?.username || guestAuthor.trim() || "Guest",
        }),
      });

      const newAnswer = await res.json();
      if (!res.ok) throw new Error(newAnswer.error || "Failed to post answer");

      setAnswerDraft("");
      fetchQuestion();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingAnswer(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-12 text-center text-muted">
        Loading question details...
      </main>
    );
  }

  if (!question) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-12 text-center space-y-4">
        <h1 className="text-2xl font-bold">Question not found</h1>
        <Link href="/questions" className="text-sm font-semibold text-brand hover:underline">
          ← Back to questions
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 space-y-8">
      <Link href="/questions" className="inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-brand">
        ← Back to Questions
      </Link>

      {/* Main Question Card */}
      <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm space-y-5">
        <div className="flex items-start gap-4">
          <button
            onClick={handleQuestionVote}
            className={`flex shrink-0 flex-col items-center gap-1 rounded-xl border px-3.5 py-2.5 transition-colors ${
              hasVoted
                ? "border-brand bg-brand-soft text-brand font-bold"
                : "border-border text-brand hover:border-brand hover:bg-brand-soft"
            }`}
          >
            <span className="text-sm leading-none">▲</span>
            <span className="text-sm font-bold leading-none tabular-nums">{votes}</span>
          </button>

          <div className="min-w-0 flex-1 space-y-3">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-snug">
              {question.body}
            </h1>

            <div className="flex items-center gap-2 text-xs text-muted">
              <UserAvatar name={question.author} size="sm" />
              <span className="font-semibold text-foreground">{question.author || "Anonymous"}</span>
              <span>• Asked {new Date(question.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Comments on Question */}
        <CommentSection questionId={question.id} initialComments={question.comments} />
      </div>

      {/* Answers Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-lg font-bold tracking-tight">
            💬 {question.answers.length} {question.answers.length === 1 ? "Answer" : "Answers"}
          </h2>
        </div>

        <div className="space-y-4">
          {question.answers.map((ans) => (
            <AnswerCard
              key={ans.id}
              answer={ans}
              questionUserId={question.user_id}
              onAnswerUpdated={fetchQuestion}
            />
          ))}

          {question.answers.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted">
              No answers yet. Be the first to answer this question!
            </p>
          )}
        </div>

        {/* Submit Answer Form */}
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-foreground">Your Answer</h3>
          <form onSubmit={handleAddAnswer} className="space-y-3">
            <textarea
              required
              rows={4}
              value={answerDraft}
              onChange={(e) => setAnswerDraft(e.target.value)}
              placeholder="Write a helpful, detailed answer..."
              className="w-full rounded-xl border border-border bg-background p-3.5 text-sm outline-none placeholder:text-muted focus:border-brand resize-none"
            />

            {!user && (
              <div>
                <input
                  type="text"
                  value={guestAuthor}
                  onChange={(e) => setGuestAuthor(e.target.value)}
                  placeholder="Your Name (Optional)"
                  className="w-full max-w-xs rounded-xl border border-border bg-background px-3.5 py-2 text-xs outline-none focus:border-brand"
                />
                <p className="mt-1 text-xs text-muted">
                  Want reputation points for answering?{" "}
                  <button
                    type="button"
                    onClick={() => openAuthModal("login")}
                    className="font-semibold text-brand hover:underline"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={submittingAnswer || !answerDraft.trim()}
              className="rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-strong disabled:opacity-50"
            >
              {submittingAnswer ? "Posting..." : "Post Your Answer"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
