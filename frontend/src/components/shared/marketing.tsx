import type { ReactNode } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

export const publicNav = [
  { href: "/platform", label: "Platform" },
  { href: "/for-institutions", label: "For Institutions" },
  { href: "/for-lecturers", label: "For Lecturers" },
  { href: "/for-students", label: "For Students" },
  { href: "/resources", label: "Resources" },
] as const;

export function MarketingPageHeader({
  eyebrow,
  title,
  description,
  dark = false,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  dark?: boolean;
}) {
  return (
    <header className="mx-auto max-w-3xl text-center">
      {eyebrow ? (
        <div
          className={
            dark
              ? "inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold text-blue-300 backdrop-blur-md mb-4"
              : "inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-semibold text-blue-700 mb-4"
          }
        >
          <Sparkles className={dark ? "h-3.5 w-3.5 text-blue-400" : "h-3.5 w-3.5 text-blue-600"} />
          <span>{eyebrow}</span>
        </div>
      ) : null}
      <h1
        className={
          dark
            ? "text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl leading-tight"
            : "text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl leading-tight"
        }
      >
        {title}
      </h1>
      <p
        className={
          dark
            ? "mt-4 text-base leading-relaxed text-slate-300 sm:text-lg"
            : "mt-4 text-base leading-relaxed text-slate-600 sm:text-lg"
        }
      >
        {description}
      </p>
    </header>
  );
}

export function TextLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700 hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
    >
      <span>{children}</span>
      <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  );
}
