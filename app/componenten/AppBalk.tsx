"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppBalk() {
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
      href: "/105-roken",
      label: "105 - roken",
      kortLabel: "105",
      actief: pathname.startsWith(
        "/105-roken",
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
    <header className="relative left-1/2 w-[calc(100vw-2rem)] max-w-screen-2xl -translate-x-1/2 rounded-xl border border-white/80 bg-white/85 p-1 shadow-[0_8px_28px_rgba(15,23,42,0.06)] backdrop-blur sm:w-[calc(100vw-3rem)] lg:w-[calc(100vw-4rem)]">
      <nav
        aria-label="Hoofdnavigatie"
        className="grid grid-cols-5 gap-1 rounded-lg bg-slate-100 p-1"
      >
        {tabbladen.map((tabblad) => (
          <Link
            key={tabblad.href}
            href={tabblad.href}
            aria-label={tabblad.label}
            aria-current={
              tabblad.actief ? "page" : undefined
            }
            className={`flex min-h-10 min-w-0 items-center justify-center rounded-lg px-1 py-2 text-center text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:px-3 sm:text-sm ${
              tabblad.actief
                ? "bg-white text-blue-800 shadow-sm"
                : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
            }`}
          >
            <span aria-hidden="true" className="sm:hidden">
              {tabblad.kortLabel}
            </span>
            <span aria-hidden="true" className="hidden sm:inline">
              {tabblad.label}
            </span>
          </Link>
        ))}
      </nav>
    </header>
  );
}
