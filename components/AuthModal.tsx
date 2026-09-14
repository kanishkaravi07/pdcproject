"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, authModalMode, openAuthModal } = useAuth();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      if (authModalMode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        closeAuthModal();
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username.trim() || email.split("@")[0],
              display_name: displayName.trim() || username.trim() || email.split("@")[0],
            },
          },
        });
        if (error) throw error;
        closeAuthModal();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border bg-surface p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">
            {authModalMode === "login" ? "Welcome back to Kealvi" : "Join Kealvi Community"}
          </h2>
          <button
            onClick={closeAuthModal}
            className="rounded-lg p-1 text-muted hover:bg-background transition-colors"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {authModalMode === "signup" && (
            <>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="johndoe"
                  className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:border-brand"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-muted mb-1">Email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:border-brand"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:border-brand"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-strong disabled:opacity-50"
          >
            {loading
              ? "Please wait..."
              : authModalMode === "login"
              ? "Sign In"
              : "Create Account"}
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-muted">
          {authModalMode === "login" ? (
            <p>
              Don't have an account?{" "}
              <button
                onClick={() => openAuthModal("signup")}
                className="font-medium text-brand hover:underline"
              >
                Sign Up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <button
                onClick={() => openAuthModal("login")}
                className="font-medium text-brand hover:underline"
              >
                Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
