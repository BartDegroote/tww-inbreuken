import Link from "next/link";
import type { ReactNode } from "react";

import TwwMerk from "./TwwMerk";

type AppBalkProps = {
  terugHref?: string;
  terugLabel?: string;
  rechts?: ReactNode;
};

export default function AppBalk({
  terugHref = "/",
  terugLabel = "Hoofdmenu",
  rechts,
}: AppBalkProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/80 bg-white/80 px-4 py-3 shadow-[0_10px_35px_rgba(15,23,42,0.06)] backdrop-blur sm:px-5">
      <TwwMerk href="/" compact />

      <div className="flex items-center gap-2">
        {rechts}
        <Link
          href={terugHref}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
          </svg>
          <span className="hidden sm:inline">{terugLabel}</span>
          <span className="sm:hidden">Terug</span>
        </Link>
      </div>
    </header>
  );
}
