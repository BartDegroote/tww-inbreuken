import Link from "next/link";

import { vereisGebruiker } from "@/lib/auth";
import { afmelden } from "@/app/login/actions";

const keuzes = [
  {
    href: "/inspecties/nieuw",
    nummer: "01",
    titel: "Nieuwe inspectie",
    kleur: "bg-blue-700",
    symbool: "+",
  },
  {
    href: "/inspecties",
    nummer: "02",
    titel: "Opgeslagen inspecties",
    kleur: "bg-slate-800",
    symbool: "↗",
  },
  {
    href: "/bibliotheek",
    nummer: "03",
    titel: "Bibliotheek",
    kleur: "bg-cyan-700",
    symbool: "≡",
  },
  {
    href: "/instellingen",
    nummer: "04",
    titel: "Instellingen",
    kleur: "bg-slate-600",
    symbool: "⚙",
  },
];

export default async function Home() {
  const gebruiker = await vereisGebruiker();

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-6 sm:px-8 sm:py-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-300 pb-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-700 text-xs font-black tracking-wider text-white">
              TWW
            </div>
            <div>
              <p className="text-base font-bold tracking-tight">WebApp TWW</p>
              <p className="text-xs text-slate-500">Inspectie &amp; verslaggeving</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-500">{gebruiker.naam}</span>
            <form action={afmelden}>
              <button className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-medium text-slate-700 hover:bg-slate-50">
                Afmelden
              </button>
            </form>
          </div>
        </header>

        <section className="flex flex-1 flex-col justify-center py-12 sm:py-16">
          <div className="max-w-xl">
            <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              WebApp TWW
            </h1>
          </div>

          <nav aria-label="Hoofdkeuzes" className="mt-10 grid max-w-4xl gap-4 sm:grid-cols-2">
            {keuzes.map((keuze) => (
              <Link
                key={keuze.href}
                href={keuze.href}
                className="group flex min-h-28 items-center gap-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 sm:p-6"
              >
                <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-2xl font-bold text-white shadow-sm ${keuze.kleur}`}>
                  {keuze.symbool}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] font-bold tracking-[0.2em] text-slate-400">
                    {keuze.nummer}
                  </span>
                  <span className="mt-1.5 block text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                    {keuze.titel}
                  </span>
                </span>

                <span className="text-xl text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-700">
                  →
                </span>
              </Link>
            ))}
          </nav>
        </section>

        <footer className="flex flex-col gap-2 border-t border-slate-300 pt-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            WebApp TWW · <Link href="/privacy" className="hover:text-slate-700 hover:underline">Privacy</Link>
          </p>
          <p>
            Ontwikkeld door <span className="font-semibold text-slate-700">Bart Degroote</span>
          </p>
        </footer>
      </div>
    </main>
  );
}
