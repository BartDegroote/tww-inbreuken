"use client";

import Link from "next/link";

export default function InspectieUitvoerenFout({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="tww-canvas flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-xl sm:p-8">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
            <path d="M12 9v4m0 4h.01M10.3 3.7 2.8 17a2 2 0 0 0 1.74 3h14.92a2 2 0 0 0 1.74-3L13.7 3.7a2 2 0 0 0-3.4 0Z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <h1 className="mt-4 text-xl font-extrabold text-slate-950">
          De inspectie kon niet worden weergegeven
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Reeds opgeslagen gegevens blijven bewaard. Probeer de inspectie opnieuw te laden.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={reset}
            className="min-h-11 rounded-xl bg-blue-700 px-4 py-2.5 font-bold text-white transition hover:bg-blue-800"
          >
            Opnieuw proberen
          </button>
          <Link
            href="/inspecties"
            className="flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Naar inspecties
          </Link>
        </div>
      </section>
    </main>
  );
}
