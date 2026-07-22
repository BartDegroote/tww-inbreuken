"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { maakInspectie } from "@/app/inspecties/actions";

export default function NieuweInspectie() {
  const router = useRouter();

  const [onderneming, setOnderneming] = useState("");
  const [adres, setAdres] = useState("");
  const [inspectiedatum, setInspectiedatum] = useState("");
  const [inspecteur, setInspecteur] = useState("Bart Degroote");
  const [flowJaar, setFlowJaar] = useState("");
  const [flowNummer, setFlowNummer] = useState("");
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState("");

  async function startInspectie(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBezig(true);
    setFout("");

    try {
      const inspectieId = await maakInspectie({
        onderneming,
        adres,
        inspectiedatum,
        inspecteur,
        flow: `02/${flowJaar}/${flowNummer}`,
      });

      router.push(`/inspecties/uitvoeren?id=${inspectieId}`);
    } catch (error) {
      console.error(error);
      setFout("De inspectie kon niet worden aangemaakt.");
      setBezig(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
        <Link
          href="/"
          className="text-sm font-medium text-blue-700 hover:underline"
        >
          ← Terug naar dashboard
        </Link>

        <div className="mt-6 rounded-xl bg-white p-5 shadow-sm sm:p-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Nieuwe inspectie
          </h1>

          <p className="mt-2 text-slate-600">
            Vul de algemene gegevens van het inspectiebezoek in.
          </p>

          <form onSubmit={startInspectie} className="mt-8 space-y-6">
            <div>
              <label
                htmlFor="onderneming"
                className="block text-sm font-medium text-slate-700"
              >
                Onderneming
              </label>

              <input
                id="onderneming"
                type="text"
                value={onderneming}
                onChange={(event) => setOnderneming(event.target.value)}
                required
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label
                htmlFor="adres"
                className="block text-sm font-medium text-slate-700"
              >
                Adres
              </label>

              <input
                id="adres"
                type="text"
                value={adres}
                onChange={(event) => setAdres(event.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label
                htmlFor="inspectiedatum"
                className="block text-sm font-medium text-slate-700"
              >
                Inspectiedatum
              </label>

              <input
                id="inspectiedatum"
                type="date"
                value={inspectiedatum}
                onChange={(event) => setInspectiedatum(event.target.value)}
                required
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label
                htmlFor="inspecteur"
                className="block text-sm font-medium text-slate-700"
              >
                Inspecteur
              </label>

              <input
                id="inspecteur"
                type="text"
                value={inspecteur}
                onChange={(event) => setInspecteur(event.target.value)}
                required
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Flow
              </label>

              <div className="mt-2 flex items-center gap-2">
                <div className="rounded-lg border border-slate-300 bg-slate-100 px-4 py-3 text-slate-700">
                  02
                </div>

                <span className="text-slate-500">/</span>

                <input
                  id="flowJaar"
                  type="text"
                  inputMode="numeric"
                  placeholder="2026"
                  maxLength={4}
                  pattern="[0-9]{4}"
                  title="Geef een jaar van vier cijfers in."
                  value={flowJaar}
                  onChange={(event) =>
                    setFlowJaar(event.target.value.replace(/\D/g, ""))
                  }
                  required
                  className="w-28 rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
                />

                <span className="text-slate-500">/</span>

                <input
                  id="flowNummer"
                  type="text"
                  inputMode="numeric"
                  placeholder="123"
                  pattern="[0-9]+"
                  title="Geef alleen cijfers in."
                  value={flowNummer}
                  onChange={(event) =>
                    setFlowNummer(event.target.value.replace(/\D/g, ""))
                  }
                  required
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
                />
              </div>

              <p className="mt-2 text-sm text-slate-500">
                Voorbeeld: 02/2026/123
              </p>
            </div>

            {fout && (
              <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {fout}
              </p>
            )}

            <button
              type="submit"
              disabled={bezig}
              className="w-full rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {bezig ? "Inspectie wordt aangemaakt..." : "Inspectie starten"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
