"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import AppBalk from "@/app/componenten/AppBalk";
import { maakInspectie } from "@/app/inspecties/actions";

const HUIDIG_JAAR = String(new Date().getFullYear());

export default function NieuweInspectie() {
  const router = useRouter();

  const [onderneming, setOnderneming] = useState("");
  const [adres, setAdres] = useState("");
  const [inspectiedatum, setInspectiedatum] = useState("");
  const [inspecteur, setInspecteur] = useState("Bart Degroote");
  const [flowJaar, setFlowJaar] = useState(HUIDIG_JAAR);
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
    <main className="tww-canvas min-h-screen">
      <div className="mx-auto max-w-3xl px-4 pb-6 pt-6 sm:px-6 sm:pb-10">
        <AppBalk />

        <div className="mt-5 rounded-2xl border border-white bg-white/95 p-5 shadow-[0_14px_45px_rgba(15,23,42,0.07)] sm:p-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">
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
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
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
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
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
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
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
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Flow
              </label>

              <div className="mt-2 flex items-center gap-2">
                <div className="flex min-h-12 items-center rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 font-semibold text-slate-700">
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
                  className="min-h-12 w-24 rounded-xl border border-slate-300 px-3 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100 sm:w-28 sm:px-4"
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
                  className="min-h-12 min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100 sm:px-4"
                />
              </div>

              <p className="mt-2 text-sm text-slate-500">
                Het huidige jaar is vooraf ingevuld. Voorbeeld: 02/{HUIDIG_JAAR}/123
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
              className="min-h-12 w-full rounded-xl bg-gradient-to-r from-blue-700 to-blue-800 px-6 py-3 font-bold text-white shadow-[0_10px_25px_rgba(29,78,216,0.18)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:translate-y-0 disabled:bg-slate-400 disabled:shadow-none"
            >
              {bezig ? "Inspectie wordt aangemaakt..." : "Inspectie starten"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
