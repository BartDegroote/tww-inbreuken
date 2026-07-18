import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header>
          <h1 className="text-4xl font-bold text-slate-900">
            TWW_Inbreuken
          </h1>

          <p className="mt-2 text-slate-600">
            Beheer inspecties, inbreuken en verslaggeving.
          </p>
        </header>

        <section className="mt-10 grid gap-5 md:grid-cols-2">
          <Link
            href="/inspecties/nieuw"
            className="rounded-xl bg-blue-700 p-6 text-white shadow-sm transition hover:bg-blue-800"
          >
            <h2 className="text-xl font-semibold">Nieuwe inspectie</h2>
            <p className="mt-2 text-blue-100">
              Maak een nieuw inspectiedossier aan.
            </p>
          </Link>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">
              Vorige inspecties
            </h2>
            <p className="mt-2 text-slate-500">
              Er zijn nog geen inspecties geregistreerd.
            </p>
          </div>

          <Link
            href="/bibliotheek"
            className="rounded-xl bg-white p-6 shadow-sm transition hover:bg-slate-50"
          >
            <h2 className="text-xl font-semibold text-slate-900">
              Bibliotheek inbreuken
            </h2>
            <p className="mt-2 text-slate-500">
              Beheer standaardteksten en wettelijke verwijzingen.
            </p>
          </Link>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">
              Instellingen
            </h2>
            <p className="mt-2 text-slate-500">
              Beheer inspecteurs en documentinstellingen.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}