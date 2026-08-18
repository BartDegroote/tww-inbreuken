"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  bewaarOntmoetePersonen,
  bewaarInspectie,
  type Aanspreking,
  type OntmoetePersoonInput,
  type OngevalsgegevensInput,
  type OpgeslagenInbreukInput,
  type VaststellingInput,
} from "@/app/inspecties/actions";
import AppBalk from "@/app/componenten/AppBalk";

import type {
  EaoCodeOptie,
  InbreukType,
  Standaardinbreuk,
  TekstSegment,
} from "@/bibliotheek";
import {
  afwijkendeGebeurtenissen,
  betrokkenVoorwerpen,
  formatteerEaoCode,
  soortenLetsel,
} from "@/bibliotheek";
import {
  isVerborgenAfdeling,
  isWelzijnswet,
} from "@/bibliotheek/welzijnswet";
import { isKbBeveiligingLiften } from "@/bibliotheek/kb-liften";
import TekstMetOpmaak from "@/app/bibliotheek/TekstMetOpmaak";
import {
  downloadWordVerslag,
  type WordFoto,
  type WordInbreuk,
} from "@/lib/word-export";
import { MAX_FOTOS_PER_INBREUK } from "@/lib/inspectie-limieten";
import { sorteerInbreukenJuridisch } from "@/lib/juridische-sortering";

type WetgevingOptie = {
  id: string;
  naam: string;
};

type BoekOptie = {
  id: string;
  naam: string;
  wetgevingId: string;
};

type TitelOptie = {
  id: string;
  naam: string;
  boekId: string;
};

type SpecifiekElementKeuze = {
  id: string;
  tekst: string;
};

type OntmoetePersoonRij =
  OntmoetePersoonInput & {
    id: string;
  };

export type InspectieFoto = {
  id: string;
  naam: string;
  url?: string;
  bestand?: File;
};

export type Inbreuk = {
  id: string;
  standaardinbreukId: string;
  inbreukType: InbreukType;
  beschrijving: string;
  beschrijvingOpmaak: TekstSegment[];
  inCasu: string;
  toelichting: string;
  aanvulling: string;
  aanvullingOpmaak: TekstSegment[];
  wettelijkeVerwijzing: string;
  specifiekeElementen: SpecifiekElementKeuze[];
  geselecteerdeSpecifiekeElementIds: string[];
  specifiekeElementenAlsSituering: boolean;
  eigenElementenToegestaan: boolean;
  vaststellingen: VaststellingInput[];
  afwijkendeGebeurtenisCode: string;
  betrokkenVoorwerpCode: string;
  soortLetselCode: string;
  fotos: InspectieFoto[];
};

type InspectieUitvoerenClientProps = {
  inspectieId: string;
  onderneming: string;
  adres: string;
  inspectiedatum: string;
  inspecteur: string;
  flow: string;
  initialOntmoetePersonen: OntmoetePersoonInput[];
  initialOngevalsgegevens: OngevalsgegevensInput;
  wetgevingen: WetgevingOptie[];
  boeken: BoekOptie[];
  titels: TitelOptie[];
  standaardinbreuken: Standaardinbreuk[];
  initialInbreuken: Inbreuk[];
};

type EaoCodeVeldProps = {
  id: string;
  label: string;
  waarde: string;
  opties: readonly EaoCodeOptie[];
  onChange: (code: string) => void;
};

const aangepasteZoekgroepTitels =
  new Map<string, string>([
    [
      "boek-i-titel-2",
      "Codex I-2. Welzijnsbeleid",
    ],
    [
      "boek-i-titel-4",
      "Codex I-4. Gezondheidstoezicht",
    ],
    [
      "boek-i-titel-6",
      "Codex I-6. Maatregelen AO",
    ],
    [
      "boek-iii-titel-1",
      "Codex III-1. Basiseisen arbeidsplaatsen",
    ],
    [
      "boek-iii-titel-2",
      "Codex III-2. Elektrische installaties",
    ],
    [
      "boek-iii-titel-3",
      "Codex III-3. Brandpreventie arbeidsplaatsen",
    ],
  ]);

function maakZoekgroepTitel(
  boekNaam: string,
  titelId: string,
  titelNaam: string,
): string {
  const aangepasteTitel =
    aangepasteZoekgroepTitels.get(titelId);

  if (aangepasteTitel) {
    return aangepasteTitel;
  }

  const boekNummer =
    boekNaam.split(" - ")[0]?.trim() ||
    boekNaam;
  const compacteTitel = titelNaam.replace(
    /^(\d+)\s*-\s*/,
    "$1. ",
  );

  return `Codex ${boekNummer}-${compacteTitel}`;
}

function UitklapbareGroep({
  standaardOpen = false,
  className,
  children,
}: {
  standaardOpen?: boolean;
  className: string;
  children: ReactNode;
}) {
  const [open, setOpen] =
    useState(standaardOpen);

  return (
    <details
      open={open}
      onToggle={(event) =>
        setOpen(event.currentTarget.open)
      }
      className={className}
    >
      {children}
    </details>
  );
}

function EaoCodeVeld({
  id,
  label,
  waarde,
  opties,
  onChange,
}: EaoCodeVeldProps) {
  const geselecteerd = opties.find(
    (optie) => optie.code === waarde,
  );
  const weergave = geselecteerd
    ? formatteerEaoCode(geselecteerd)
    : "";
  const [invoer, setInvoer] =
    useState(weergave);

  function wijzigInvoer(
    nieuweWaarde: string,
  ): void {
    setInvoer(nieuweWaarde);

    const genormaliseerd =
      nieuweWaarde.trim().toLocaleLowerCase(
        "nl-BE",
      );
    const keuze = opties.find(
      (optie) =>
        optie.code.toLocaleLowerCase(
          "nl-BE",
        ) === genormaliseerd ||
        formatteerEaoCode(optie)
          .toLocaleLowerCase("nl-BE") ===
          genormaliseerd,
    );

    if (keuze) {
      setInvoer(formatteerEaoCode(keuze));
    }

    onChange(keuze?.code ?? "");
  }

  return (
    <label className="block min-w-0">
      <span className="text-sm font-semibold text-slate-800">
        {label}
      </span>

      <input
        id={id}
        type="text"
        list={`${id}-opties`}
        value={invoer}
        onChange={(event) =>
          wijzigInvoer(event.target.value)
        }
        onBlur={() => {
          if (!waarde) {
            setInvoer("");
          }
        }}
        placeholder="Typ een code of zoekterm…"
        autoComplete="off"
        className="mt-2 min-h-11 w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-base text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-amber-600 focus:ring-4 focus:ring-amber-100"
        required
      />

      <datalist id={`${id}-opties`}>
        {opties.map((optie) => (
          <option
            key={optie.code}
            value={formatteerEaoCode(optie)}
          >
            {optie.eaoRelevant
              ? "EAO-relevant"
              : "Andere code"}
          </option>
        ))}
      </datalist>

      {geselecteerd && (
        <span className="mt-2 flex flex-wrap items-center gap-2 text-xs leading-5 text-slate-600">
          {geselecteerd.eaoRelevant && (
            <span className="inline-flex rounded-full border border-amber-400 bg-amber-100 px-2 py-0.5 font-bold text-amber-900">
              EAO-relevant
            </span>
          )}
          <span>
            {geselecteerd.eaoRelevant
              ? "Deze code komt voor in een relevante Codex-bijlage."
              : "Deze code is niet afzonderlijk aangeduid in de EAO-bijlagen."}
          </span>
        </span>
      )}
    </label>
  );
}

function kopieerSegmenten(
  segmenten?: TekstSegment[],
): TekstSegment[] {
  return (segmenten ?? []).map((segment) => ({
    tekst: segment.tekst,
    ...(segment.vet ? { vet: true } : {}),
    ...(segment.donkergrijs
      ? { donkergrijs: true }
      : {}),
    ...(segment.lijstaccent
      ? { lijstaccent: true }
      : {}),
  }));
}

function platteSegmenten(
  tekst: string,
): TekstSegment[] {
  return tekst
    ? [
        {
          tekst,
        },
      ]
    : [];
}

async function bestandNaarPngFoto(
  foto: InspectieFoto,
): Promise<WordFoto> {
  let bestand = foto.bestand;

  if (!bestand && foto.url) {
    const response = await fetch(foto.url);
    if (!response.ok) {
      throw new Error(`De foto "${foto.naam}" kon niet worden geladen.`);
    }
    bestand = new File([await response.blob()], foto.naam);
  }

  if (!bestand) {
    throw new Error(`De foto "${foto.naam}" kon niet worden geladen.`);
  }

  let bitmap: ImageBitmap;

  try {
    bitmap = await createImageBitmap(bestand);
  } catch {
    throw new Error(
      `De foto "${bestand.name}" kon niet worden gelezen. Gebruik een gangbaar beeldformaat zoals JPG of PNG.`,
    );
  }

  try {
    const canvas = window.document.createElement(
      "canvas",
    );

    canvas.width = bitmap.width;
    canvas.height = bitmap.height;

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error(
        `De foto "${bestand.name}" kon niet worden verwerkt.`,
      );
    }

    context.drawImage(bitmap, 0, 0);

    const pngBlob = await new Promise<Blob>(
      (resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
            return;
          }

          reject(
            new Error(
              `De foto "${bestand.name}" kon niet naar PNG worden omgezet.`,
            ),
          );
        }, "image/png");
      },
    );

    return {
      naam: bestand.name,
      data: new Uint8Array(
        await pngBlob.arrayBuffer(),
      ),
      breedte: bitmap.width,
      hoogte: bitmap.height,
    };
  } finally {
    bitmap.close();
  }
}

async function maakWordFotos(
  bestanden: InspectieFoto[],
): Promise<WordFoto[]> {
  return Promise.all(
    bestanden.map(bestandNaarPngFoto),
  );
}

async function maakCompacteUpload(bestand: File): Promise<File> {
  const bitmap = await createImageBitmap(bestand);

  try {
    const maximum = 1600;
    const schaal = Math.min(1, maximum / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * schaal));
    canvas.height = Math.max(1, Math.round(bitmap.height * schaal));
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("De foto kon niet worden verwerkt.");
    }

    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (resultaat) =>
          resultaat ? resolve(resultaat) : reject(new Error("Fotoverwerking mislukt.")),
        "image/jpeg",
        0.82,
      );
    });

    return new File([blob], bestand.name.replace(/\.[^.]+$/, ".jpg"), {
      type: "image/jpeg",
    });
  } finally {
    bitmap.close();
  }
}

function maakTijdelijkId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function maakVaststelling(
  tekst = "",
): VaststellingInput {
  return {
    id: maakTijdelijkId(),
    tekst,
    geselecteerdeSpecifiekeElementIds: [],
    eigenElementen: [],
  };
}

function maakCompacteWettelijkeVerwijzing(
  wetgevingNaam: string,
  wettelijkeVerwijzing: string,
): string {
  const korteWetgevingNaam =
    wetgevingNaam
      .trim()
      .toLocaleLowerCase("nl-BE")
      .startsWith("codex")
      ? "Codex"
      : wetgevingNaam.trim();

  const artikel =
    wettelijkeVerwijzing.match(
      /\bart(?:ikel)?\.?\s*((?:[IVXLCDM]+|\d+)(?:\.\d+)+(?:-\d+(?:\.\d+)*)?)/i,
    )?.[1];

  return artikel
    ? `${korteWetgevingNaam} art. ${artikel}`
    : korteWetgevingNaam;
}

export default function InspectieUitvoerenClient({
  inspectieId,
  onderneming,
  adres,
  inspectiedatum,
  inspecteur,
  flow,
  initialOntmoetePersonen,
  initialOngevalsgegevens,
  wetgevingen,
  boeken,
  titels,
  standaardinbreuken,
  initialInbreuken,
}: InspectieUitvoerenClientProps) {
  function sorteerInbreuken(teSorteren: Inbreuk[]): Inbreuk[] {
    return sorteerInbreukenJuridisch(
      teSorteren,
      standaardinbreuken,
      wetgevingen,
    );
  }

  const [inbreuken, setInbreuken] =
    useState<Inbreuk[]>(() =>
      sorteerInbreuken(initialInbreuken),
    );

  const [geselecteerdeId, setGeselecteerdeId] =
    useState<string | null>(null);

  const [beschrijving, setBeschrijving] =
    useState("");

  const [vaststellingen, setVaststellingen] =
    useState<VaststellingInput[]>([]);

  const [
    wettelijkeVerwijzing,
    setWettelijkeVerwijzing,
  ] = useState("");

  const [fotos, setFotos] =
    useState<InspectieFoto[]>([]);

  const [opslagStatus, setOpslagStatus] = useState("");
  const [persoonToevoegenBezig, setPersoonToevoegenBezig] =
    useState(false);

  const [
    afwijkendeGebeurtenisCode,
    setAfwijkendeGebeurtenisCode,
  ] = useState("");

  const [
    betrokkenVoorwerpCode,
    setBetrokkenVoorwerpCode,
  ] = useState("");

  const [soortLetselCode, setSoortLetselCode] =
    useState("");

  const [wetgevingFilter, setWetgevingFilter] =
    useState("");

  const [boekFilter, setBoekFilter] =
    useState("");

  const [titelFilter, setTitelFilter] =
    useState("");

  const [onderwerpFilter, setOnderwerpFilter] =
    useState("");

  const [zoekterm, setZoekterm] =
    useState("");

  const [exportBezig, setExportBezig] =
    useState(false);

  const [exportFout, setExportFout] =
    useState("");

  const [
    getoondeInspecteurInfo,
    setGetoondeInspecteurInfo,
  ] = useState<string | null>(null);

  const [
    ontmoetePersonen,
    setOntmoetePersonen,
  ] = useState<OntmoetePersoonRij[]>(() =>
    initialOntmoetePersonen.map((persoon) => ({
      id: maakTijdelijkId(),
      aanspreking: persoon.aanspreking,
      naam: persoon.naam,
      functie: persoon.functie,
    })),
  );

  const [
    toonOntmoetePersonen,
    setToonOntmoetePersonen,
  ] = useState(false);

  const [
    ernstigArbeidsongeval,
    setErnstigArbeidsongeval,
  ] = useState(
    initialOngevalsgegevens.ernstigArbeidsongeval,
  );

  const [
    toonOngevalsgegevens,
    setToonOngevalsgegevens,
  ] = useState(false);

  const [
    slachtofferVoornaam,
    setSlachtofferVoornaam,
  ] = useState(
    initialOngevalsgegevens.slachtofferVoornaam,
  );

  const [slachtofferNaam, setSlachtofferNaam] =
    useState(
      initialOngevalsgegevens.slachtofferNaam,
    );

  const [ongevalsdatum, setOngevalsdatum] =
    useState(
      initialOngevalsgegevens.ongevalsdatum,
    );

  const [
    slachtofferWerkHervat,
    setSlachtofferWerkHervat,
  ] = useState<boolean | null>(
    initialOngevalsgegevens.slachtofferWerkHervat,
  );

  const [
    werkhervattingsdatum,
    setWerkhervattingsdatum,
  ] = useState(
    initialOngevalsgegevens.werkhervattingsdatum,
  );

  const [werkpostBezocht, setWerkpostBezocht] =
    useState<boolean | null>(
      initialOngevalsgegevens.werkpostBezocht,
    );

  const aantalVolledigOntmoetePersonen =
    ontmoetePersonen.filter(
      (persoon) =>
        Boolean(persoon.aanspreking) &&
        persoon.naam.trim() &&
        persoon.functie.trim(),
    ).length;
  const ontmoetePersonenIngevuld =
    aantalVolledigOntmoetePersonen > 0 &&
    aantalVolledigOntmoetePersonen ===
      ontmoetePersonen.length;
  const ongevalsgegevensVolledig =
    ernstigArbeidsongeval &&
    Boolean(
      slachtofferVoornaam.trim() &&
        slachtofferNaam.trim() &&
        ongevalsdatum,
    );

  const bewerkFormulierRef =
    useRef<HTMLDivElement | null>(null);
  const zoekresultatenRef =
    useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (geselecteerdeId === null) {
      return;
    }

    const oorspronkelijkeOverflow =
      document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusId = window.requestAnimationFrame(
      () => {
        bewerkFormulierRef.current?.focus({
          preventScroll: true,
        });
      },
    );

    return () => {
      window.cancelAnimationFrame(focusId);
      document.body.style.overflow =
        oorspronkelijkeOverflow;
    };
  }, [geselecteerdeId]);

  const beschikbareBoeken = useMemo(() => {
    if (!wetgevingFilter) {
      return boeken;
    }

    return boeken.filter(
      (boek) =>
        boek.wetgevingId === wetgevingFilter,
    );
  }, [boeken, wetgevingFilter]);

  const beschikbareTitels = useMemo(() => {
    if (boekFilter) {
      return titels.filter(
        (titel) =>
          titel.boekId === boekFilter &&
          !isVerborgenAfdeling(titel.id),
      );
    }

    const boekIds = new Set(
      beschikbareBoeken.map((boek) => boek.id),
    );

    return titels.filter(
      (titel) =>
        boekIds.has(titel.boekId) &&
        !isVerborgenAfdeling(titel.id),
    );
  }, [titels, boekFilter, beschikbareBoeken]);

  const beschikbareOnderwerpen = useMemo(() => {
    const uniekeOnderwerpen =
      new Map<string, string>();

    for (const inbreuk of standaardinbreuken) {
      const juisteWetgeving =
        wetgevingFilter === "" ||
        inbreuk.wetgevingId === wetgevingFilter;
      const juisteBoek =
        boekFilter === "" ||
        inbreuk.boekId === boekFilter;
      const juisteTitel =
        titelFilter === "" ||
        inbreuk.titelId === titelFilter;
      const onderwerp = inbreuk.onderwerp.trim();

      if (
        !juisteWetgeving ||
        !juisteBoek ||
        !juisteTitel ||
        !onderwerp
      ) {
        continue;
      }

      const sleutel =
        onderwerp.toLocaleLowerCase("nl-BE");

      if (!uniekeOnderwerpen.has(sleutel)) {
        uniekeOnderwerpen.set(
          sleutel,
          onderwerp,
        );
      }
    }

    return [...uniekeOnderwerpen.values()].sort(
      (a, b) =>
        a.localeCompare(b, "nl-BE", {
          sensitivity: "base",
        }),
    );
  }, [
    standaardinbreuken,
    wetgevingFilter,
    boekFilter,
    titelFilter,
  ]);

  const welzijnswetGeselecteerd =
    isWelzijnswet(wetgevingFilter);
  const kbLiftenGeselecteerd =
    isKbBeveiligingLiften(wetgevingFilter);
  const hoofdstukIndelingGeselecteerd =
    welzijnswetGeselecteerd ||
    kbLiftenGeselecteerd;
  const eersteNiveauLabel = wetgevingFilter
    ? hoofdstukIndelingGeselecteerd
      ? "Hoofdstuk"
      : "Boek"
    : "Boek / hoofdstuk";
  const tweedeNiveauLabel = wetgevingFilter
    ? welzijnswetGeselecteerd
      ? "Afdeling"
      : "Titel"
    : "Titel / afdeling";

  const wetgevingNaamPerId = useMemo(() => {
    return new Map(
      wetgevingen.map((wetgeving) => [
        wetgeving.id,
        wetgeving.naam,
      ]),
    );
  }, [wetgevingen]);

  const boekNaamPerId = useMemo(() => {
    return new Map(
      boeken.map((boek) => [
        boek.id,
        boek.naam,
      ]),
    );
  }, [boeken]);

  const titelPerId = useMemo(() => {
    return new Map(
      titels.map((titel) => [
        titel.id,
        titel,
      ]),
    );
  }, [titels]);

  const zoektekstPerInbreukId = useMemo(() => {
    return new Map(
      standaardinbreuken.map((inbreuk) => [
        inbreuk.id,
        [
          inbreuk.onderwerp,
          ...inbreuk.kernwoorden,
        ]
          .join(" ")
          .toLocaleLowerCase("nl-BE"),
      ]),
    );
  }, [standaardinbreuken]);

  const geselecteerdeInbreuk = useMemo(
    () =>
      inbreuken.find(
        (inbreuk) =>
          inbreuk.id === geselecteerdeId,
      ) ?? null,
    [inbreuken, geselecteerdeId],
  );

  const geselecteerdeStandaardinbreuk =
    useMemo(() => {
      if (
        !geselecteerdeInbreuk
          ?.standaardinbreukId
      ) {
        return null;
      }

      return (
        standaardinbreuken.find(
          (standaardinbreuk) =>
            standaardinbreuk.id ===
            geselecteerdeInbreuk.standaardinbreukId,
        ) ?? null
      );
    }, [
      geselecteerdeInbreuk,
      standaardinbreuken,
    ]);
  const geselecteerdeInspecteurInfo =
    geselecteerdeStandaardinbreuk
      ?.inspecteurInfoIngeschakeld
      ? geselecteerdeStandaardinbreuk.inspecteurInfo?.trim() ??
        ""
      : "";
  const toonGeselecteerdeInspecteurInfo =
    Boolean(
      geselecteerdeStandaardinbreuk &&
        getoondeInspecteurInfo ===
          `bewerken-${geselecteerdeStandaardinbreuk.id}`,
    );

  const actueleBeschrijvingOpmaak =
    useMemo(() => {
      if (!geselecteerdeInbreuk) {
        return [];
      }

      if (
        beschrijving ===
        geselecteerdeInbreuk.beschrijving
      ) {
        return geselecteerdeInbreuk
          .beschrijvingOpmaak;
      }

      return platteSegmenten(beschrijving);
    }, [
      beschrijving,
      geselecteerdeInbreuk,
    ]);

  const zoekresultaten = useMemo(() => {
    const genormaliseerdeZoekterm =
      zoekterm.trim().toLowerCase();

    return standaardinbreuken.filter(
      (inbreuk) => {
        const juisteWetgeving =
          wetgevingFilter === "" ||
          inbreuk.wetgevingId === wetgevingFilter;

        const juisteBoek =
          boekFilter === "" ||
          inbreuk.boekId === boekFilter;

        const juisteTitel =
          titelFilter === "" ||
          inbreuk.titelId === titelFilter;

        const juisteOnderwerp =
          onderwerpFilter === "" ||
          inbreuk.onderwerp
            .trim()
            .toLocaleLowerCase("nl-BE") ===
            onderwerpFilter.toLocaleLowerCase(
              "nl-BE",
            );

        const zoekbareTekst =
          zoektekstPerInbreukId.get(
            inbreuk.id,
          ) ?? "";

        const juisteZoekterm =
          genormaliseerdeZoekterm === "" ||
          zoekbareTekst.includes(
            genormaliseerdeZoekterm,
          );

        return (
          juisteWetgeving &&
          juisteBoek &&
          juisteTitel &&
          juisteOnderwerp &&
          juisteZoekterm
        );
      },
    );
  }, [
    standaardinbreuken,
    wetgevingFilter,
    boekFilter,
    titelFilter,
    onderwerpFilter,
    zoekterm,
    zoektekstPerInbreukId,
  ]);

  const zoekresultatenPerBoekEnTitel =
    useMemo(() => {
      const boekVolgorde = new Map(
        boeken.map((boek, index) => [
          boek.id,
          index,
        ]),
      );
      const titelVolgorde = new Map(
        titels.map((titel, index) => [
          titel.id,
          index,
        ]),
      );
      const groepen = new Map<
        string,
        {
          sleutel: string;
          boekId: string;
          titelId: string;
          groepTitel: string;
          onderwerpen: Map<
            string,
            {
              sleutel: string;
              onderwerp: string;
              inbreuken: Standaardinbreuk[];
            }
          >;
        }
      >();

      for (const inbreuk of zoekresultaten) {
        const isWelzijnswetInbreuk =
          isWelzijnswet(
            inbreuk.wetgevingId,
          );
        const isKbLiftenInbreuk =
          isKbBeveiligingLiften(
            inbreuk.wetgevingId,
          );
        const sleutel =
          isWelzijnswetInbreuk
            ? `${inbreuk.wetgevingId}::welzijnswet`
            : isKbLiftenInbreuk
              ? `${inbreuk.boekId}::kb-liften`
            : `${inbreuk.boekId}::${inbreuk.titelId}`;
        let groep =
          groepen.get(sleutel);

        if (!groep) {
          const boekNaam =
            boekNaamPerId.get(
              inbreuk.boekId,
            ) ?? "Zonder boek";
          const titelNaam =
            titelPerId.get(
              inbreuk.titelId,
            )?.naam ?? "Zonder titel";

          groep = {
            sleutel,
            boekId: inbreuk.boekId,
            titelId: inbreuk.titelId,
            groepTitel:
              isWelzijnswetInbreuk
                ? "Welzijnswet"
                : isKbLiftenInbreuk
                  ? `${wetgevingNaamPerId.get(inbreuk.wetgevingId) ?? "KB beveiliging liften"} · ${boekNaam}`
                : maakZoekgroepTitel(
                    boekNaam,
                    inbreuk.titelId,
                    titelNaam,
                  ),
            onderwerpen: new Map(),
          };
          groepen.set(sleutel, groep);
        }

        const onderwerp =
          inbreuk.onderwerp.trim() ||
          "Zonder onderwerp";
        const onderwerpSleutel =
          onderwerp.toLocaleLowerCase("nl-BE");
        const bestaandeOnderwerpgroep =
          groep.onderwerpen.get(
            onderwerpSleutel,
          );

        if (bestaandeOnderwerpgroep) {
          bestaandeOnderwerpgroep.inbreuken.push(
            inbreuk,
          );
        } else {
          groep.onderwerpen.set(
            onderwerpSleutel,
            {
              sleutel: onderwerpSleutel,
              onderwerp,
              inbreuken: [inbreuk],
            },
          );
        }
      }

      return Array.from(groepen.values())
        .sort(
          (eerste, tweede) => {
            const boekVerschil =
              (boekVolgorde.get(
                eerste.boekId,
              ) ?? Number.MAX_SAFE_INTEGER) -
              (boekVolgorde.get(
                tweede.boekId,
              ) ?? Number.MAX_SAFE_INTEGER);

            if (boekVerschil !== 0) {
              return boekVerschil;
            }

            return (
              (titelVolgorde.get(
                eerste.titelId,
              ) ?? Number.MAX_SAFE_INTEGER) -
              (titelVolgorde.get(
                tweede.titelId,
              ) ?? Number.MAX_SAFE_INTEGER)
            );
          },
        )
        .map((groep) => ({
          ...groep,
          onderwerpen: Array.from(
            groep.onderwerpen.values(),
          ).sort((eerste, tweede) =>
            eerste.onderwerp.localeCompare(
              tweede.onderwerp,
              "nl-BE",
              {
                numeric: true,
                sensitivity: "base",
              },
            ),
          ),
        }));
    }, [
      zoekresultaten,
      boeken,
      titels,
      boekNaamPerId,
      titelPerId,
      wetgevingNaamPerId,
    ]);

  function maakFormulierLeeg() {
    setGeselecteerdeId(null);
    setBeschrijving("");
    setVaststellingen([]);
    setWettelijkeVerwijzing("");
    setAfwijkendeGebeurtenisCode("");
    setBetrokkenVoorwerpCode("");
    setSoortLetselCode("");
    setFotos([]);
  }

  function huidigeOngevalsgegevens(): OngevalsgegevensInput {
    return {
      ernstigArbeidsongeval,
      slachtofferVoornaam,
      slachtofferNaam,
      ongevalsdatum,
      slachtofferWerkHervat,
      werkhervattingsdatum,
      werkpostBezocht,
    };
  }

  function huidigeOntmoetePersonen(): OntmoetePersoonInput[] {
    return ontmoetePersonen.map(
      ({ aanspreking, naam, functie }) => ({
        aanspreking,
        naam,
        functie,
      }),
    );
  }

  function wisselOntmoetePersonenPaneel() {
    setToonOntmoetePersonen(
      (huidigeWaarde) => {
        const nieuweWaarde = !huidigeWaarde;

        if (
          nieuweWaarde &&
          ontmoetePersonen.length === 0
        ) {
          setOntmoetePersonen([
            {
              id: maakTijdelijkId(),
              aanspreking: "",
              naam: "",
              functie: "",
            },
          ]);
        }

        return nieuweWaarde;
      },
    );
    setExportFout("");
  }

  function wisselOngevalsgegevensPaneel() {
    if (!ernstigArbeidsongeval) {
      setErnstigArbeidsongeval(true);
      setToonOngevalsgegevens(true);
    } else {
      setToonOngevalsgegevens(
        (huidigeWaarde) => !huidigeWaarde,
      );
    }

    setExportFout("");
  }

  function verwijderOngevalsgegevensUitVerslag() {
    setErnstigArbeidsongeval(false);
    setToonOngevalsgegevens(false);
    setExportFout("");
  }

  function sluitBewerkvenster() {
    maakFormulierLeeg();
    setGetoondeInspecteurInfo(null);
    setExportFout("");
  }

  function wijzigOntmoetePersoon(
    id: string,
    veld: "naam" | "functie",
    waarde: string,
  ) {
    setOntmoetePersonen((huidigePersonen) =>
      huidigePersonen.map((persoon) =>
        persoon.id === id
          ? { ...persoon, [veld]: waarde }
          : persoon,
      ),
    );
    setExportFout("");
  }

  function wijzigAanspreking(
    id: string,
    aanspreking: Aanspreking,
  ) {
    setOntmoetePersonen((huidigePersonen) =>
      huidigePersonen.map((persoon) =>
        persoon.id === id
          ? { ...persoon, aanspreking }
          : persoon,
      ),
    );
    setExportFout("");
  }

  async function voegOntmoetePersoonToe() {
    const huidigePersonen =
      huidigeOntmoetePersonen();
    const onvolledigePersoon =
      huidigePersonen.some(
        (persoon) =>
          !persoon.aanspreking ||
          !persoon.naam.trim() ||
          !persoon.functie.trim(),
      );

    if (onvolledigePersoon) {
      setExportFout(
        "Kies eerst de aanspreking en vul de naam en functie van de huidige persoon in.",
      );
      return;
    }

    setPersoonToevoegenBezig(true);
    setOpslagStatus("Personen opslaan...");
    setExportFout("");

    try {
      await bewaarOntmoetePersonen(
        inspectieId,
        huidigePersonen,
      );
      setOntmoetePersonen(
        (bestaandePersonen) => [
          ...bestaandePersonen,
          {
            id: maakTijdelijkId(),
            aanspreking: "",
            naam: "",
            functie: "",
          },
        ],
      );
      setOpslagStatus("Personen opgeslagen");
    } catch (error) {
      console.error(error);
      setOpslagStatus("Opslaan mislukt");
      setExportFout(
        error instanceof Error
          ? error.message
          : "De personen konden niet worden opgeslagen.",
      );
    } finally {
      setPersoonToevoegenBezig(false);
    }
  }

  function verwijderOntmoetePersoon(id: string) {
    setOntmoetePersonen((huidigePersonen) =>
      huidigePersonen.filter(
        (persoon) => persoon.id !== id,
      ),
    );
    setExportFout("");
  }

  function startNieuweInbreuk() {
    maakFormulierLeeg();
    setGetoondeInspecteurInfo(null);
    setWetgevingFilter("");
    setBoekFilter("");
    setTitelFilter("");
    setOnderwerpFilter("");
    setZoekterm("");

    window.requestAnimationFrame(() => {
      zoekresultatenRef.current
        ?.querySelectorAll<HTMLDetailsElement>(
          "details[open]",
        )
        .forEach((groep) => {
          groep.open = false;
        });
    });
  }

  function voegStandaardinbreukToe(
    standaard: Standaardinbreuk,
  ) {
    const nieuweInbreuk: Inbreuk = {
      id: maakTijdelijkId(),
      standaardinbreukId: standaard.id,
      inbreukType: standaard.inbreukType,
      beschrijving: standaard.omschrijving,
      beschrijvingOpmaak: kopieerSegmenten(
        standaard.omschrijvingOpmaak,
      ),
      inCasu: standaard.specifiekeElementenAlsSituering
        ? ""
        : standaard.situering ?? "",
      toelichting: standaard.toelichting ?? "",
      aanvulling: standaard.aanvulling ?? "",
      aanvullingOpmaak: kopieerSegmenten(
        standaard.aanvullingOpmaak,
      ),
      wettelijkeVerwijzing:
        standaard.wettelijkeVerwijzing,
      specifiekeElementen:
        standaard.specifiekeElementenIngeschakeld
          ? standaard.specifiekeElementen.map(
              (element) => ({
                id: element.id,
                tekst: element.tekst,
              }),
            )
          : [],
      geselecteerdeSpecifiekeElementIds: [],
      specifiekeElementenAlsSituering:
        standaard.specifiekeElementenAlsSituering,
      eigenElementenToegestaan:
        standaard.eigenElementenToegestaan,
      vaststellingen: [
        maakVaststelling(
          standaard.specifiekeElementenAlsSituering
            ? ""
            : standaard.situering ?? "",
        ),
      ],
      afwijkendeGebeurtenisCode: "",
      betrokkenVoorwerpCode: "",
      soortLetselCode: "",
      fotos: [],
    };

    if (standaard.inbreukType === "EAO_CODES") {
      setErnstigArbeidsongeval(true);
      setToonOngevalsgegevens(true);
    }

    setInbreuken((huidigeInbreuken) =>
      sorteerInbreuken([
        ...huidigeInbreuken,
        nieuweInbreuk,
      ]),
    );

    setGeselecteerdeId(nieuweInbreuk.id);
    setBeschrijving(
      nieuweInbreuk.beschrijving,
    );
    setVaststellingen(
      nieuweInbreuk.vaststellingen,
    );
    setWettelijkeVerwijzing(
      nieuweInbreuk.wettelijkeVerwijzing,
    );
    setAfwijkendeGebeurtenisCode("");
    setBetrokkenVoorwerpCode("");
    setSoortLetselCode("");
    setFotos([]);
    setExportFout("");
    setGetoondeInspecteurInfo(null);
  }

  function selecteerInbreuk(
    inbreuk: Inbreuk,
  ) {
    setGeselecteerdeId(inbreuk.id);
    setBeschrijving(inbreuk.beschrijving);
    setVaststellingen(
      inbreuk.vaststellingen.map(
        (vaststelling) => ({
          ...vaststelling,
          geselecteerdeSpecifiekeElementIds: [
            ...vaststelling
              .geselecteerdeSpecifiekeElementIds,
          ],
          eigenElementen: [
            ...vaststelling.eigenElementen,
          ],
        }),
      ),
    );
    setWettelijkeVerwijzing(
      inbreuk.wettelijkeVerwijzing,
    );
    setAfwijkendeGebeurtenisCode(
      inbreuk.afwijkendeGebeurtenisCode,
    );
    setBetrokkenVoorwerpCode(
      inbreuk.betrokkenVoorwerpCode,
    );
    setSoortLetselCode(
      inbreuk.soortLetselCode,
    );
    setFotos(inbreuk.fotos);
    setExportFout("");
    setGetoondeInspecteurInfo(null);
  }

  function behandelFotos(
    bestanden: FileList | null,
  ) {
    if (!bestanden) {
      return;
    }

    const nieuweFotos = Array.from(bestanden).map((bestand) => ({
        id: maakTijdelijkId(),
        naam: bestand.name,
        bestand,
      }));
    const beschikbarePlaatsen =
      MAX_FOTOS_PER_INBREUK - fotos.length;

    if (beschikbarePlaatsen <= 0) {
      setExportFout(
        `Je kunt maximaal ${MAX_FOTOS_PER_INBREUK} foto’s aan één inbreuk koppelen.`,
      );
      return;
    }

    if (nieuweFotos.length > beschikbarePlaatsen) {
      setExportFout(
        `Er werden alleen ${beschikbarePlaatsen} foto${beschikbarePlaatsen === 1 ? "" : "’s"} toegevoegd. Per inbreuk zijn maximaal ${MAX_FOTOS_PER_INBREUK} foto’s mogelijk.`,
      );
    } else {
      setExportFout("");
    }

    setFotos([
      ...fotos,
      ...nieuweFotos.slice(0, beschikbarePlaatsen),
    ]);
  }

  function verwijderFoto(fotoId: string) {
    setFotos((huidigeFotos) =>
      huidigeFotos.filter(
        (foto) => foto.id !== fotoId,
      ),
    );
    setExportFout("");
  }

  async function slaDossierOp(teBewaren = synchroniseerFormulier(inbreuken)) {
    setOpslagStatus("Opslaan...");
    setExportFout("");

    try {
      const gesorteerdeInbreuken =
        sorteerInbreuken(teBewaren);
      const invoer: OpgeslagenInbreukInput[] =
        gesorteerdeInbreuken.map((inbreuk) => ({
          id: inbreuk.id,
          standaardinbreukId:
            inbreuk.standaardinbreukId,
          inbreukType: inbreuk.inbreukType,
          beschrijving: inbreuk.beschrijving,
          beschrijvingOpmaak:
            inbreuk.beschrijvingOpmaak,
          inCasu: inbreuk.inCasu,
          toelichting: inbreuk.toelichting,
          aanvulling: inbreuk.aanvulling,
          aanvullingOpmaak:
            inbreuk.aanvullingOpmaak,
          wettelijkeVerwijzing:
            inbreuk.wettelijkeVerwijzing,
          specifiekeElementen:
            inbreuk.specifiekeElementen,
          geselecteerdeSpecifiekeElementIds:
            inbreuk.geselecteerdeSpecifiekeElementIds,
          specifiekeElementenAlsSituering:
            inbreuk.specifiekeElementenAlsSituering,
          eigenElementenToegestaan:
            inbreuk.eigenElementenToegestaan,
          vaststellingen:
            inbreuk.vaststellingen,
          afwijkendeGebeurtenisCode:
            inbreuk.afwijkendeGebeurtenisCode,
          betrokkenVoorwerpCode:
            inbreuk.betrokkenVoorwerpCode,
          soortLetselCode:
            inbreuk.soortLetselCode,
          bewaardeFotoIds: inbreuk.fotos
            .filter((foto) => Boolean(foto.url))
            .map((foto) => foto.id),
        }));

      await bewaarInspectie(
        inspectieId,
        invoer,
        huidigeOngevalsgegevens(),
        huidigeOntmoetePersonen(),
      );

      const opgeslagen = await Promise.all(
        gesorteerdeInbreuken.map(async (inbreuk) => {
          const opgeslagenFotos: InspectieFoto[] = [];

          for (const foto of inbreuk.fotos) {
            if (!foto.bestand) {
              opgeslagenFotos.push(foto);
              continue;
            }

            const formData = new FormData();
            formData.set(
              "foto",
              await maakCompacteUpload(foto.bestand),
            );
            const response = await fetch(
              `/api/inspecties/${inspectieId}/inbreuken/${inbreuk.id}/fotos`,
              { method: "POST", body: formData },
            );

            if (!response.ok) {
              const resultaat = (await response.json()) as { fout?: string };
              throw new Error(resultaat.fout ?? "Foto opslaan mislukt.");
            }

            opgeslagenFotos.push(
              (await response.json()) as InspectieFoto,
            );
          }

          return { ...inbreuk, fotos: opgeslagenFotos };
        }),
      );

      setInbreuken(opgeslagen);
      const geselecteerd = opgeslagen.find((item) => item.id === geselecteerdeId);
      if (geselecteerd) setFotos(geselecteerd.fotos);
      setOpslagStatus("Opgeslagen");
      return opgeslagen;
    } catch (error) {
      console.error(error);
      setOpslagStatus("Opslaan mislukt");
      setExportFout(error instanceof Error ? error.message : "Opslaan mislukt.");
      return null;
    }
  }

  function wijzigSpecifiekElement(
    vaststellingId: string,
    elementId: string,
    geselecteerd: boolean,
  ) {
    setVaststellingen(
      (huidigeVaststellingen) =>
        huidigeVaststellingen.map(
          (vaststelling) =>
            vaststelling.id === vaststellingId
              ? {
                  ...vaststelling,
                  geselecteerdeSpecifiekeElementIds:
                    geselecteerd
                      ? [
                          ...new Set([
                            ...vaststelling
                              .geselecteerdeSpecifiekeElementIds,
                            elementId,
                          ]),
                        ]
                      : vaststelling
                          .geselecteerdeSpecifiekeElementIds
                          .filter(
                            (id) =>
                              id !== elementId,
                          ),
                }
              : vaststelling,
        ),
    );
    setExportFout("");
  }

  function wijzigVaststellingTekst(
    vaststellingId: string,
    tekst: string,
  ) {
    setVaststellingen(
      (huidigeVaststellingen) =>
        huidigeVaststellingen.map(
          (vaststelling) =>
            vaststelling.id === vaststellingId
              ? { ...vaststelling, tekst }
              : vaststelling,
        ),
    );
    setExportFout("");
  }

  function voegVaststellingToe() {
    setVaststellingen(
      (huidigeVaststellingen) => [
        ...huidigeVaststellingen,
        maakVaststelling(),
      ],
    );
    setExportFout("");
  }

  function verwijderVaststelling(
    vaststellingId: string,
  ) {
    setVaststellingen(
      (huidigeVaststellingen) =>
        huidigeVaststellingen.filter(
          (vaststelling) =>
            vaststelling.id !== vaststellingId,
        ),
    );
    setExportFout("");
  }

  function wijzigEigenElement(
    vaststellingId: string,
    index: number,
    tekst: string,
  ) {
    setVaststellingen(
      (huidigeVaststellingen) =>
        huidigeVaststellingen.map(
          (vaststelling) => {
            if (
              vaststelling.id !==
              vaststellingId
            ) {
              return vaststelling;
            }

            const eigenElementen = [
              ...vaststelling.eigenElementen,
            ];
            eigenElementen[index] = tekst;

            return {
              ...vaststelling,
              eigenElementen,
            };
          },
        ),
    );
    setExportFout("");
  }

  function voegEigenElementToe(
    vaststellingId: string,
  ) {
    setVaststellingen(
      (huidigeVaststellingen) =>
        huidigeVaststellingen.map(
          (vaststelling) =>
            vaststelling.id === vaststellingId
              ? {
                  ...vaststelling,
                  eigenElementen: [
                    ...vaststelling.eigenElementen,
                    "",
                  ],
                }
              : vaststelling,
        ),
    );
    setExportFout("");
  }

  function verwijderEigenElement(
    vaststellingId: string,
    index: number,
  ) {
    setVaststellingen(
      (huidigeVaststellingen) =>
        huidigeVaststellingen.map(
          (vaststelling) =>
            vaststelling.id === vaststellingId
              ? {
                  ...vaststelling,
                  eigenElementen:
                    vaststelling.eigenElementen.filter(
                      (_, elementIndex) =>
                        elementIndex !== index,
                    ),
                }
              : vaststelling,
        ),
    );
    setExportFout("");
  }

  function synchroniseerFormulier(
    huidigeInbreuken: Inbreuk[],
  ): Inbreuk[] {
    if (geselecteerdeId === null) {
      return sorteerInbreuken(huidigeInbreuken);
    }

    return sorteerInbreuken(
      huidigeInbreuken.map((inbreuk) => {
        if (inbreuk.id !== geselecteerdeId) {
          return inbreuk;
        }

        const beschrijvingGewijzigd =
          beschrijving !== inbreuk.beschrijving;

        return {
          ...inbreuk,
          beschrijving,
          beschrijvingOpmaak:
            beschrijvingGewijzigd
              ? platteSegmenten(beschrijving)
              : inbreuk.beschrijvingOpmaak,
          inCasu:
            vaststellingen[0]?.tekst ?? "",
          wettelijkeVerwijzing,
          geselecteerdeSpecifiekeElementIds:
            vaststellingen[0]
              ?.geselecteerdeSpecifiekeElementIds ??
            [],
          vaststellingen,
          afwijkendeGebeurtenisCode,
          betrokkenVoorwerpCode,
          soortLetselCode,
          fotos,
        };
      }),
    );
  }

  async function bewaarWijzigingen(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (geselecteerdeId === null) {
      return;
    }

    const actueel = synchroniseerFormulier(inbreuken);
    setInbreuken(actueel);
    const opgeslagen = await slaDossierOp(actueel);

    if (opgeslagen) {
      sluitBewerkvenster();
    }
  }

  async function verwijderInbreuk() {
    if (geselecteerdeId === null) {
      return;
    }

    const bevestigd = window.confirm(
      "Ben je zeker dat je deze inbreuk wilt verwijderen?",
    );

    if (!bevestigd) {
      return;
    }

    const resterendeInbreuken = inbreuken.filter(
      (inbreuk) => inbreuk.id !== geselecteerdeId,
    );
    setInbreuken(resterendeInbreuken);

    maakFormulierLeeg();
    setExportFout("");
    await slaDossierOp(resterendeInbreuken);
  }

  async function genereerWordVerslag() {
    if (
      (inbreuken.length === 0 &&
        !ernstigArbeidsongeval) ||
      exportBezig
    ) {
      return;
    }

    const werkHervat =
      slachtofferWerkHervat;
    const werkpostIsBezocht =
      werkpostBezocht;

    if (
      ernstigArbeidsongeval &&
      (!slachtofferVoornaam.trim() ||
        !slachtofferNaam.trim() ||
        !ongevalsdatum)
    ) {
      setExportFout(
        "Vul alle gegevens over het ernstig arbeidsongeval in.",
      );
      return;
    }

    const onvolledigeOntmoetePersoon =
      huidigeOntmoetePersonen()
        .filter(
          (persoon) =>
            Boolean(persoon.aanspreking) ||
            Boolean(persoon.naam.trim()) ||
            Boolean(persoon.functie.trim()),
        )
        .some(
          (persoon) =>
            !persoon.aanspreking ||
            !persoon.naam.trim() ||
            !persoon.functie.trim(),
        );

    if (onvolledigeOntmoetePersoon) {
      setToonOntmoetePersonen(true);
      setExportFout(
        "Kies voor elke ontmoete persoon de aanspreking en vul de naam en functie in voordat je het Word-verslag maakt.",
      );
      return;
    }

    setExportBezig(true);
    setExportFout("");

    try {
      const actueleInbreuken =
        synchroniseerFormulier(inbreuken);

      const onvolledigeEaoInbreuk =
        actueleInbreuken.find(
          (inbreuk) =>
            inbreuk.inbreukType ===
              "EAO_CODES" &&
            (!inbreuk.afwijkendeGebeurtenisCode ||
              !inbreuk.betrokkenVoorwerpCode ||
              !inbreuk.soortLetselCode),
        );

      if (onvolledigeEaoInbreuk) {
        setExportFout(
          "Kies voor elke EAO-inbreuk de afwijkende gebeurtenis, het betrokken voorwerp en het soort letsel.",
        );
        return;
      }

      setInbreuken(actueleInbreuken);

      const opgeslagenInbreuken = await slaDossierOp(actueleInbreuken);

      if (!opgeslagenInbreuken) {
        return;
      }

      const wordInbreuken: WordInbreuk[] =
        await Promise.all(
          opgeslagenInbreuken.map(
            async (inbreuk) => ({
              inbreukType: inbreuk.inbreukType,
              beschrijving:
                inbreuk.beschrijving,
              beschrijvingOpmaak:
                inbreuk.beschrijvingOpmaak,
              inCasu: inbreuk.inCasu,
              specifiekeElementen:
                inbreuk.specifiekeElementen
                  .filter((element) =>
                    inbreuk.geselecteerdeSpecifiekeElementIds.includes(
                      element.id,
                    ),
                  )
                  .map((element) => element.tekst),
              specifiekeElementenAlsSituering:
                inbreuk.specifiekeElementenAlsSituering,
              vaststellingen:
                inbreuk.vaststellingen.map(
                  (vaststelling) => ({
                    tekst: vaststelling.tekst,
                    specifiekeElementen:
                      inbreuk.specifiekeElementen
                        .filter((element) =>
                          vaststelling
                            .geselecteerdeSpecifiekeElementIds
                            .includes(element.id),
                        )
                        .map(
                          (element) =>
                            element.tekst,
                        ),
                    eigenElementen:
                      vaststelling.eigenElementen,
                  }),
                ),
              fotos: await maakWordFotos(
                inbreuk.fotos,
              ),
              toelichting:
                inbreuk.toelichting,
              aanvulling:
                inbreuk.aanvulling,
              aanvullingOpmaak:
                inbreuk.aanvullingOpmaak,
              wettelijkeVerwijzing:
                inbreuk.wettelijkeVerwijzing,
              afwijkendeGebeurtenisCode:
                inbreuk.afwijkendeGebeurtenisCode,
              betrokkenVoorwerpCode:
                inbreuk.betrokkenVoorwerpCode,
              soortLetselCode:
                inbreuk.soortLetselCode,
            }),
          ),
        );

      await downloadWordVerslag({
        onderneming,
        adres,
        inspectiedatum,
        inspecteur,
        flow,
        ontmoetePersonen:
          huidigeOntmoetePersonen(),
        inbreuken: wordInbreuken,
        ernstigArbeidsongeval:
          ernstigArbeidsongeval
            ? {
                slachtofferVoornaam,
                slachtofferNaam,
                ongevalsdatum,
                slachtofferWerkHervat:
                  werkHervat,
                werkhervattingsdatum,
                werkpostBezocht:
                  werkpostIsBezocht,
              }
            : null,
      });
    } catch (fout) {
      console.error(fout);

      setExportFout(
        fout instanceof Error
          ? fout.message
          : "Het Word-verslag kon niet worden gegenereerd.",
      );
    } finally {
      setExportBezig(false);
    }
  }

  function wisselInspecteurInfo(
    sleutel: string,
  ): void {
    setGetoondeInspecteurInfo(
      (huidigeSleutel) =>
        huidigeSleutel === sleutel
          ? null
          : sleutel,
    );
  }

  function maakZoekresultaatKaart(
    inbreuk: Standaardinbreuk,
  ) {
    const wetgevingNaam =
      wetgevingNaamPerId.get(
        inbreuk.wetgevingId,
      ) ?? "Onbekende wetgeving";

    const boekNaam =
      boekNaamPerId.get(inbreuk.boekId) ??
      "Onbekend boek";

    const titel =
      titelPerId.get(inbreuk.titelId);
    const toonTitel =
      !isVerborgenAfdeling(inbreuk.titelId);

    const compacteWettelijkeVerwijzing =
      maakCompacteWettelijkeVerwijzing(
        wetgevingNaam,
        inbreuk.wettelijkeVerwijzing,
      );
    const inspecteurInfo =
      inbreuk.inspecteurInfoIngeschakeld
        ? inbreuk.inspecteurInfo?.trim() ??
          ""
        : "";
    const inspecteurInfoSleutel =
      `zoek-${inbreuk.id}`;
    const toonInspecteurInfo =
      getoondeInspecteurInfo ===
      inspecteurInfoSleutel;

    return (
      <div
        key={inbreuk.id}
        className="rounded-lg border border-slate-200 bg-white p-4"
      >
        <div className="flex min-w-0 items-start gap-2">
          <p className="flex min-w-0 flex-1 flex-col items-start gap-1 text-xs font-medium uppercase tracking-wide text-slate-500 sm:flex-row sm:items-center sm:gap-3">
            <span className="min-w-0 max-w-full truncate sm:flex-1">
              {wetgevingNaam} · {boekNaam}
              {titel && toonTitel
                ? ` · ${titel.naam}`
                : ""}
            </span>

            <span className="shrink-0 font-semibold normal-case tracking-normal text-slate-700">
              {compacteWettelijkeVerwijzing}
            </span>
          </p>

          {inbreuk.inbreukType ===
            "EAO_CODES" && (
            <span className="inline-flex shrink-0 rounded-full border border-amber-300 bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-800">
              EAO
            </span>
          )}

          {inspecteurInfo && (
            <button
              type="button"
              aria-label="Info voor inspecteur tonen"
              aria-expanded={toonInspecteurInfo}
              title="Info voor inspecteur"
              onClick={() =>
                wisselInspecteurInfo(
                  inspecteurInfoSleutel,
                )
              }
              className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition ${
                toonInspecteurInfo
                  ? "border-sky-600 bg-sky-600 text-white"
                  : "border-sky-300 bg-sky-50 text-sky-700 hover:border-sky-500 hover:bg-sky-100"
              }`}
            >
              i
            </button>
          )}
        </div>

        {inspecteurInfo &&
          toonInspecteurInfo && (
          <div
            role="note"
            className="mt-3 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2.5 text-sm leading-6 text-sky-950"
          >
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-sky-700">
              Info voor inspecteur
            </p>
            <p className="whitespace-pre-wrap">
              {inspecteurInfo}
            </p>
          </div>
        )}

        <TekstMetOpmaak
          tekst={inbreuk.omschrijving}
          segmenten={
            inbreuk.omschrijvingOpmaak
          }
          className="mt-2 block"
        />

        {inbreuk.kernwoorden.length > 0 && (
          <p className="mt-2 text-sm text-slate-500">
            Kernwoorden:{" "}
            {inbreuk.kernwoorden.join(", ")}
          </p>
        )}

        <button
          type="button"
          onClick={() =>
            voegStandaardinbreukToe(inbreuk)
          }
          className="mt-4 w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800 sm:w-auto sm:py-2"
        >
          + Toevoegen aan inspectie
        </button>
      </div>
    );
  }

  return (
    <main className="tww-canvas min-h-screen">
      <div className="mx-auto max-w-7xl px-4 pb-36 pt-6 sm:px-6 sm:pb-32">
        <AppBalk />

        <header className="mt-5 rounded-2xl border border-white bg-white/95 p-4 shadow-[0_14px_45px_rgba(15,23,42,0.07)] sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
                Inspecteur
              </p>
              <h1 className="mt-1 text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl">
                {inspecteur || "Niet ingevuld"}
              </h1>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:min-w-[40rem]">
              <div className="col-span-2 rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white px-4 py-3 sm:col-span-1">
                <p className="text-xs text-blue-700">
                  Flow
                </p>

                <p className="text-lg font-bold text-blue-950">
                  {flow || "Niet ingevuld"}
                </p>
              </div>

              <button
                type="button"
                aria-expanded={
                  toonOntmoetePersonen
                }
                aria-controls="ontmoete-personen-paneel"
                onClick={wisselOntmoetePersonenPaneel}
                className={`flex min-h-16 items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                  toonOntmoetePersonen
                    ? "border-blue-500 bg-blue-100 text-blue-950 shadow-sm"
                    : ontmoetePersonenIngevuld
                      ? "border-emerald-300 bg-emerald-50 text-slate-800 hover:border-blue-300 hover:bg-blue-50"
                    : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    toonOntmoetePersonen
                      ? "bg-blue-600 text-white"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m7-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87m-2-11.26a4 4 0 0 1 0 7.75"
                    />
                  </svg>

                  {ontmoetePersonenIngevuld && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-600 text-white shadow-sm">
                      <svg
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        className="h-3 w-3"
                      >
                        <path
                          d="m5 10 3 3 7-7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold">
                    Ontmoete personen
                  </span>
                  <span className="mt-0.5 block text-xs opacity-75">
                    {ontmoetePersonenIngevuld
                      ? `${aantalVolledigOntmoetePersonen} toegevoegd`
                      : "Naam en functie"}
                  </span>
                </span>

                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`h-4 w-4 shrink-0 opacity-60 transition-transform ${
                    toonOntmoetePersonen
                      ? "rotate-180"
                      : ""
                  }`}
                >
                  <path
                    d="m6 8 4 4 4-4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <button
                type="button"
                aria-expanded={toonOngevalsgegevens}
                aria-controls="ongevalsgegevens-paneel"
                onClick={wisselOngevalsgegevensPaneel}
                className={`flex min-h-16 items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition focus:outline-none focus:ring-2 focus:ring-amber-300 ${
                  toonOngevalsgegevens
                    ? "border-amber-500 bg-amber-100 text-amber-950 shadow-sm"
                    : ongevalsgegevensVolledig
                      ? "border-emerald-300 bg-emerald-50 text-slate-800 hover:border-amber-300 hover:bg-amber-50"
                      : ernstigArbeidsongeval
                        ? "border-amber-300 bg-amber-50 text-amber-950 hover:border-amber-400 hover:bg-amber-100"
                    : "border-slate-200 bg-white text-slate-700 hover:border-amber-300 hover:bg-amber-50"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    ernstigArbeidsongeval
                      ? "bg-amber-500 text-slate-950"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v4m0 4h.01M10.3 3.7 2.8 17a2 2 0 0 0 1.74 3h14.92a2 2 0 0 0 1.74-3L13.7 3.7a2 2 0 0 0-3.4 0Z"
                    />
                  </svg>

                  {ongevalsgegevensVolledig && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-600 text-white shadow-sm">
                      <svg
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        className="h-3 w-3"
                      >
                        <path
                          d="m5 10 3 3 7-7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold">
                    Ernstig arbeidsongeval
                  </span>
                  <span className="mt-0.5 block text-xs opacity-75">
                    {ongevalsgegevensVolledig
                      ? "Basisgegevens ingevuld"
                      : ernstigArbeidsongeval
                        ? "Nog aan te vullen"
                      : "Toevoegen aan verslag"}
                  </span>
                </span>

                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`h-4 w-4 shrink-0 opacity-60 transition-transform ${
                    toonOngevalsgegevens
                      ? "rotate-180"
                      : ""
                  }`}
                >
                  <path
                    d="m6 8 4 4 4-4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-slate-200 pt-4 sm:grid-cols-3">
            <div className="min-w-0">
              <dt className="text-xs text-slate-500">
                Onderneming
              </dt>

              <dd className="break-words font-medium text-slate-900">
                {onderneming || "Niet ingevuld"}
              </dd>
            </div>

            <div className="order-last col-span-2 min-w-0 sm:order-none sm:col-span-1">
              <dt className="text-xs text-slate-500">
                Adres
              </dt>

              <dd className="break-words font-medium text-slate-900">
                {adres || "Niet ingevuld"}
              </dd>
            </div>

            <div className="min-w-0">
              <dt className="text-xs text-slate-500">
                Inspectiedatum
              </dt>

              <dd className="break-words font-medium text-slate-900">
                {inspectiedatum || "Niet ingevuld"}
              </dd>
            </div>

          </dl>

          {toonOntmoetePersonen && (
            <section
              id="ontmoete-personen-paneel"
              aria-labelledby="ontmoete-personen-titel"
              className="mt-5 overflow-hidden rounded-xl border border-blue-200 bg-blue-50/70"
            >
              <div className="flex flex-col gap-3 border-b border-blue-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div>
                  <h2
                    id="ontmoete-personen-titel"
                    className="font-bold text-blue-950"
                  >
                    Personen ontmoet tijdens het inspectiebezoek
                  </h2>
                  <p className="mt-1 text-sm text-blue-800">
                    Aanspreking, naam en functie verschijnen onder onderdeel 1 van het Word-verslag.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void voegOntmoetePersoonToe()
                  }
                  disabled={
                    ontmoetePersonen.length >= 50 ||
                    persoonToevoegenBezig
                  }
                  className="min-h-10 shrink-0 rounded-lg border border-blue-300 bg-white px-4 py-2 text-sm font-bold text-blue-800 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {persoonToevoegenBezig
                    ? "Personen opslaan..."
                    : "+ Persoon toevoegen"}
                </button>
              </div>

              <div className="space-y-3 p-4 sm:p-5">
                {ontmoetePersonen.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-blue-300 bg-white/70 px-4 py-3 text-sm text-blue-800">
                    Er zijn nog geen personen toegevoegd.
                  </p>
                ) : (
                  ontmoetePersonen.map(
                    (persoon, index) => (
                      <div
                        key={persoon.id}
                        className="grid grid-cols-[2.25rem_minmax(0,1fr)] items-end gap-3 rounded-lg border border-blue-200 bg-white p-3 sm:grid-cols-[2.25rem_minmax(0,1fr)_minmax(0,1fr)_auto]"
                      >
                        <div
                          className="grid gap-1 self-end pb-0.5"
                          role="group"
                          aria-label={`Aanspreking persoon ${index + 1}`}
                        >
                          {(
                            [
                              ["HEER", "♂", "De heer"],
                              ["MEVROUW", "♀", "Mevrouw"],
                            ] as const
                          ).map(
                            ([waarde, symbool, label]) => {
                              const geselecteerd =
                                persoon.aanspreking === waarde;

                              return (
                                <button
                                  key={waarde}
                                  type="button"
                                  title={label}
                                  aria-label={`${label} voor persoon ${index + 1}`}
                                  aria-pressed={geselecteerd}
                                  onClick={() =>
                                    wijzigAanspreking(
                                      persoon.id,
                                      waarde,
                                    )
                                  }
                                  className={`flex h-8 w-9 items-center justify-center rounded-md border text-base font-bold leading-none transition focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                                    geselecteerd
                                      ? "border-blue-700 bg-blue-700 text-white shadow-sm"
                                      : "border-blue-200 bg-blue-50 text-blue-900 hover:border-blue-400 hover:bg-blue-100"
                                  }`}
                                >
                                  <span aria-hidden="true">
                                    {symbool}
                                  </span>
                                </button>
                              );
                            },
                          )}
                        </div>

                        <label className="block min-w-0">
                          <span className="text-sm font-semibold text-slate-700">
                            Naam persoon {index + 1}
                          </span>
                          <input
                            type="text"
                            value={persoon.naam}
                            maxLength={150}
                            onChange={(event) =>
                              wijzigOntmoetePersoon(
                                persoon.id,
                                "naam",
                                event.target.value,
                              )
                            }
                            autoComplete="off"
                            className="mt-2 min-h-11 w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-base outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                          />
                        </label>

                        <label className="col-span-2 block min-w-0 sm:col-span-1">
                          <span className="text-sm font-semibold text-slate-700">
                            Functie
                          </span>
                          <input
                            type="text"
                            value={persoon.functie}
                            maxLength={150}
                            onChange={(event) =>
                              wijzigOntmoetePersoon(
                                persoon.id,
                                "functie",
                                event.target.value,
                              )
                            }
                            autoComplete="off"
                            className="mt-2 min-h-11 w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-base outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() =>
                            verwijderOntmoetePersoon(
                              persoon.id,
                            )
                          }
                          aria-label={`Verwijder persoon ${index + 1}`}
                          className="col-span-2 min-h-11 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 sm:col-span-1"
                        >
                          Verwijderen
                        </button>
                      </div>
                    ),
                  )
                )}
              </div>
            </section>
          )}

          {ernstigArbeidsongeval &&
            toonOngevalsgegevens && (
            <section
              id="ongevalsgegevens-paneel"
              aria-labelledby="ongevalsgegevens-titel"
              className="mt-5 overflow-hidden rounded-xl border border-amber-300 bg-amber-50"
            >
              <div className="flex flex-col gap-3 border-b border-amber-200 px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:px-5">
                <div>
                  <h2
                    id="ongevalsgegevens-titel"
                    className="font-bold text-amber-950"
                  >
                    Gegevens ernstig arbeidsongeval
                  </h2>
                  <p className="mt-1 text-sm text-amber-800">
                    Deze gegevens worden
                    automatisch gebruikt in de
                    EAO-inbreuk en het
                    Word-verslag.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    verwijderOngevalsgegevensUitVerslag
                  }
                  className="min-h-10 shrink-0 rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-900 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                >
                  Niet opnemen
                </button>
              </div>

              <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Voornaam slachtoffer
                  </span>
                  <input
                    type="text"
                    value={slachtofferVoornaam}
                    maxLength={100}
                    onChange={(event) =>
                      setSlachtofferVoornaam(
                        event.target.value,
                      )
                    }
                    autoComplete="off"
                    className="mt-2 min-h-11 w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-base outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Naam slachtoffer
                  </span>
                  <input
                    type="text"
                    value={slachtofferNaam}
                    maxLength={100}
                    onChange={(event) =>
                      setSlachtofferNaam(
                        event.target.value,
                      )
                    }
                    autoComplete="off"
                    className="mt-2 min-h-11 w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-base outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Datum ongeval
                  </span>
                  <input
                    type="date"
                    value={ongevalsdatum}
                    onChange={(event) =>
                      setOngevalsdatum(
                        event.target.value,
                      )
                    }
                    className="mt-2 min-h-11 w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-base outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
                  />
                </label>

                <fieldset className="sm:col-span-1 lg:col-span-1">
                  <legend className="text-sm font-semibold text-slate-700">
                    Slachtoffer opnieuw aan het werk?
                  </legend>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {(
                      [
                        null,
                        true,
                        false,
                      ] as const
                    ).map((waarde) => (
                      <label
                        key={String(waarde)}
                        className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                          slachtofferWerkHervat ===
                          waarde
                            ? "border-amber-600 bg-amber-200 text-amber-950"
                            : "border-amber-300 bg-white text-slate-700 hover:bg-amber-100"
                        }`}
                      >
                        <input
                          type="radio"
                          name="slachtofferWerkHervat"
                          checked={
                            slachtofferWerkHervat ===
                            waarde
                          }
                          onChange={() =>
                            setSlachtofferWerkHervat(
                              waarde,
                            )
                          }
                          className="h-4 w-4 accent-amber-600"
                        />
                        {waarde === null
                          ? "Open"
                          : waarde
                            ? "Ja"
                            : "Nee"}
                      </label>
                    ))}
                  </div>
                </fieldset>

                {slachtofferWerkHervat && (
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">
                      Datum werkhervatting
                    </span>
                    <input
                      type="date"
                      value={werkhervattingsdatum}
                      onChange={(event) =>
                        setWerkhervattingsdatum(
                          event.target.value,
                        )
                      }
                      className="mt-2 min-h-11 w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-base outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
                    />
                  </label>
                )}

                <fieldset
                  className={
                    slachtofferWerkHervat
                      ? "sm:col-span-2 lg:col-span-1"
                      : "sm:col-span-1 lg:col-span-2"
                  }
                >
                  <legend className="text-sm font-semibold text-slate-700">
                    Werkpost van het ongeval bezocht?
                  </legend>
                  <div className="mt-2 grid max-w-md grid-cols-3 gap-2">
                    {(
                      [
                        null,
                        true,
                        false,
                      ] as const
                    ).map((waarde) => (
                      <label
                        key={String(waarde)}
                        className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                          werkpostBezocht === waarde
                            ? "border-amber-600 bg-amber-200 text-amber-950"
                            : "border-amber-300 bg-white text-slate-700 hover:bg-amber-100"
                        }`}
                      >
                        <input
                          type="radio"
                          name="werkpostBezocht"
                          checked={
                            werkpostBezocht === waarde
                          }
                          onChange={() =>
                            setWerkpostBezocht(
                              waarde,
                            )
                          }
                          className="h-4 w-4 accent-amber-600"
                        />
                        {waarde === null
                          ? "Open"
                          : waarde
                            ? "Ja"
                            : "Nee"}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>
            </section>
          )}
        </header>

        <div className="mt-6 grid min-w-0 gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="min-w-0 rounded-2xl border border-white bg-white/95 p-4 shadow-[0_12px_38px_rgba(15,23,42,0.07)] sm:p-5 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:overscroll-contain">
            <button
              type="button"
              onClick={startNieuweInbreuk}
              className="w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800"
            >
              Nieuwe inbreuk kiezen
            </button>

            <div className="mt-6">
              <h2 className="font-semibold text-slate-900">
                Inbreuken ({inbreuken.length})
              </h2>

              {inbreuken.length > 1 && (
                <p className="mt-1 text-xs text-slate-500 lg:hidden">
                  Veeg horizontaal om alle inbreuken te bekijken.
                </p>
              )}

              {inbreuken.length === 0 ? (
                <p className="mt-3 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                  Er zijn nog geen inbreuken
                  toegevoegd.
                </p>
              ) : (
                <ol className="mt-3 flex snap-x gap-2 overflow-x-auto pb-2 lg:block lg:space-y-2 lg:overflow-visible lg:pb-0">
                  {inbreuken.map(
                    (inbreuk, index) => (
                      <li
                        key={inbreuk.id}
                        className="w-[min(18rem,82vw)] shrink-0 snap-start lg:w-auto"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            selecteerInbreuk(inbreuk)
                          }
                          className={`w-full rounded-lg border p-4 text-left transition ${
                            geselecteerdeId ===
                            inbreuk.id
                              ? "border-blue-600 bg-blue-50"
                              : "border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <span className="flex items-center justify-between gap-2 text-sm font-semibold text-slate-900">
                            <span>
                              Inbreuk {index + 1}
                            </span>
                            {inbreuk.inbreukType ===
                              "EAO_CODES" && (
                              <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                EAO
                              </span>
                            )}
                          </span>

                          <TekstMetOpmaak
                            tekst={
                              inbreuk.beschrijving
                            }
                            segmenten={
                              inbreuk.beschrijvingOpmaak
                            }
                            className="mt-1 block line-clamp-3 text-sm"
                          />

                          {inbreuk.fotos.length >
                            0 && (
                            <span className="mt-2 block text-xs text-slate-500">
                              {inbreuk.fotos.length}{" "}
                              foto
                              {inbreuk.fotos
                                .length === 1
                                ? ""
                                : "’s"}
                            </span>
                          )}
                        </button>
                      </li>
                    ),
                  )}
                </ol>
              )}
            </div>
          </aside>

          <section className="min-w-0 space-y-6">
            <div className="min-w-0 rounded-2xl border border-white bg-white/95 p-4 shadow-[0_12px_38px_rgba(15,23,42,0.07)] sm:p-8">
              <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                Standaardinbreuk zoeken
              </h2>

              <p className="mt-1 text-slate-600">
                De gegevens worden uit de
                centrale bibliotheek geladen.
              </p>

              <div
                className={`mt-6 grid gap-4 sm:grid-cols-2 ${
                  wetgevingFilter
                    ? kbLiftenGeselecteerd
                      ? "lg:grid-cols-4"
                      : "lg:grid-cols-3 xl:grid-cols-5"
                    : "lg:grid-cols-3"
                }`}
              >
                <div>
                  <label
                    htmlFor="wetgeving"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Wetgeving
                  </label>

                  <select
                    id="wetgeving"
                    value={wetgevingFilter}
                    onChange={(event) => {
                      setWetgevingFilter(
                        event.target.value,
                      );
                      setBoekFilter("");
                      setTitelFilter("");
                      setOnderwerpFilter("");
                    }}
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-600"
                  >
                    <option value="">
                      Alle wetgeving
                    </option>

                    {wetgevingen.map(
                      (wetgeving) => (
                        <option
                          key={wetgeving.id}
                          value={wetgeving.id}
                        >
                          {wetgeving.naam}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                {wetgevingFilter && (
                  <div>
                    <label
                      htmlFor="boek"
                      className="block text-sm font-medium text-slate-700"
                    >
                      {eersteNiveauLabel}
                    </label>

                    <select
                      id="boek"
                      value={boekFilter}
                      onChange={(event) => {
                        setBoekFilter(
                          event.target.value,
                        );
                        setTitelFilter("");
                        setOnderwerpFilter("");
                      }}
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-600"
                    >
                      <option value="">
                        Alle{" "}
                        {hoofdstukIndelingGeselecteerd
                          ? "hoofdstukken"
                          : "boeken"}
                      </option>

                      {beschikbareBoeken.map(
                        (boek) => (
                          <option
                            key={boek.id}
                            value={boek.id}
                          >
                            {boek.naam}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                )}

                {wetgevingFilter &&
                  !kbLiftenGeselecteerd && (
                  <div>
                    <label
                      htmlFor="titel"
                      className="block text-sm font-medium text-slate-700"
                    >
                      {tweedeNiveauLabel}
                    </label>

                    <select
                      id="titel"
                      value={titelFilter}
                      onChange={(event) => {
                        setTitelFilter(
                          event.target.value,
                        );
                        setOnderwerpFilter("");
                      }}
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-600"
                    >
                      <option value="">
                        Alle{" "}
                        {welzijnswetGeselecteerd
                          ? "afdelingen"
                          : "titels"}
                      </option>

                      {beschikbareTitels.map(
                        (titel) => (
                          <option
                            key={titel.id}
                            value={titel.id}
                          >
                            {titel.naam}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                )}

                <div className="hidden lg:block">
                  <label
                    htmlFor="onderwerp"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Onderwerp
                  </label>

                  <select
                    id="onderwerp"
                    value={onderwerpFilter}
                    onChange={(event) =>
                      setOnderwerpFilter(
                        event.target.value,
                      )
                    }
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-600"
                  >
                    <option value="">
                      Alle onderwerpen
                    </option>

                    {beschikbareOnderwerpen.map(
                      (onderwerp) => (
                        <option
                          key={onderwerp}
                          value={onderwerp}
                        >
                          {onderwerp}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="zoekterm"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Kernwoord
                  </label>

                  <input
                    id="zoekterm"
                    type="search"
                    value={zoekterm}
                    onChange={(event) =>
                      setZoekterm(
                        event.target.value,
                      )
                    }
                    placeholder="Onderwerp of kernwoord..."
                    className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div
                ref={zoekresultatenRef}
                className="mt-6"
              >
                <h3
                  className={`font-semibold text-slate-900 ${
                    zoekresultaten.length > 0
                      ? "hidden sm:block"
                      : ""
                  }`}
                >
                  Zoekresultaten (
                  {zoekresultaten.length})
                </h3>

                {zoekresultaten.length ===
                0 ? (
                  <p className="mt-3 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                    Geen standaardinbreuken
                    gevonden.
                  </p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {zoekresultatenPerBoekEnTitel.map(
                      (groep) => {
                        const enigeGroep =
                          zoekresultatenPerBoekEnTitel.length ===
                          1;
                        const aantalInbreuken =
                          groep.onderwerpen.reduce(
                            (totaal, onderwerp) =>
                              totaal +
                              onderwerp.inbreuken
                                .length,
                            0,
                          );

                        return (
                          <UitklapbareGroep
                            key={groep.sleutel}
                            standaardOpen={enigeGroep}
                            className="group/indeling overflow-hidden rounded-xl border border-slate-200 bg-white"
                          >
                            <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 bg-slate-900 px-4 py-3 text-sm font-bold text-white outline-none marker:content-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-400 sm:text-base">
                              <span className="min-w-0 flex-1">
                                {groep.groepTitel}
                              </span>
                              <span className="shrink-0 rounded-full bg-white/15 px-2.5 py-0.5 text-xs">
                                {aantalInbreuken}
                              </span>
                              <svg
                                aria-hidden="true"
                                viewBox="0 0 20 20"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                className="h-4 w-4 shrink-0 transition-transform group-open/indeling:rotate-180"
                              >
                                <path
                                  d="m6 8 4 4 4-4"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </summary>

                            <div className="space-y-2 border-t border-slate-700 bg-slate-100/80 p-2 sm:p-3">
                              {groep.onderwerpen.map(
                                (onderwerpgroep) => (
                                  <UitklapbareGroep
                                    key={`${groep.sleutel}-${onderwerpgroep.sleutel}`}
                                    standaardOpen={
                                      groep.onderwerpen
                                        .length === 1
                                    }
                                    className="group/onderwerp ml-2 overflow-hidden rounded-lg border border-slate-200 border-l-2 border-l-blue-300 bg-white shadow-sm sm:ml-4"
                                  >
                                    <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2.5 px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none marker:content-none hover:bg-blue-50/70 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 sm:px-4">
                                      <span
                                        aria-hidden="true"
                                        className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500"
                                      />
                                      <span className="min-w-0 flex-1">
                                        {
                                          onderwerpgroep.onderwerp
                                        }
                                      </span>
                                      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                                        {
                                          onderwerpgroep
                                            .inbreuken
                                            .length
                                        }
                                      </span>
                                      <svg
                                        aria-hidden="true"
                                        viewBox="0 0 20 20"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open/onderwerp:rotate-180"
                                      >
                                        <path
                                          d="m6 8 4 4 4-4"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        />
                                      </svg>
                                    </summary>

                                    <div className="space-y-3 border-t border-slate-100 bg-slate-50/70 p-2">
                                      {onderwerpgroep.inbreuken.map(
                                        maakZoekresultaatKaart,
                                      )}
                                    </div>
                                  </UitklapbareGroep>
                                ),
                              )}
                            </div>
                          </UitklapbareGroep>
                        );
                      },
                    )}
                  </div>
                )}
              </div>
            </div>

            {geselecteerdeId !== null && (
              <>
                <div
                  aria-hidden="true"
                  className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[2px]"
                />

                <div
                  ref={bewerkFormulierRef}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="inbreuk-bewerken-titel"
                  tabIndex={-1}
                  className="fixed inset-x-0 bottom-0 z-50 max-h-[calc(100dvh-0.5rem)] min-w-0 overflow-y-auto overscroll-contain rounded-t-3xl border border-white bg-slate-50 p-4 shadow-[0_-18px_60px_rgba(15,23,42,0.28)] outline-none sm:inset-6 sm:mx-auto sm:max-h-[calc(100dvh-3rem)] sm:max-w-5xl sm:rounded-3xl sm:p-8"
                >
                  <div className="sticky -top-4 z-20 -mx-4 -mt-4 mb-6 flex items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 py-4 shadow-sm backdrop-blur sm:-top-8 sm:-mx-8 sm:-mt-8 sm:px-8">
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
                        Inspectie
                      </p>
                      <h2
                        id="inbreuk-bewerken-titel"
                        className="truncate text-xl font-bold text-slate-950 sm:text-2xl"
                      >
                        Inbreuk bewerken
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={sluitBewerkvenster}
                      aria-label="Bewerkvenster sluiten"
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-950"
                    >
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="h-5 w-5"
                      >
                        <path
                          d="m6 6 12 12M18 6 6 18"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </div>

                <form
                  onSubmit={bewaarWijzigingen}
                  className="space-y-8"
                >
                  <section
                    aria-labelledby="bibliotheekinformatie-titel"
                    className="overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-slate-50 shadow-sm"
                  >
                    <div className="flex items-start gap-4 border-b border-blue-100 bg-blue-50/80 px-5 py-4 sm:px-6">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-white shadow-sm">
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          className="h-5 w-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V5H6.5A2.5 2.5 0 0 0 4 7.5v12Z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8 8h8M8 12h6"
                          />
                        </svg>
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3
                          id="bibliotheekinformatie-titel"
                          className="text-lg font-bold text-slate-900"
                        >
                          Bibliotheekinformatie
                        </h3>

                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          Deze goedgekeurde
                          standaardinformatie ligt
                          vast en wordt ongewijzigd
                          opgenomen in het verslag.
                        </p>
                      </div>

                      {geselecteerdeInspecteurInfo &&
                        geselecteerdeStandaardinbreuk && (
                        <button
                          type="button"
                          aria-label="Info voor inspecteur tonen"
                          aria-expanded={
                            toonGeselecteerdeInspecteurInfo
                          }
                          title="Info voor inspecteur"
                          onClick={() =>
                            wisselInspecteurInfo(
                              `bewerken-${geselecteerdeStandaardinbreuk.id}`,
                            )
                          }
                          className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-bold transition ${
                            toonGeselecteerdeInspecteurInfo
                              ? "border-sky-600 bg-sky-600 text-white"
                              : "border-sky-300 bg-white text-sky-700 hover:border-sky-500 hover:bg-sky-50"
                          }`}
                        >
                          i
                        </button>
                      )}
                    </div>

                    {geselecteerdeInspecteurInfo &&
                      toonGeselecteerdeInspecteurInfo && (
                      <div
                        role="note"
                        className="border-b border-sky-200 bg-sky-50 px-5 py-4 text-sm leading-6 text-sky-950 sm:px-6"
                      >
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-sky-700">
                          Info voor inspecteur
                        </p>
                        <p className="whitespace-pre-wrap">
                          {
                            geselecteerdeInspecteurInfo
                          }
                        </p>
                      </div>
                    )}

                    <div className="space-y-5 p-5 sm:p-6">
                      <article>
                        <div className="mb-2 flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-blue-600" />

                          <h4 className="text-sm font-semibold text-slate-700">
                            Omschrijving
                          </h4>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                          <TekstMetOpmaak
                            tekst={beschrijving}
                            segmenten={
                              actueleBeschrijvingOpmaak
                            }
                            className="block leading-7"
                          />
                        </div>
                      </article>

                      <article>
                        <div className="mb-2 flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-blue-600" />

                          <h4 className="text-sm font-semibold text-slate-700">
                            Wettelijke verwijzing
                          </h4>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                          <p className="whitespace-pre-wrap leading-7 text-slate-800">
                            {
                              wettelijkeVerwijzing
                            }
                          </p>
                        </div>
                      </article>

                      {geselecteerdeInbreuk?.aanvulling && (
                        <article>
                          <div className="mb-2 flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-blue-600" />

                            <h4 className="text-sm font-semibold text-slate-700">
                              Aanvulling
                            </h4>
                          </div>

                          <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                            <TekstMetOpmaak
                              tekst={
                                geselecteerdeInbreuk.aanvulling
                              }
                              segmenten={
                                geselecteerdeInbreuk.aanvullingOpmaak
                              }
                              className="block leading-7"
                            />
                          </div>
                        </article>
                      )}
                    </div>
                  </section>

                  {geselecteerdeInbreuk
                    ?.inbreukType ===
                  "EAO_CODES" ? (
                    <section
                      aria-labelledby="eao-codes-titel"
                      className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-white p-5 shadow-sm sm:p-6"
                    >
                      <div className="flex flex-col gap-3 border-b border-amber-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3
                            id="eao-codes-titel"
                            className="text-lg font-bold text-slate-900"
                          >
                            Ongevalscodes
                          </h3>
                          <p className="mt-1 text-sm leading-6 text-slate-600">
                            Zoek op code of
                            omschrijving. De
                            slachtoffergegevens
                            worden bovenaan beheerd.
                          </p>
                        </div>

                        <span className="inline-flex w-fit rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
                          EAO-layout
                        </span>
                      </div>

                      <div className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700">
                        Het betreft het ongeval van{" "}
                        <strong>
                          {[
                            slachtofferVoornaam,
                            slachtofferNaam,
                          ]
                            .filter((deel) =>
                              deel.trim(),
                            )
                            .join(" ") ||
                            "het slachtoffer"}
                        </strong>
                        , d.d.{" "}
                        <strong>
                          {ongevalsdatum ||
                            "datum nog invullen"}
                        </strong>
                        .
                      </div>

                      <div className="mt-5 grid gap-5">
                        <EaoCodeVeld
                          key={`afwijkende-${geselecteerdeInbreuk.id}`}
                          id="afwijkende-gebeurtenis"
                          label="Afwijkende gebeurtenis"
                          waarde={
                            afwijkendeGebeurtenisCode
                          }
                          opties={
                            afwijkendeGebeurtenissen
                          }
                          onChange={
                            setAfwijkendeGebeurtenisCode
                          }
                        />

                        <EaoCodeVeld
                          key={`voorwerp-${geselecteerdeInbreuk.id}`}
                          id="betrokken-voorwerp"
                          label="Betrokken voorwerp"
                          waarde={
                            betrokkenVoorwerpCode
                          }
                          opties={
                            betrokkenVoorwerpen
                          }
                          onChange={
                            setBetrokkenVoorwerpCode
                          }
                        />

                        <EaoCodeVeld
                          key={`letsel-${geselecteerdeInbreuk.id}`}
                          id="soort-letsel"
                          label="Soort letsel"
                          waarde={soortLetselCode}
                          opties={soortenLetsel}
                          onChange={
                            setSoortLetselCode
                          }
                        />
                      </div>

                      <p className="mt-5 rounded-lg bg-amber-100 px-3 py-2 text-xs leading-5 text-amber-900">
                        “EAO-relevant” betekent
                        dat de code in een
                        toepasselijke
                        Codex-bijlage voorkomt.
                        De ernst volgt steeds uit
                        de volledige wettelijke
                        combinatie.
                      </p>
                    </section>
                  ) : (
                  <section
                    aria-labelledby="inspectievaststelling-titel"
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          className="h-5 w-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m16.862 3.487 3.651 3.651M5.25 18.75l3.82-.764a2.25 2.25 0 0 0 1.105-.605L19.72 7.836a2.582 2.582 0 1 0-3.652-3.652L6.523 13.73a2.25 2.25 0 0 0-.605 1.105L5.25 18.75Z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14.25 6 18 9.75"
                          />
                        </svg>
                      </div>

                      <div>
                        <h3
                          id="inspectievaststelling-titel"
                          className="text-lg font-bold text-slate-900"
                        >
                          Vaststellingen
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          Voeg per concrete situatie de tekst en eventuele elementen toe.
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-4">
                      {vaststellingen.map(
                        (vaststelling, index) => {
                          const geselecteerdAantal =
                            vaststelling
                              .geselecteerdeSpecifiekeElementIds
                              .length +
                            vaststelling.eigenElementen.filter(
                              (element) =>
                                element.trim(),
                            ).length;

                          return (
                            <article
                              key={vaststelling.id}
                              className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <h4 className="text-sm font-bold text-slate-900">
                                  Vaststelling {index + 1}
                                </h4>

                                {vaststellingen.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      verwijderVaststelling(
                                        vaststelling.id,
                                      )
                                    }
                                    className="text-xs font-semibold text-red-600 transition hover:text-red-800"
                                  >
                                    Verwijderen
                                  </button>
                                )}
                              </div>

                              {geselecteerdeInbreuk
                                ?.specifiekeElementenAlsSituering ? (
                                <p className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm leading-6 text-blue-800">
                                  De gekozen elementen vormen deze vaststelling.
                                </p>
                              ) : (
                                <label className="mt-3 block">
                                  <span className="sr-only">
                                    Tekst vaststelling {index + 1}
                                  </span>
                                  <textarea
                                    value={vaststelling.tekst}
                                    onChange={(event) =>
                                      wijzigVaststellingTekst(
                                        vaststelling.id,
                                        event.target.value,
                                      )
                                    }
                                    rows={4}
                                    placeholder="Optioneel: beschrijf wat concreet werd vastgesteld."
                                    className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 leading-7 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                                  />
                                </label>
                              )}

                              {geselecteerdeInbreuk &&
                                geselecteerdeInbreuk
                                  .specifiekeElementen.length >
                                  0 && (
                                  <div className="mt-4 border-t border-slate-200 pt-4">
                                    <div className="flex items-center justify-between gap-3">
                                      <p className="text-sm font-bold text-slate-800">
                                        Voorgedefinieerde elementen
                                      </p>
                                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                        {geselecteerdAantal} gekozen
                                      </span>
                                    </div>

                                    <div className="mt-3 grid gap-2">
                                      {geselecteerdeInbreuk.specifiekeElementen.map(
                                        (element) => {
                                          const isGeselecteerd =
                                            vaststelling
                                              .geselecteerdeSpecifiekeElementIds
                                              .includes(
                                                element.id,
                                              );

                                          return (
                                            <label
                                              key={element.id}
                                              className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition ${
                                                isGeselecteerd
                                                  ? "border-blue-300 bg-blue-50"
                                                  : "border-slate-200 bg-white hover:border-slate-300"
                                              }`}
                                            >
                                              <input
                                                type="checkbox"
                                                checked={isGeselecteerd}
                                                onChange={(event) =>
                                                  wijzigSpecifiekElement(
                                                    vaststelling.id,
                                                    element.id,
                                                    event.target.checked,
                                                  )
                                                }
                                                className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                              />
                                              <span className="text-sm font-medium leading-6 text-slate-800">
                                                {element.tekst}
                                              </span>
                                            </label>
                                          );
                                        },
                                      )}
                                    </div>
                                  </div>
                                )}

                              {geselecteerdeInbreuk
                                ?.eigenElementenToegestaan && (
                                <div className="mt-4 border-t border-slate-200 pt-4">
                                  <div className="space-y-2">
                                    {vaststelling.eigenElementen.map(
                                      (element, elementIndex) => (
                                        <div
                                          key={`${vaststelling.id}-eigen-${elementIndex}`}
                                          className="flex items-center gap-2"
                                        >
                                          <span
                                            aria-hidden="true"
                                            className="text-slate-900"
                                          >
                                            ▪
                                          </span>
                                          <input
                                            type="text"
                                            value={element}
                                            maxLength={1000}
                                            onChange={(event) =>
                                              wijzigEigenElement(
                                                vaststelling.id,
                                                elementIndex,
                                                event.target.value,
                                              )
                                            }
                                            placeholder="Eigen element ter plaatse"
                                            className="min-h-10 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                                          />
                                          <button
                                            type="button"
                                            aria-label={`Verwijder vrij element ${elementIndex + 1}`}
                                            onClick={() =>
                                              verwijderEigenElement(
                                                vaststelling.id,
                                                elementIndex,
                                              )
                                            }
                                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                                          >
                                            ×
                                          </button>
                                        </div>
                                      ),
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      voegEigenElementToe(
                                        vaststelling.id,
                                      )
                                    }
                                    className="mt-3 text-sm font-semibold text-blue-700 transition hover:text-blue-900"
                                  >
                                    + Eigen element toevoegen
                                  </button>
                                </div>
                              )}
                            </article>
                          );
                        },
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={voegVaststellingToe}
                      className="mt-4 inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
                    >
                      <span aria-hidden="true">+</span>
                      Nieuwe vaststelling
                    </button>
                  </section>
                  )}

                  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div>
                    <label
                      htmlFor="fotos"
                      className="block text-sm font-medium text-slate-700"
                    >
                      Foto’s bij deze inbreuk
                    </label>

                    <input
                      id="fotos"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(event) =>
                        behandelFotos(
                          event.target.files,
                        )
                      }
                      className="mt-2 block min-w-0 max-w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-700"
                    />

                    {fotos.length > 0 && (
                      <div className="mt-3 rounded-lg bg-slate-50 p-4">
                        <p className="text-sm font-medium text-slate-700">
                          Geselecteerde foto’s:
                        </p>

                        <ul className="mt-2 space-y-2 text-sm text-slate-600">
                          {fotos.map(
                            (foto, index) => (
                              <li
                                key={`${foto.id}-${index}`}
                                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2"
                              >
                                <span className="min-w-0 break-all">
                                  {foto.naam}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    verwijderFoto(foto.id)
                                  }
                                  aria-label={`Verwijder foto ${foto.naam}`}
                                  className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 hover:text-red-800"
                                >
                                  Verwijderen
                                </button>
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                    )}

                    <p className="mt-2 text-sm text-slate-500">
                      Voeg maximaal twee foto’s toe. Deze foto’s horen
                      uitsluitend bij deze
                      concrete inbreuk. In het
                      Word-verslag worden ze
                      naast elkaar onder de vaststellingen geplaatst.
                    </p>
                    </div>
                  </section>

                  {exportFout && (
                    <p
                      role="alert"
                      className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
                    >
                      {exportFout}
                    </p>
                  )}

                  <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row">
                    <button
                      type="submit"
                      className="w-full rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800 sm:w-auto"
                    >
                      Inbreuk bijwerken
                    </button>

                    <button
                      type="button"
                      onClick={sluitBewerkvenster}
                      className="w-full rounded-lg border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
                    >
                      Annuleren
                    </button>

                    <button
                      type="button"
                      onClick={verwijderInbreuk}
                      className="w-full rounded-lg border border-red-300 px-6 py-3 font-semibold text-red-700 hover:bg-red-50 sm:ml-auto sm:w-auto"
                    >
                      Inbreuk verwijderen
                    </button>
                  </div>
                </form>
                </div>
              </>
            )}
          </section>
        </div>

        <footer
          aria-label="Inspectieacties"
          className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/90 shadow-[0_-10px_30px_rgba(15,23,42,0.12)] backdrop-blur"
        >
          <div className="mx-auto flex w-full max-w-7xl flex-col items-stretch gap-2 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 sm:px-6">
            {exportFout && (
              <p
                role="alert"
                className="text-center text-sm font-medium text-red-700 sm:text-right"
              >
                {exportFout}
              </p>
            )}

            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <p className="text-center text-[10px] tracking-wide text-slate-400 sm:text-left sm:text-xs">
                Ontworpen door{" "}
                <span className="font-medium text-slate-500">
                  Bart Degroote
                </span>
              </p>

              <div className="grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                {opslagStatus && (
                  <span className="col-span-2 text-center text-sm font-medium text-slate-500 sm:text-left">
                    {opslagStatus}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => void slaDossierOp()}
                  className="w-full rounded-lg bg-blue-700 px-3 py-3 text-sm font-semibold text-white hover:bg-blue-800 sm:w-auto sm:px-6 sm:text-base"
                >
                  <span className="sm:hidden">
                    Opslaan
                  </span>
                  <span className="hidden sm:inline">
                    Inspectie opslaan
                  </span>
                </button>
                <button
                  type="button"
                  onClick={genereerWordVerslag}
                  disabled={
                    (inbreuken.length === 0 &&
                      !ernstigArbeidsongeval) ||
                    exportBezig
                  }
                  className="w-full rounded-lg bg-emerald-700 px-3 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto sm:px-6 sm:text-base"
                >
                  {exportBezig
                    ? (
                        <>
                          <span className="sm:hidden">
                            Word maken…
                          </span>
                          <span className="hidden sm:inline">
                            Word-verslag wordt gemaakt...
                          </span>
                        </>
                      )
                    : (
                        <>
                          <span className="sm:hidden">
                            Word
                          </span>
                          <span className="hidden sm:inline">
                            Word-verslag genereren
                          </span>
                        </>
                      )}
                </button>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
