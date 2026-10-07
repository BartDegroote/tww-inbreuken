"use client";

import { FormEvent, useMemo, useRef, useState } from "react";

import AppBalk from "@/app/componenten/AppBalk";
import {
  BELGISCHE_GEMEENTEPOSTCODES,
  BELGISCHE_POSTPLAATSEN,
  type BelgischePostplaats,
} from "@/lib/belgische-postplaatsen";
import {
  MAX_FLOW_VOLGNUMMER_TEKENS,
  MAX_PDF_LOCATIE_BREEDTESCORE,
  ROKEN_PDF_SJABLOON_PAD,
  controleerRokenPdfSjabloonIntegriteit,
  formatteerRapportDatum,
  maakRokenPdfBestandsnaam,
  maakRokenPdfBuffer,
  vervlakRokenPdfAlsAfdruk,
} from "@/lib/roken-pdf-export";

type LocatieType = "adres" | "autosnelweg";
type VoertuigType = "bestelwagen" | "dienstwagen" | "vrachtwagen";

const WERKRUIMTE_PER_VOERTUIG: Record<VoertuigType, string> = {
  bestelwagen: "Cabine van een bestelwagen (gesloten ruimte buiten onderneming)",
  dienstwagen: "Cabine van een dienstwagen",
  vrachtwagen: "Cabine van een vrachtwagen",
};

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

function berekenWordBreedtescore(waarde: string): number {
  return Array.from(waarde).reduce((score, teken) => {
    if (/[MW@%&]/.test(teken)) return score + 1.7;
    if (/[ilI1.,'` :;|!]/.test(teken)) return score + 0.5;
    if (/[A-Z]/.test(teken)) return score + 1.15;
    if (/[0-9]/.test(teken)) return score + 0.95;
    return score + 1;
  }, 0);
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

function KlembordIcoon({ metVinkje = false }: { metVinkje?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5h6m-7 2H6.75A1.75 1.75 0 0 0 5 8.75v10.5C5 20.22 5.78 21 6.75 21h10.5c.97 0 1.75-.78 1.75-1.75V8.75C19 7.78 18.22 7 17.25 7H16" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75C9 3.34 9.34 3 9.75 3h4.5c.41 0 .75.34.75.75v2.5c0 .41-.34.75-.75.75h-4.5A.75.75 0 0 1 9 6.25v-2.5Z" />
      {metVinkje ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="m8.5 14 2.1 2.1 4.9-5" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M9 16h4" />
      )}
    </svg>
  );
}

function normaliseerZoektekst(waarde: string): string {
  return waarde
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("nl-BE")
    .trim();
}

function PostplaatsZoeker({
  id,
  waarde,
  postcode,
  opties = BELGISCHE_POSTPLAATSEN,
  placeholder = "Typ een plaats of postcode",
  verplicht = true,
  onWijzig,
  onKies,
}: {
  id: string;
  waarde: string;
  postcode: string;
  opties?: BelgischePostplaats[];
  placeholder?: string;
  verplicht?: boolean;
  onWijzig: (waarde: string) => void;
  onKies: (postplaats: BelgischePostplaats) => void;
}) {
  const [geopend, setGeopend] = useState(false);
  const zoektekst = normaliseerZoektekst(waarde);
  const suggesties = useMemo(() => {
    if (zoektekst.length < 2) return [];

    return opties.filter(
      (postplaats) =>
        normaliseerZoektekst(postplaats.plaats).includes(zoektekst) ||
        postplaats.postcode.startsWith(zoektekst),
    )
      .sort((eerste, tweede) => {
        const eersteBegint =
          normaliseerZoektekst(eerste.plaats).startsWith(zoektekst) ||
          eerste.postcode.startsWith(zoektekst);
        const tweedeBegint =
          normaliseerZoektekst(tweede.plaats).startsWith(zoektekst) ||
          tweede.postcode.startsWith(zoektekst);
        if (eersteBegint !== tweedeBegint) return eersteBegint ? -1 : 1;
        return eerste.plaats.localeCompare(tweede.plaats, "nl-BE");
      })
      .slice(0, 10);
  }, [opties, zoektekst]);

  function kiesExacteUniekePostplaats() {
    const exacteMatches = opties.filter(
      (postplaats) => normaliseerZoektekst(postplaats.plaats) === zoektekst,
    );

    if (exacteMatches.length === 1) onKies(exacteMatches[0]);
  }

  return (
    <div className="relative mt-2">
      <input
        id={id}
        type="text"
        required={verplicht}
        maxLength={40}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={geopend && suggesties.length > 0}
        aria-controls={`${id}-suggesties`}
        value={waarde}
        onFocus={() => setGeopend(true)}
        onChange={(event) => {
          onWijzig(event.target.value);
          setGeopend(true);
        }}
        onBlur={() => {
          kiesExacteUniekePostplaats();
          window.setTimeout(() => setGeopend(false), 120);
        }}
        placeholder={placeholder}
        className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-24 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
      />
      {postcode && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-blue-50 px-2 py-1 font-mono text-xs font-bold text-blue-700">
          {postcode}
        </span>
      )}
      {geopend && suggesties.length > 0 && (
        <ul
          id={`${id}-suggesties`}
          role="listbox"
          className="absolute z-30 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_18px_45px_rgba(15,23,42,0.18)]"
        >
          {suggesties.map((postplaats) => (
            <li key={`${postplaats.postcode}-${postplaats.plaats}`} role="option" aria-selected={postcode === postplaats.postcode && waarde === postplaats.plaats}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onKies(postplaats);
                  setGeopend(false);
                }}
                className="flex min-h-11 w-full items-center justify-between gap-4 rounded-lg px-3 py-2 text-left transition hover:bg-blue-50 focus-visible:bg-blue-50 focus-visible:outline-none"
              >
                <span className="font-semibold text-slate-800">{postplaats.plaats}</span>
                <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs font-bold text-slate-600">
                  {postplaats.postcode}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StapKop({ nummer, titel, uitleg }: { nummer: string; titel: string; uitleg: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-700 font-mono text-xs font-black text-white shadow-sm">
        {nummer}
      </span>
      <span>
        <span className="block text-lg font-extrabold text-slate-950">{titel}</span>
        <span className="mt-0.5 block text-sm font-normal text-slate-500">{uitleg}</span>
      </span>
    </div>
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
  const [locatieType, setLocatieType] = useState<LocatieType>("autosnelweg");
  const [locatieStraat, setLocatieStraat] = useState("");
  const [locatiePostcode, setLocatiePostcode] = useState("");
  const [locatiePlaats, setLocatiePlaats] = useState("");
  const [autosnelweg, setAutosnelweg] = useState("");
  const [autosnelwegPlaats, setAutosnelwegPlaats] = useState("");
  const [autosnelwegPostcode, setAutosnelwegPostcode] = useState("");
  const [vaststellingsDatum, setVaststellingsDatum] = useState("");
  const [voertuigType, setVoertuigType] = useState<VoertuigType>("bestelwagen");
  const [tijdstip, setTijdstip] = useState("");
  const [plaatEerste, setPlaatEerste] = useState("");
  const [plaatLetters, setPlaatLetters] = useState("");
  const [plaatCijfers, setPlaatCijfers] = useState("");
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState("");
  const [wisBevestiging, setWisBevestiging] = useState(false);
  const [toonQActiviteit, setToonQActiviteit] = useState(false);
  const [gekopieerdeQVelden, setGekopieerdeQVelden] = useState<Set<string>>(new Set());
  const [kopieerFout, setKopieerFout] = useState("");
  const plaatEersteRef = useRef<HTMLInputElement>(null);
  const plaatLettersRef = useRef<HTMLInputElement>(null);
  const plaatCijfersRef = useRef<HTMLInputElement>(null);

  const flow = `02/${flowJaar}/${flowNummer}`;
  const locatie =
    locatieType === "adres"
      ? [
          locatieStraat.trim(),
          [locatiePostcode, locatiePlaats.trim()].filter(Boolean).join(" "),
        ]
          .filter(Boolean)
          .join(", ")
      : autosnelweg || autosnelwegPlaats
        ? `${autosnelweg.toUpperCase()}${autosnelwegPlaats ? ` ter hoogte van ${autosnelwegPlaats.trim()}` : ""}`
        : "";
  const nummerplaat = `${plaatEerste}-${plaatLetters.toUpperCase()}-${plaatCijfers}`;
  const qStraatEnNummer =
    locatieType === "adres" ? locatieStraat.trim() : autosnelweg.trim().toUpperCase();
  const qPostcode = locatieType === "adres" ? locatiePostcode : autosnelwegPostcode;
  const qGemeente =
    locatieType === "adres" ? locatiePlaats.trim() : autosnelwegPlaats.trim();
  const qRegels = [
    {
      id: "datum",
      label: "Datum vaststelling",
      waarde: vaststellingsDatum ? formatteerInvoerdatum(vaststellingsDatum) : "",
    },
    { id: "duur", label: "Duur vaststelling", waarde: "00:15" },
    {
      id: "plaatsnaam",
      label: "Inspectiebezoek plaatsnaam",
      waarde: "Openbare weg",
    },
    { id: "straat", label: "Straat / nr.", waarde: qStraatEnNummer },
    { id: "postcode", label: "Postcode", waarde: qPostcode },
    { id: "gemeente", label: "Gemeente", waarde: qGemeente },
  ];
  const locatieBreedtescore = berekenWordBreedtescore(locatie);
  const locatieTeLang = locatieBreedtescore > MAX_PDF_LOCATIE_BREEDTESCORE;
  const locatieVulling = Math.min(
    100,
    Math.round((locatieBreedtescore / MAX_PDF_LOCATIE_BREEDTESCORE) * 100),
  );
  const heeftInvoer = Boolean(
    onderneming ||
      straatEnNummer ||
      postcode ||
      plaats ||
      kboNummer ||
      flowNummer ||
      locatieStraat ||
      locatiePostcode ||
      locatiePlaats ||
      autosnelweg ||
      autosnelwegPlaats ||
      vaststellingsDatum ||
      tijdstip ||
      plaatEerste ||
      plaatLetters ||
      plaatCijfers,
  );

  function verwerkNummerplaatPlakken(waarde: string): boolean {
    const match = waarde.trim().toUpperCase().match(/^(\d)[\s-]*([A-Z]{3})[\s-]*(\d{3})$/);

    if (!match) return false;

    setPlaatEerste(match[1]);
    setPlaatLetters(match[2]);
    setPlaatCijfers(match[3]);
    plaatCijfersRef.current?.focus();
    return true;
  }

  function wisFormulier() {
    if (!heeftInvoer) return;

    if (!wisBevestiging) {
      setWisBevestiging(true);
      return;
    }

    setOnderneming("");
    setStraatEnNummer("");
    setPostcode("");
    setPlaats("");
    setKboNummer("");
    setFlowJaar(HUIDIG_JAAR);
    setFlowNummer("");
    setLocatieType("autosnelweg");
    setLocatieStraat("");
    setLocatiePostcode("");
    setLocatiePlaats("");
    setAutosnelweg("");
    setAutosnelwegPlaats("");
    setAutosnelwegPostcode("");
    setVaststellingsDatum("");
    setVoertuigType("bestelwagen");
    setTijdstip("");
    setPlaatEerste("");
    setPlaatLetters("");
    setPlaatCijfers("");
    setFout("");
    setToonQActiviteit(false);
    setGekopieerdeQVelden(new Set());
    setKopieerFout("");
    setWisBevestiging(false);
  }

  async function kopieerQWaarde(id: string, waarde: string) {
    if (!waarde) return;

    setKopieerFout("");

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(waarde);
      } else {
        const tekstvak = window.document.createElement("textarea");
        tekstvak.value = waarde;
        tekstvak.setAttribute("readonly", "");
        tekstvak.style.position = "fixed";
        tekstvak.style.opacity = "0";
        window.document.body.appendChild(tekstvak);
        tekstvak.select();
        const gelukt = window.document.execCommand("copy");
        tekstvak.remove();
        if (!gelukt) throw new Error("Kopiëren is niet gelukt.");
      }

      setGekopieerdeQVelden((huidigeVelden) => {
        const volgendeVelden = new Set(huidigeVelden);
        volgendeVelden.add(id);
        return volgendeVelden;
      });
    } catch {
      setKopieerFout("Kopiëren is niet gelukt. Selecteer de waarde en kopieer ze handmatig.");
    }
  }

  async function genereerPdfRapport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBezig(true);
    setFout("");

    try {
      if (locatieTeLang) {
        throw new Error(
          "Verkort de locatie. De huidige tekst is te lang om netjes op één regel in de PDF-brief te plaatsen.",
        );
      }

      const antwoord = await fetch(ROKEN_PDF_SJABLOON_PAD, {
        cache: "no-store",
      });

      if (!antwoord.ok) {
        throw new Error("Het PDF-sjabloon kon niet worden geladen.");
      }

      const sjabloon = await antwoord.arrayBuffer();
      await controleerRokenPdfSjabloonIntegriteit(sjabloon);
      const rapportDatum = formatteerRapportDatum(new Date());
      const ingevuldePdfBuffer = await maakRokenPdfBuffer(
        sjabloon,
        {
          onderneming: onderneming.trim(),
          straatEnNummer: straatEnNummer.trim(),
          postcode,
          plaats: plaats.trim(),
          kboNummer,
          flow,
          rapportDatum,
          vaststellingsDatum: formatteerInvoerdatum(vaststellingsDatum),
          werkruimte: WERKRUIMTE_PER_VOERTUIG[voertuigType],
          locatie,
          tijdstip: tijdstip.replace(":", "u"),
          nummerplaat,
        },
      );
      const pdfBuffer = await vervlakRokenPdfAlsAfdruk(ingevuldePdfBuffer);

      const blob = new Blob([Uint8Array.from(pdfBuffer).buffer], {
        type: "application/pdf",
      });
      const objectUrl = URL.createObjectURL(blob);
      const link = window.document.createElement("a");

      link.href = objectUrl;
      link.download = maakRokenPdfBestandsnaam(flow, onderneming);
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (error) {
      console.error(error);
      setFout(
        error instanceof Error
          ? error.message
          : "De PDF-brief kon niet worden aangemaakt.",
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
          <div className="border-b border-slate-200 px-5 py-6 sm:px-8">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                Schriftelijke waarschuwing
              </p>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
                105 - roken
              </h1>
              <p className="mt-2 max-w-2xl text-slate-600">
                Vul de gegevens in en maak meteen de PDF-brief.
              </p>
            </div>
          </div>

          <form
            autoComplete="off"
            onSubmit={genereerPdfRapport}
            onChangeCapture={() => {
              if (wisBevestiging) setWisBevestiging(false);
            }}
            className="space-y-8 p-5 sm:p-8"
          >
            <fieldset>
              <legend>
                <StapKop
                  nummer="01"
                  titel="Onderneming en kenmerk"
                  uitleg="Gegevens voor het adres- en kenmerkblok van de brief."
                />
              </legend>

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

                <label className="block text-sm font-semibold text-slate-700 sm:col-span-2 sm:max-w-xl">
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
                      maxLength={MAX_FLOW_VOLGNUMMER_TEKENS}
                      placeholder="123"
                      value={flowNummer}
                      onChange={(event) =>
                        setFlowNummer(
                          alleenCijfers(event.target.value, MAX_FLOW_VOLGNUMMER_TEKENS),
                        )
                      }
                      className="min-h-12 min-w-0 w-full rounded-xl border border-slate-300 px-3 py-3 font-semibold outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                    />
                  </span>
                </label>
              </div>
            </fieldset>

            <div className="h-px bg-slate-200" />

            <fieldset>
              <legend>
                <StapKop
                  nummer="02"
                  titel="Vaststelling"
                  uitleg="Kies het voertuig en noteer waar en wanneer de vaststelling gebeurde."
                />
              </legend>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Datum vaststelling
                  <input
                    type="date"
                    required
                    value={vaststellingsDatum}
                    onChange={(event) => setVaststellingsDatum(event.target.value)}
                    className={INVOERKLASSE}
                  />
                </label>

                <label className="block text-sm font-semibold text-slate-700">
                  Voertuig
                  <select
                    value={voertuigType}
                    onChange={(event) => setVoertuigType(event.target.value as VoertuigType)}
                    className={INVOERKLASSE}
                  >
                    <option value="bestelwagen">Bestelwagen</option>
                    <option value="dienstwagen">Dienstwagen</option>
                    <option value="vrachtwagen">Vrachtwagen</option>
                  </select>
                </label>
              </div>

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
                    <PostplaatsZoeker
                      id="locatie-plaats"
                      waarde={locatiePlaats}
                      postcode={locatiePostcode}
                      onWijzig={(waarde) => {
                        setLocatiePlaats(waarde);
                        setLocatiePostcode("");
                      }}
                      onKies={(postplaats) => {
                        setLocatiePlaats(postplaats.plaats);
                        setLocatiePostcode(postplaats.postcode);
                      }}
                    />
                    <span className="mt-2 block text-xs font-normal text-slate-500">
                      Kies een suggestie om plaats en postcode samen in te vullen.
                    </span>
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
                    Gemeente
                    <PostplaatsZoeker
                      id="autosnelweg-plaats"
                      waarde={autosnelwegPlaats}
                      postcode={autosnelwegPostcode}
                      opties={BELGISCHE_GEMEENTEPOSTCODES}
                      placeholder="Typ een gemeente of postcode"
                      onWijzig={(waarde) => {
                        setAutosnelwegPlaats(waarde);
                        setAutosnelwegPostcode("");
                      }}
                      onKies={(postplaats) => {
                        setAutosnelwegPlaats(postplaats.plaats);
                        setAutosnelwegPostcode(postplaats.postcode);
                      }}
                    />
                    <span className="mt-2 block text-xs font-normal text-slate-500">
                      De gekozen postcode wordt gebruikt voor de activiteit in Q.
                    </span>
                  </label>
                </div>
              )}

              <div
                className={`mt-3 flex items-start justify-between gap-4 rounded-lg px-3 py-2 text-xs ${
                  locatieTeLang
                    ? "bg-red-50 font-semibold text-red-700"
                    : "bg-slate-50 text-slate-500"
                }`}
              >
                <span>
                  {locatieTeLang
                    ? `Verkort de locatie zodat de brief op één pagina blijft.`
                    : "De locatie past op één regel in de PDF-brief."}
                </span>
                <span className="h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-slate-200" aria-hidden="true">
                  <span
                    className={`block h-full rounded-full ${locatieTeLang ? "bg-red-500" : "bg-blue-600"}`}
                    style={{ width: `${locatieVulling}%` }}
                  />
                </span>
              </div>

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
                    <span className="sr-only" id="nummerplaat-hulp">
                      U kunt ook een volledige nummerplaat zoals 1-ABC-123 plakken.
                    </span>
                    <input
                      ref={plaatEersteRef}
                      aria-label="Eerste cijfer van de nummerplaat"
                      type="text"
                      inputMode="numeric"
                      required
                      pattern="[0-9]"
                      maxLength={1}
                      aria-describedby="nummerplaat-hulp"
                      value={plaatEerste}
                      onPaste={(event) => {
                        if (verwerkNummerplaatPlakken(event.clipboardData.getData("text"))) {
                          event.preventDefault();
                        }
                      }}
                      onChange={(event) => {
                        const waarde = alleenCijfers(event.target.value, 1);
                        setPlaatEerste(waarde);
                        if (waarde.length === 1) {
                          plaatLettersRef.current?.focus();
                        }
                      }}
                      className="min-h-8 w-10 rounded-lg bg-slate-100 px-2 text-center font-bold uppercase outline-none"
                    />
                    <span aria-hidden="true" className="font-bold text-slate-400">-</span>
                    <input
                      ref={plaatLettersRef}
                      aria-label="Drie letters van de nummerplaat"
                      type="text"
                      required
                      pattern="[A-Za-z]{3}"
                      maxLength={3}
                      aria-describedby="nummerplaat-hulp"
                      value={plaatLetters}
                      onPaste={(event) => {
                        if (verwerkNummerplaatPlakken(event.clipboardData.getData("text"))) {
                          event.preventDefault();
                        }
                      }}
                      onChange={(event) => {
                        const waarde = event.target.value
                          .replace(/[^a-zA-Z]/g, "")
                          .slice(0, 3)
                          .toUpperCase();
                        setPlaatLetters(waarde);
                        if (waarde.length === 3) {
                          plaatCijfersRef.current?.focus();
                        }
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Backspace" && plaatLetters.length === 0) {
                          plaatEersteRef.current?.focus();
                        }
                      }}
                      className="min-h-8 w-20 rounded-lg bg-slate-100 px-2 text-center font-bold uppercase tracking-wider outline-none"
                    />
                    <span aria-hidden="true" className="font-bold text-slate-400">-</span>
                    <input
                      ref={plaatCijfersRef}
                      aria-label="Drie laatste cijfers van de nummerplaat"
                      type="text"
                      inputMode="numeric"
                      required
                      pattern="[0-9]{3}"
                      maxLength={3}
                      aria-describedby="nummerplaat-hulp"
                      value={plaatCijfers}
                      onPaste={(event) => {
                        if (verwerkNummerplaatPlakken(event.clipboardData.getData("text"))) {
                          event.preventDefault();
                        }
                      }}
                      onChange={(event) => setPlaatCijfers(alleenCijfers(event.target.value, 3))}
                      onKeyDown={(event) => {
                        if (event.key === "Backspace" && plaatCijfers.length === 0) {
                          plaatLettersRef.current?.focus();
                        }
                      }}
                      className="min-h-8 w-20 rounded-lg bg-slate-100 px-2 text-center font-bold tracking-wider outline-none"
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Vorm: 1-ABC-123 · een volledige nummerplaat plakken kan ook.
                  </p>
                </div>
              </div>
            </fieldset>

            {fout && (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                {fout}
              </p>
            )}

            <div className="sticky bottom-3 z-20 flex flex-col-reverse gap-3 rounded-2xl border border-white/80 bg-white/95 p-3 shadow-[0_16px_45px_rgba(15,23,42,0.18)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={wisFormulier}
                className={`min-h-12 rounded-xl border px-5 py-3 font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  wisBevestiging
                    ? "border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {wisBevestiging ? "Nogmaals klikken om te wissen" : "Formulier wissen"}
              </button>

              <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setGekopieerdeQVelden(new Set());
                    setKopieerFout("");
                    setToonQActiviteit(true);
                  }}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 font-bold text-blue-800 transition hover:-translate-y-0.5 hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <KlembordIcoon />
                  Activiteit toevoegen in Q
                </button>

                <button
                  type="submit"
                  disabled={bezig}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-blue-800 px-6 py-3 font-bold text-white shadow-[0_10px_25px_rgba(29,78,216,0.18)] transition hover:-translate-y-0.5 disabled:cursor-wait disabled:translate-y-0 disabled:opacity-60"
                >
                  <DownloadIcoon />
                  {bezig ? "PDF-brief wordt gemaakt..." : "PDF-brief maken"}
                </button>
              </div>
            </div>

            <p className="text-center text-xs leading-relaxed text-slate-500">
              De invoer wordt uitsluitend in uw browser gebruikt om de PDF te maken en wordt niet naar Supabase of een andere databank verzonden.
            </p>
          </form>
        </section>
      </div>

      {toonQActiviteit && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-3 backdrop-blur-sm sm:items-center sm:p-6"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setToonQActiviteit(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="q-activiteit-titel"
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white bg-white shadow-[0_28px_80px_rgba(15,23,42,0.28)]"
          >
            <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white/95 px-5 py-5 backdrop-blur sm:px-6">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-white shadow-sm">
                  <KlembordIcoon />
                </span>
                <div>
                  <h2 id="q-activiteit-titel" className="text-xl font-black text-slate-950">
                    Activiteit toevoegen in Q
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Kopieer elke waarde naar het overeenkomstige veld in uw werkprogramma.
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Venster sluiten"
                onClick={() => setToonQActiviteit(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                ×
              </button>
            </header>

            <div className="space-y-2 p-5 sm:p-6">
              {qRegels.map((regel) => {
                const gekopieerd = gekopieerdeQVelden.has(regel.id);
                const ontbreekt = !regel.waarde;

                return (
                  <div
                    key={regel.id}
                    className={`grid gap-3 rounded-xl border p-3 transition sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center ${
                      gekopieerd
                        ? "border-emerald-300 bg-emerald-50"
                        : ontbreekt
                          ? "border-amber-200 bg-amber-50"
                          : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        {regel.label}
                      </p>
                      <p className={`mt-1 select-text break-words font-semibold ${ontbreekt ? "text-amber-700" : "text-slate-950"}`}>
                        {regel.waarde || "Nog in te vullen"}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={ontbreekt}
                      onClick={() => kopieerQWaarde(regel.id, regel.waarde)}
                      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-45 ${
                        gekopieerd
                          ? "bg-emerald-600 text-white"
                          : "border border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800"
                      }`}
                    >
                      <KlembordIcoon metVinkje={gekopieerd} />
                      {gekopieerd ? "Gekopieerd" : "Kopiëren"}
                    </button>
                  </div>
                );
              })}

              {kopieerFout && (
                <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                  {kopieerFout}
                </p>
              )}

              {gekopieerdeQVelden.size === qRegels.length && (
                <p role="status" className="flex items-center justify-center gap-2 rounded-xl bg-emerald-100 p-3 text-sm font-bold text-emerald-800">
                  <KlembordIcoon metVinkje />
                  Alle waarden zijn gekopieerd.
                </p>
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
