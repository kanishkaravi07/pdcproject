"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";

export default function CreatePollModal({
  isOpen,
  onClose,
  onPollCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onPollCreated?: (poll: any) => void;
}) {
  const { user, profile } = useAuth();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [authorName, setAuthorName] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleOptionChange = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, ""]);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOptions = options.map((o) => o.trim()).filter(Boolean);

    if (!question.trim() || cleanOptions.length < 2) {
      alert("Please enter a poll question and at least 2 options.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          options: cleanOptions,
          author: profile?.display_name || profile?.username || authorName.trim() || "Anonymous",
          userId: user?.id || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create poll");

      setQuestion("");
      setOptions(["", ""]);
      onPollCreated?.(data);
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
          <h2 className="text-xl font-bold tracking-tight">Create Live Poll</h2>
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
              Poll Topic / Question
            </label>
            <input
              type="text"
              required
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Which web framework do you prefer?"
              className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none placeholder:text-muted focus:border-brand"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-2">
              Poll Options (Min 2, Max 6)
            </label>
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    required
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`Option ${idx + 1}`}
                    className="flex-1 rounded-xl border bg-background px-4 py-2 text-sm outline-none placeholder:text-muted focus:border-brand"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(idx)}
                      className="rounded-lg p-2 text-xs text-muted hover:text-red-500 transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            {options.length < 6 && (
              <button
                type="button"
                onClick={addOption}
                className="mt-2 text-xs font-medium text-brand hover:underline"
              >
                + Add Option
              </button>
            )}
          </div>

          {!user && (
            <div>
              <label className="block text-xs font-medium text-muted mb-1">
                Your Name (Optional)
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="e.g. Sam"
                className="w-full rounded-xl border bg-background px-4 py-2 text-sm outline-none focus:border-brand"
              />
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
              disabled={loading}
              className="rounded-xl bg-brand px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-strong disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Poll"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
