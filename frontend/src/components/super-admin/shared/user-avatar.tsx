"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

const palette = [
  "bg-teal-700 text-white",
  "bg-sky-700 text-white",
  "bg-indigo-700 text-white",
  "bg-violet-700 text-white",
  "bg-rose-700 text-white",
  "bg-amber-700 text-white",
  "bg-emerald-700 text-white",
];

function colorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash + name.charCodeAt(i) * (i + 1)) % palette.length;
  }
  return palette[hash] ?? palette[0];
}

export function UserAvatar({
  name,
  src,
  size = "md",
  className,
}: {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const initials = getInitials(name);
  const showImage = Boolean(src) && !failed;

  const sizeClass =
    size === "sm" ? "h-8 w-8 text-[10px]" : size === "lg" ? "h-12 w-12 text-sm" : "h-10 w-10 text-xs";

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold ring-2 ring-white shadow-sm",
        sizeClass,
        !showImage && colorFor(name),
        className,
      )}
      aria-hidden={!showImage}
      title={name}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- storage URLs are local/dynamic keys
        <img
          src={src!}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        initials
      )}
    </span>
  );
}
