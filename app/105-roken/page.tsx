"use client";

import { FormEvent, useState } from "react";

import AppBalk from "@/app/componenten/AppBalk";
import {
  ROKEN_SJABLOON_PAD,
  formatteerRapportDatum,
  maakRokenDocxBuffer,
  maakRokenWordBestandsnaam,
} from "@/lib/roken-word-export";

type LocatieType = "adres" | "autosnelweg";

const HUIDIG_JAAR = String(new Date().getFullYear());
const INVOERKLASSE =
  "mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100";

function alleenCijfers(waarde: string, maximum?: number): string {
  const cijfers = waarde.replace(/\D/g, "");
  return maximum ? cijfers.slice(0, maximum) : cijfers;
}

function formatteerKboInvoer(waarde: string): string {
  const cijfers = alleenCijfers(waarde, 10);
  const delen = [
    cijfers.slice(0, 4),
    cijfers.slice(4, 7),
    cijfers.slice(7, 10),
  ].filter(Boolean);

  return delen.join(".");
}

function formatteerInvoerdatum(waarde: string): string {
  const [jaar, maand, dag] = waarde.split("-");

  if (!jaar || !maand || !dag) {
    throw new Error("Vul een geldige datum van de vaststelling in.");
  }

  return `${dag}/${maand}/${jaar}`;
}

function DownloadIcoon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0 4-4m-4 4-4-4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 19h14" />
    </svg>
  );
}

export default function Roken105Pagina() {
  const [onderneming, setOnderneming] = useState("");
  const [straatEnNummer, setStraatEnNummer] = useState("");
  const [postcode, setPostcode] = useState("");
  const [plaats, setPlaats] = useState("");
  const [kboNummer, setKboNummer] = useState("");
  const [flowJaar, setFlowJaar] = useState(HUIDIG_JAAR);
  const [flowNummer, setFlowNummer] = useState("");
  const [locatieType, setLocatieType] = useState<LocatieType>("adres");
  const [locatieStraat, setLocatieStraat] = useState("");
  const [locatiePostcode, setLocatiePostcode] = useState("");
  const [locatiePlaats, setLocatiePlaats] = useState("");
  const [autosnelweg, setAutosnelweg] = useState("");
  const [autosnelwegPlaats, setAutosnelwegPlaats] = useState("");
  const [vaststellingsDatum, setVaststellingsDatum] = useState("");
  const [tijdstip, setTijdstip] = useState("");
  const [plaatEerste, setPlaatEerste] = useState("");
  const [plaatLetters, setPlaatLetters] = useState("");
  const [plaatCijfers, setPlaatCijfers] = useState("");
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState("");

  const [rapportDatumVandaag] = useState(() => formatteerRapportDatum());

  function wisFormulier() {
    setOnderneming("");
    setStraatEnNummer("");
    setPostcode("");
    setPlaats("");
    setKboNummer("");
    setFlowJaar(HUIDIG_JAAR);
    setFlowNummer("");
    setLocatieType("adres");
    setLocatieStraat("");
    setLocatiePostcode("");
    setLocatiePlaats("");
    setAutosnelweg("");
    setAutosnelwegPlaats("");
    setVaststellingsDatum("");
    setTijdstip("");
    setPlaatEerste("");
    setPlaatLetters("");
    setPlaatCijfers("");
    setFout("");
  }

  async function genereerWordRapport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBezig(true);
    setFout("");

    try {
      const antwoord = await fetch(ROKEN_SJABLOON_PAD, {
        cache: "force-cache",
      });

      if (!antwoord.ok) {
        throw new Error("Het Word-sjabloon kon niet worden geladen.");
      }

      const flow = `02/${flowJaar}/${flowNummer}`;
      const rapportDatum = formatteerRapportDatum(new Date());
      const locatie =
        locatieType === "adres"
          ? `${locatieStraat}, ${locatiePostcode} ${locatiePlaats}`.trim()
          : `${autosnelweg.toUpperCase()} ter hoogte van ${autosnelwegPlaats}`.trim();
      const nummerplaat = `${plaatEerste}-${plaatLetters.toUpperCase()}-${plaatCijfers}`;
      const wordBuffer = await maakRokenDocxBuffer(
        await antwoord.arrayBuffer(),
        {
          onderneming: onderneming.trim(),
          straatEnNummer: straatEnNummer.trim(),
          postcode,
          plaats: plaats.trim(),
          kboNummer,
          flow,
          rapportDatum,
          vaststellingsDatum: formatteerInvoerdatum(vaststellingsDatum),
          locatie,
          tijdstip: tijdstip.replace(":", "u"),
          nummerplaat,
        },
      );

      const blob = new Blob([wordBuffer], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const objectUrl = URL.createObjectURL(blob);
      const link = window.document.createElement("a");

      link.href = objectUrl;
      link.download = maakRokenWordBestandsnaam(flow, onderneming);
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (error) {
      console.error(error);
      setFout(
        error instanceof Error
          ? error.message
          : "Het Word-rapport kon niet worden aangemaakt.",
      );
    } finally {
      setBezig(false);
    }
  }

  return (
    <main className="tww-canvas min-h-screen text-slate-900">
      <div className="mx-auto max-w-5xl px-4 pb-10 pt-6 sm:px-6">
        <AppBalk />

        <section className="mt-5 overflow-hidden rounded-2xl border border-white bg-white/95 shadow-[0_14px_45px_rgba(15,23,42,0.07)]">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-8">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                Schriftelijke waarschuwing
              </p>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
                105 - roken
              </h1>
              <p className="mt-2 max-w-2xl text-slate-600">
                Vul de vaststellingsgegevens in en maak onmiddellijk het bestaande Word-sjabloon aan.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-emerald-500" />
              Geen gegevensopslag
            </div>
          </div>

          <form
            autoComplete="off"
            onSubmit={genereerWordRapport}
            className="space-y-8 p-5 sm:p-8"
          >
            <fieldset>
              <legend className="text-lg font-extrabold text-slate-950">
                Onderneming
              </legend>
              <p className="mt-1 text-sm text-slate-500">
                Deze gegevens komen in het adres- en kenmerkblok van de brief.
              </p>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">
                  Onderneming
                  <input
                    type="text"
                    required
                    maxLength={60}
                    value={onderneming}
                    onChange={(event) => setOnderneming(event.target.value)}
                    className={INVOERKLASSE}
                  />
                </label>

                <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">
                  Straat en nummer
                  <input
                    type="text"
                    required
                    maxLength={70}
                    value={straatEnNummer}
                    onChange={(event) => setStraatEnNummer(event.target.value)}
                    className={INVOERKLASSE}
                  />
                </label>

                <label className="block text-sm font-semibold text-slate-700">
                  Postcode
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    pattern="[0-9]{4}"
                    title="Geef een Belgische postcode van vier cijfers in."
                    value={postcode}
                    onChange={(event) => setPostcode(alleenCijfers(event.target.value, 4))}
                    className={INVOERKLASSE}
                  />
                </label>

                <label className="block text-sm font-semibold text-slate-700">
                  Plaats
                  <input
                    type="text"
                    required
                    maxLength={40}
                    value={plaats}
                    onChange={(event) => setPlaats(event.target.value)}
                    className={INVOERKLASSE}
                  />
                </label>

                <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">
                  KBO-nummer onderneming · uw kenmerk
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="0123.456.789"
                    pattern="[0-9]{4}\.[0-9]{3}\.[0-9]{3}"
                    title="Geef het KBO-nummer in met tien cijfers."
                    value={kboNummer}
                    onChange={(event) => setKboNummer(formatteerKboInvoer(event.target.value))}
                    className={INVOERKLASSE}
                  />
                </label>
              </div>
            </fieldset>

            <div className="h-px bg-slate-200" />

            <fieldset>
              <legend className="text-lg font-extrabold text-slate-950">
                Kenmerk en rapportdatum
              </legend>

              <div className="mt-5 grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
                <label className="block text-sm font-semibold text-slate-700">
                  Ons kenmerk · flow
                  <span className="mt-2 grid grid-cols-[3.25rem_auto_5rem_auto_minmax(0,1fr)] items-center gap-1.5 sm:gap-2">
                    <span className="flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-slate-100 px-2 py-3 font-bold text-slate-700">
                      02
                    </span>
                    <span className="text-slate-400">/</span>
                    <input
                      aria-label="Jaar van het flownummer"
                      type="text"
                      inputMode="numeric"
                      required
                      pattern="[0-9]{4}"
                      value={flowJaar}
                      onChange={(event) => setFlowJaar(alleenCijfers(event.target.value, 4))}
                      className="min-h-12 w-full rounded-xl border border-slate-300 px-2 py-3 text-center font-semibold outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                    />
                    <span className="text-slate-400">/</span>
                    <input
                      aria-label="Volgnummer van het flownummer"
                      type="text"
                      inputMode="numeric"
                      required
                      pattern="[0-9]+"
                      placeholder="123"
                      value={flowNummer}
                      onChange={(event) => setFlowNummer(alleenCijfers(event.target.value))}
                      className="min-h-12 min-w-0 w-full rounded-xl border border-slate-300 px-3 py-3 font-semibold outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                    />
                  </span>
                </label>

                <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                    Rapportdatum
                  </p>
                  <p className="mt-1 font-bold text-slate-900">{rapportDatumVandaag}</p>
                  <p className="mt-1 text-xs text-slate-500">Automatisch bij genereren</p>
                </div>
              </div>
            </fieldset>

            <div className="h-px bg-slate-200" />

            <fieldset>
              <legend className="text-lg font-extrabold text-slate-950">
                Vaststelling
              </legend>

              <label className="mt-5 block max-w-sm text-sm font-semibold text-slate-700">
                Datum vaststelling
                <input
                  type="date"
                  required
                  value={vaststellingsDatum}
                  onChange={(event) => setVaststellingsDatum(event.target.value)}
                  className={INVOERKLASSE}
                />
              </label>

              <div className="mt-5">
                <span className="block text-sm font-semibold text-slate-700">
                  Locatie
                </span>
                <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1.5">
                  {(
                    [
                      ["adres", "Specifiek adres"],
                      ["autosnelweg", "Autosnelweg"],
                    ] as const
                  ).map(([waarde, label]) => (
                    <label
                      key={waarde}
                      className={`flex min-h-11 cursor-pointer items-center justify-center rounded-lg px-3 py-2 text-center text-sm font-bold transition ${
                        locatieType === waarde
                          ? "bg-white text-blue-800 shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <input
                        type="radio"
                        name="locatieType"
                        value={waarde}
                        checked={locatieType === waarde}
                        onChange={() => setLocatieType(waarde)}
                        className="sr-only"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              {locatieType === "adres" ? (
                <div className="mt-5 grid gap-5 sm:grid-cols-[1fr_8rem_1fr]">
                  <label className="block text-sm font-semibold text-slate-700 sm:col-span-3">
                    Straat en nummer van de vaststelling
                    <input
                      type="text"
                      required
                      maxLength={70}
                      value={locatieStraat}
                      onChange={(event) => setLocatieStraat(event.target.value)}
                      className={INVOERKLASSE}
                    />
                  </label>
                  <label className="block text-sm font-semibold text-slate-700">
                    Postcode
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      pattern="[0-9]{4}"
                      value={locatiePostcode}
                      onChange={(event) => setLocatiePostcode(alleenCijfers(event.target.value, 4))}
                      className={INVOERKLASSE}
                    />
                  </label>
                  <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">
                    Plaats
                    <input
                      type="text"
                      required
                      maxLength={40}
                      value={locatiePlaats}
                      onChange={(event) => setLocatiePlaats(event.target.value)}
                      className={INVOERKLASSE}
                    />
                  </label>
                </div>
              ) : (
                <div className="mt-5 grid gap-5 sm:grid-cols-[12rem_1fr]">
                  <label className="block text-sm font-semibold text-slate-700">
                    ID autosnelweg
                    <input
                      type="text"
                      required
                      maxLength={8}
                      placeholder="E40"
                      value={autosnelweg}
                      onChange={(event) =>
                        setAutosnelweg(
                          event.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase(),
                        )
                      }
                      className={INVOERKLASSE}
                    />
                  </label>
                  <label className="block text-sm font-semibold text-slate-700">
                    Plaats
                    <input
                      type="text"
                      required
                      maxLength={40}
                      value={autosnelwegPlaats}
                      onChange={(event) => setAutosnelwegPlaats(event.target.value)}
                      className={INVOERKLASSE}
                    />
                  </label>
                </div>
              )}

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Tijdstip vaststelling
                  <input
                    type="time"
                    required
                    value={tijdstip}
                    onChange={(event) => setTijdstip(event.target.value)}
                    className={INVOERKLASSE}
                  />
                </label>

                <div>
                  <span className="block text-sm font-semibold text-slate-700">
                    Nummerplaat
                  </span>
                  <div className="mt-2 flex min-h-12 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-100">
                    <input
                      aria-label="Eerste cijfer van de nummerplaat"
                      type="text"
                      inputMode="numeric"
                      required
                      pattern="[0-9]"
                      maxLength={1}
                      value={plaatEerste}
                      onChange={(event) => setPlaatEerste(alleenCijfers(event.target.value, 1))}
                      className="min-h-8 w-10 rounded-lg bg-slate-100 px-2 text-center font-bold uppercase outline-none"
                    />
                    <span aria-hidden="true" className="font-bold text-slate-400">-</span>
                    <input
                      aria-label="Drie letters van de nummerplaat"
                      type="text"
                      required
                      pattern="[A-Za-z]{3}"
                      maxLength={3}
                      value={plaatLetters}
                      onChange={(event) =>
                        setPlaatLetters(
                          event.target.value.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase(),
                        )
                      }
                      className="min-h-8 w-20 rounded-lg bg-slate-100 px-2 text-center font-bold uppercase tracking-wider outline-none"
                    />
                    <span aria-hidden="true" className="font-bold text-slate-400">-</span>
                    <input
                      aria-label="Drie laatste cijfers van de nummerplaat"
                      type="text"
                      inputMode="numeric"
                      required
                      pattern="[0-9]{3}"
                      maxLength={3}
                      value={plaatCijfers}
                      onChange={(event) => setPlaatCijfers(alleenCijfers(event.target.value, 3))}
                      className="min-h-8 w-20 rounded-lg bg-slate-100 px-2 text-center font-bold tracking-wider outline-none"
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Vorm: 1-ABC-123</p>
                </div>
              </div>
            </fieldset>

            {fout && (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                {fout}
              </p>
            )}

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={wisFormulier}
                className="min-h-12 rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Formulier wissen
              </button>

              <button
                type="submit"
                disabled={bezig}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-blue-800 px-6 py-3 font-bold text-white shadow-[0_10px_25px_rgba(29,78,216,0.18)] transition hover:-translate-y-0.5 disabled:cursor-wait disabled:translate-y-0 disabled:opacity-60"
              >
                <DownloadIcoon />
                {bezig ? "Word-rapport wordt gemaakt..." : "Word-rapport maken"}
              </button>
            </div>

            <p className="text-center text-xs leading-relaxed text-slate-500">
              De invoer wordt uitsluitend in uw browser gebruikt om het Word-document te maken en wordt niet naar Supabase of een andere databank verzonden.
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
