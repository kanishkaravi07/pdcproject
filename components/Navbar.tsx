"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import UserAvatar from "./UserAvatar";
import AuthModal from "./AuthModal";
import AskQuestionModal from "./AskQuestionModal";
import CreatePollModal from "./CreatePollModal";

export default function Navbar() {
  const pathname = usePathname();
  const { user, profile, openAuthModal, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAskModalOpen, setIsAskModalOpen] = useState(false);
  const [isPollModalOpen, setIsPollModalOpen] = useState(false);

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Questions", href: "/questions" },
    { label: "🔥 Trending", href: "/trending" },
    { label: "📈 Popular", href: "/popular" },
    { label: "🕐 Recent", href: "/recent" },
    { label: "🗳️ Polls", href: "/polls" },
    { label: "🏆 Leaderboard", href: "/leaderboard" },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/80 bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          {/* Logo & Main Nav */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white font-bold text-lg shadow-sm transition-transform group-hover:scale-105">
                K
              </span>
              <span className="text-xl font-bold tracking-tight text-foreground">
                Kealvi
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-brand-soft text-brand font-semibold"
                        : "text-muted hover:text-foreground hover:bg-background"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Action Buttons & User Menu */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={() => setIsAskModalOpen(true)}
              className="rounded-xl border border-brand/30 bg-brand-soft px-3.5 py-2 text-xs font-semibold text-brand transition-colors hover:bg-brand/10"
            >
              + Ask Question
            </button>

            <button
              onClick={() => setIsPollModalOpen(true)}
              className="rounded-xl border border-border bg-surface px-3.5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-background"
            >
              + Create Poll
            </button>

            {user ? (
              <div className="flex items-center gap-3 pl-2 border-l border-border">
                <div className="flex items-center gap-2">
                  <UserAvatar
                    name={profile?.display_name || profile?.username || user.email}
                    avatarUrl={profile?.avatar_url}
                    size="sm"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-medium leading-none text-foreground">
                      {profile?.display_name || profile?.username || user.email?.split("@")[0]}
                    </span>
                    <span className="text-[10px] font-semibold text-brand leading-tight mt-0.5">
                      🏆 {profile?.reputation ?? 0} pts
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => signOut()}
                  className="rounded-lg p-1 text-xs text-muted hover:text-red-500 transition-colors"
                  title="Log Out"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-2 border-l border-border">
                <button
                  onClick={() => openAuthModal("login")}
                  className="rounded-xl px-3 py-2 text-xs font-medium text-muted hover:text-foreground transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => openAuthModal("signup")}
                  className="rounded-xl bg-brand px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-brand-strong"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-xl border border-border p-2 text-muted hover:bg-background lg:hidden"
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-border bg-surface px-4 py-4 lg:hidden space-y-3">
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`rounded-xl px-3 py-2 text-sm font-medium ${
                    pathname === link.href
                      ? "bg-brand-soft text-brand font-semibold"
                      : "text-muted hover:bg-background"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex flex-col gap-2 pt-2 border-t border-border">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsAskModalOpen(true);
                }}
                className="w-full rounded-xl bg-brand-soft py-2 text-sm font-semibold text-brand text-center"
              >
                + Ask Question
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsPollModalOpen(true);
                }}
                className="w-full rounded-xl border py-2 text-sm font-medium text-center"
              >
                + Create Poll
              </button>
            </div>

            {user ? (
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <UserAvatar
                    name={profile?.display_name || profile?.username || user.email}
                    avatarUrl={profile?.avatar_url}
                    size="sm"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-medium">
                      {profile?.display_name || profile?.username}
                    </span>
                    <span className="text-[10px] text-brand font-semibold">
                      🏆 {profile?.reputation ?? 0} pts
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs text-red-500 font-medium"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex gap-2 pt-3 border-t border-border">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal("login");
                  }}
                  className="flex-1 rounded-xl border py-2 text-xs font-medium text-center"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal("signup");
                  }}
                  className="flex-1 rounded-xl bg-brand py-2 text-xs font-semibold text-white text-center"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      <AuthModal />
      <AskQuestionModal
        isOpen={isAskModalOpen}
        onClose={() => setIsAskModalOpen(false)}
      />
      <CreatePollModal
        isOpen={isPollModalOpen}
        onClose={() => setIsPollModalOpen(false)}
      />
    </>
  );
}
