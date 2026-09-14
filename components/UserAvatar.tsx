import React from "react";

export default function UserAvatar({
  name,
  avatarUrl,
  size = "md",
}: {
  name?: string | null;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const displayName = name || "Anonymous";
  const initial = displayName.charAt(0).toUpperCase();

  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base",
  }[size];

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={displayName}
        className={`${sizeClasses} rounded-full object-cover border border-border`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses} rounded-full bg-brand-soft text-brand font-semibold flex items-center justify-center border border-brand/20 shrink-0`}
    >
      {initial}
    </div>
  );
}
