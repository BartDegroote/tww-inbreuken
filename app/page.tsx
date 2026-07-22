import Link from "next/link";

import { vereisGebruiker } from "@/lib/auth";
import { afmelden } from "@/app/login/actions";
import TwwMerk from "@/app/componenten/TwwMerk";

const keuzes = [
  {
    href: "/inspecties/nieuw",
    nummer: "01",
    titel: "Nieuwe inspectie",
    kleur: "from-blue-600 to-blue-800",
    icoon: "nieuw",
  },
  {
    href: "/inspecties",
    nummer: "02",
    titel: "Opgeslagen inspecties",
    kleur: "from-slate-700 to-slate-950",
    icoon: "inspecties",
  },
  {
    href: "/bibliotheek",
    nummer: "03",
    titel: "Bibliotheek",
    kleur: "from-cyan-600 to-cyan-800",
    icoon: "bibliotheek",
  },
  {
    href: "/instellingen",
    nummer: "04",
    titel: "Instellingen",
    kleur: "from-slate-500 to-slate-700",
    icoon: "instellingen",
  },
];

function DashboardIcoon({ type }: { type: string }) {
  const gemeenschappelijk = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" {...gemeenschappelijk}>
      {type === "nieuw" && (
        <>
          <path d="M12 5v14M5 12h14" />
          <path d="M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" opacity=".45" />
        </>
      )}
      {type === "inspecties" && (
        <>
          <path d="M8 7h9M8 12h9M8 17h6" />
          <path d="M4 4h16v16H4z" opacity=".55" />
        </>
      )}
      {type === "bibliotheek" && (
        <>
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5v-16ZM20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16Z" />
        </>
      )}
      {type === "instellingen" && (
        <>
          <path d="M12 15.25A3.25 3.25 0 1 0 12 8.75a3.25 3.25 0 0 0 0 6.5Z" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.86 2.86-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.1A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.86-2.86.06-.06A1.7 1.7 0 0 0 4.2 15a1.7 1.7 0 0 0-1.2-1H3v-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.88L4.2 7.06 7.06 4.2l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.5V3h4v.1A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.86 2.86-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.5 1h.1v4h-.1a1.7 1.7 0 0 0-1.5 1Z" opacity=".6" />
        </>
      )}
    </svg>
  );
}

export default async function Home() {
  const gebruiker = await vereisGebruiker();

  return (
    <main className="tww-canvas min-h-screen text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-6 sm:px-8 sm:py-8">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/80 bg-white/75 px-4 py-3 shadow-[0_12px_40px_rgba(15,23,42,0.06)] backdrop-blur sm:px-5">
          <TwwMerk />

          <div className="flex items-center gap-3 text-sm">
            <span className="hidden font-medium text-slate-500 sm:inline">{gebruiker.naam}</span>
            <form action={afmelden}>
              <button className="min-h-10 rounded-xl border border-slate-200 bg-white px-3.5 py-2 font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                Afmelden
              </button>
            </form>
          </div>
        </header>

        <section className="flex flex-1 flex-col justify-center py-10 sm:py-14">
          <div className="max-w-xl">
            <h1 className="text-4xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl">
              WebApp TWW
            </h1>
            <div className="mt-4 h-1 w-16 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500" />
          </div>

          <nav aria-label="Hoofdkeuzes" className="mt-8 grid max-w-5xl gap-4 sm:grid-cols-2">
            {keuzes.map((keuze) => (
              <Link
                key={keuze.href}
                href={keuze.href}
                className="group relative flex min-h-32 items-center gap-5 overflow-hidden rounded-2xl border border-white bg-white/90 p-5 shadow-[0_10px_35px_rgba(15,23,42,0.07)] transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_18px_45px_rgba(30,64,175,0.13)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:p-6"
              >
                <span className="absolute right-0 top-0 h-24 w-24 -translate-y-12 translate-x-12 rounded-full border border-blue-100 transition group-hover:scale-125" />
                <span className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ${keuze.kleur}`}>
                  <DashboardIcoon type={keuze.icoon} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block font-mono text-[10px] font-bold tracking-[0.22em] text-slate-400">
                    {keuze.nummer}
                  </span>
                  <span className="mt-1.5 block text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">
                    {keuze.titel}
                  </span>
                </span>

                <span className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition group-hover:translate-x-1 group-hover:border-blue-200 group-hover:bg-blue-50 group-hover:text-blue-700">
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
                  </svg>
                </span>
              </Link>
            ))}
          </nav>
        </section>

        <footer className="flex flex-col gap-2 border-t border-slate-300/80 pt-5 text-xs font-medium text-slate-500 sm:flex-row sm:items-center sm:justify-between">
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
