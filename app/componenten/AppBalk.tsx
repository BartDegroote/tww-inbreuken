"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import TwwMerk from "./TwwMerk";

type AppBalkProps = {
  terugHref?: string;
  terugLabel?: string;
  rechts?: ReactNode;
};

export default function AppBalk({
  rechts,
}: AppBalkProps) {
  const pathname = usePathname();
  const tabbladen = [
    {
      href: "/inspecties",
      label: "Inspecties",
      kortLabel: "Inspecties",
      actief:
        pathname === "/inspecties" ||
        pathname.startsWith(
          "/inspecties/uitvoeren",
        ),
    },
    {
      href: "/inspecties/nieuw",
      label: "Nieuwe inspectie",
      kortLabel: "Nieuw",
      actief: pathname.startsWith(
        "/inspecties/nieuw",
      ),
    },
    {
      href: "/bibliotheek",
      label: "Bibliotheek",
      kortLabel: "Bibliotheek",
      actief: pathname.startsWith(
        "/bibliotheek",
      ),
    },
    {
      href: "/instellingen",
      label: "Instellingen",
      kortLabel: "Instellingen",
      actief: pathname.startsWith(
        "/instellingen",
      ),
    },
  ];

  return (
    <header className="rounded-2xl border border-white/80 bg-white/85 px-3 py-3 shadow-[0_10px_35px_rgba(15,23,42,0.06)] backdrop-blur sm:px-5">
      <div className="flex items-center justify-between gap-3">
        <TwwMerk href="/" compact />
        {rechts}
      </div>

      <nav
        aria-label="Hoofdnavigatie"
        className="mt-3 grid grid-cols-4 gap-1 rounded-xl bg-slate-100 p-1"
      >
        {tabbladen.map((tabblad) => (
          <Link
            key={tabblad.href}
            href={tabblad.href}
            aria-current={
              tabblad.actief ? "page" : undefined
            }
            className={`flex min-h-10 min-w-0 items-center justify-center rounded-lg px-1 py-2 text-center text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:px-3 sm:text-sm ${
              tabblad.actief
                ? "bg-white text-blue-800 shadow-sm"
                : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
            }`}
          >
            <span className="sm:hidden">
              {tabblad.kortLabel}
            </span>
            <span className="hidden sm:inline">
              {tabblad.label}
            </span>
          </Link>
        ))}
      </nav>
    </header>
  );
}
