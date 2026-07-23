"use client";

import {
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";

import {
  bewaarInspectie,
  type OngevalsgegevensInput,
  type OpgeslagenInbreukInput,
} from "@/app/inspecties/actions";
import AppBalk from "@/app/componenten/AppBalk";

import type {
  Standaardinbreuk,
  TekstSegment,
} from "@/bibliotheek";
import {
  isVerborgenAfdeling,
  isWelzijnswet,
} from "@/bibliotheek/welzijnswet";
import TekstMetOpmaak from "@/app/bibliotheek/TekstMetOpmaak";
import {
  downloadWordVerslag,
  type WordFoto,
  type WordInbreuk,
} from "@/lib/word-export";
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

export type InspectieFoto = {
  id: string;
  naam: string;
  url?: string;
  bestand?: File;
};

export type Inbreuk = {
  id: string;
  standaardinbreukId: string;
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
  fotos: InspectieFoto[];
};

type InspectieUitvoerenClientProps = {
  inspectieId: string;
  onderneming: string;
  adres: string;
  inspectiedatum: string;
  inspecteur: string;
  flow: string;
  initialOngevalsgegevens: OngevalsgegevensInput;
  wetgevingen: WetgevingOptie[];
  boeken: BoekOptie[];
  titels: TitelOptie[];
  standaardinbreuken: Standaardinbreuk[];
  initialInbreuken: Inbreuk[];
};

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

  const [inCasu, setInCasu] =
    useState("");

  const [
    wettelijkeVerwijzing,
    setWettelijkeVerwijzing,
  ] = useState("");

  const [fotos, setFotos] =
    useState<InspectieFoto[]>([]);

  const [opslagStatus, setOpslagStatus] = useState("");

  const [
    geselecteerdeSpecifiekeElementIds,
    setGeselecteerdeSpecifiekeElementIds,
  ] = useState<string[]>([]);

  const [wetgevingFilter, setWetgevingFilter] =
    useState("");

  const [boekFilter, setBoekFilter] =
    useState("");

  const [titelFilter, setTitelFilter] =
    useState("");

  const [zoekterm, setZoekterm] =
    useState("");

  const [exportBezig, setExportBezig] =
    useState(false);

  const [exportFout, setExportFout] =
    useState("");

  const [
    ernstigArbeidsongeval,
    setErnstigArbeidsongeval,
  ] = useState(
    initialOngevalsgegevens.ernstigArbeidsongeval,
  );

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

  const [werkpostBezocht, setWerkpostBezocht] =
    useState<boolean | null>(
      initialOngevalsgegevens.werkpostBezocht,
    );

  const bewerkFormulierRef =
    useRef<HTMLDivElement | null>(null);

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

  const welzijnswetGeselecteerd =
    isWelzijnswet(wetgevingFilter);
  const eersteNiveauLabel = wetgevingFilter
    ? welzijnswetGeselecteerd
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
          wetgevingNaamPerId.get(
            inbreuk.wetgevingId,
          ) ?? "",
          boekNaamPerId.get(inbreuk.boekId) ?? "",
          isVerborgenAfdeling(inbreuk.titelId)
            ? ""
            : (titelPerId.get(inbreuk.titelId)?.naam ?? ""),
          isWelzijnswet(inbreuk.wetgevingId)
            ? ""
            : inbreuk.onderwerp,
          inbreuk.omschrijving,
          inbreuk.situering ?? "",
          ...inbreuk.specifiekeElementen.map(
            (element) => element.tekst,
          ),
          inbreuk.toelichting ?? "",
          inbreuk.aanvulling ?? "",
          inbreuk.wettelijkeVerwijzing,
          ...inbreuk.kernwoorden,
        ]
          .join(" ")
          .toLowerCase(),
      ]),
    );
  }, [
    standaardinbreuken,
    wetgevingNaamPerId,
    boekNaamPerId,
    titelPerId,
  ]);

  const geselecteerdeInbreuk = useMemo(
    () =>
      inbreuken.find(
        (inbreuk) =>
          inbreuk.id === geselecteerdeId,
      ) ?? null,
    [inbreuken, geselecteerdeId],
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
          juisteZoekterm
        );
      },
    );
  }, [
    standaardinbreuken,
    wetgevingFilter,
    boekFilter,
    titelFilter,
    zoekterm,
    zoektekstPerInbreukId,
  ]);

  function maakFormulierLeeg() {
    setGeselecteerdeId(null);
    setBeschrijving("");
    setInCasu("");
    setWettelijkeVerwijzing("");
    setGeselecteerdeSpecifiekeElementIds([]);
    setFotos([]);
  }

  function scrollNaarBewerkFormulier() {
    if (
      typeof window === "undefined" ||
      !window.matchMedia("(max-width: 1023px)")
        .matches
    ) {
      return;
    }

    window.requestAnimationFrame(() => {
      bewerkFormulierRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  function huidigeOngevalsgegevens(): OngevalsgegevensInput {
    return {
      ernstigArbeidsongeval,
      slachtofferVoornaam,
      slachtofferNaam,
      ongevalsdatum,
      slachtofferWerkHervat,
      werkpostBezocht,
    };
  }

  function startNieuweInbreuk() {
    maakFormulierLeeg();
    setWetgevingFilter("");
    setBoekFilter("");
    setTitelFilter("");
    setZoekterm("");
  }

  function voegStandaardinbreukToe(
    standaard: Standaardinbreuk,
  ) {
    const nieuweInbreuk: Inbreuk = {
      id: maakTijdelijkId(),
      standaardinbreukId: standaard.id,
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
      fotos: [],
    };

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
    setInCasu(nieuweInbreuk.inCasu);
    setWettelijkeVerwijzing(
      nieuweInbreuk.wettelijkeVerwijzing,
    );
    setGeselecteerdeSpecifiekeElementIds([]);
    setFotos([]);
    setExportFout("");
    scrollNaarBewerkFormulier();
  }

  function selecteerInbreuk(
    inbreuk: Inbreuk,
  ) {
    setGeselecteerdeId(inbreuk.id);
    setBeschrijving(inbreuk.beschrijving);
    setInCasu(inbreuk.inCasu);
    setWettelijkeVerwijzing(
      inbreuk.wettelijkeVerwijzing,
    );
    setGeselecteerdeSpecifiekeElementIds(
      inbreuk.geselecteerdeSpecifiekeElementIds,
    );
    setFotos(inbreuk.fotos);
    setExportFout("");
    scrollNaarBewerkFormulier();
  }

  function behandelFotos(
    bestanden: FileList | null,
  ) {
    if (!bestanden) {
      return;
    }

    setFotos(
      Array.from(bestanden).map((bestand) => ({
        id: maakTijdelijkId(),
        naam: bestand.name,
        bestand,
      })),
    );
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
          bewaardeFotoIds: inbreuk.fotos
            .filter((foto) => Boolean(foto.url))
            .map((foto) => foto.id),
        }));

      await bewaarInspectie(
        inspectieId,
        invoer,
        huidigeOngevalsgegevens(),
      );

      const opgeslagen = await Promise.all(
        gesorteerdeInbreuken.map(async (inbreuk) => {
          const opgeslagenFotos = await Promise.all(
            inbreuk.fotos.map(async (foto) => {
              if (!foto.bestand) {
                return foto;
              }

              const formData = new FormData();
              formData.set("foto", await maakCompacteUpload(foto.bestand));
              const response = await fetch(
                `/api/inspecties/${inspectieId}/inbreuken/${inbreuk.id}/fotos`,
                { method: "POST", body: formData },
              );

              if (!response.ok) {
                const resultaat = (await response.json()) as { fout?: string };
                throw new Error(resultaat.fout ?? "Foto opslaan mislukt.");
              }

              return (await response.json()) as InspectieFoto;
            }),
          );

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
    elementId: string,
    geselecteerd: boolean,
  ) {
    setGeselecteerdeSpecifiekeElementIds(
      (huidigeIds) =>
        geselecteerd
          ? [...new Set([...huidigeIds, elementId])]
          : huidigeIds.filter(
              (id) => id !== elementId,
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
          inCasu,
          wettelijkeVerwijzing,
          geselecteerdeSpecifiekeElementIds,
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
    await slaDossierOp(actueel);

    setExportFout("");
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
        !ongevalsdatum ||
        werkHervat === null ||
        werkpostIsBezocht === null)
    ) {
      setExportFout(
        "Vul alle gegevens over het ernstig arbeidsongeval in.",
      );
      return;
    }

    setExportBezig(true);
    setExportFout("");

    try {
      const actueleInbreuken =
        synchroniseerFormulier(inbreuken);

      setInbreuken(actueleInbreuken);

      const opgeslagenInbreuken = await slaDossierOp(actueleInbreuken);

      if (!opgeslagenInbreuken) {
        return;
      }

      const wordInbreuken: WordInbreuk[] =
        await Promise.all(
          opgeslagenInbreuken.map(
            async (inbreuk) => ({
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
            }),
          ),
        );

      await downloadWordVerslag({
        onderneming,
        adres,
        inspectiedatum,
        inspecteur,
        flow,
        inbreuken: wordInbreuken,
        ernstigArbeidsongeval:
          ernstigArbeidsongeval &&
          werkHervat !== null &&
          werkpostIsBezocht !== null
            ? {
                slachtofferVoornaam,
                slachtofferNaam,
                ongevalsdatum,
                slachtofferWerkHervat:
                  werkHervat,
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

  return (
    <main className="tww-canvas min-h-screen">
      <div className="mx-auto max-w-7xl px-4 pb-32 pt-4 sm:px-6 sm:pt-6 lg:pb-6">
        <AppBalk terugHref="/inspecties" terugLabel="Inspecties" />

        <header className="mt-5 rounded-2xl border border-white bg-white/95 p-4 shadow-[0_14px_45px_rgba(15,23,42,0.07)] sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
                Inspectie uitvoeren
              </h1>

              <p className="mt-1 text-slate-600">
                Zoek een standaardinbreuk en voeg
                de concrete vaststelling toe.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[29rem]">
              <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white px-5 py-4">
                <p className="text-sm text-blue-700">
                  Flow
                </p>

                <p className="text-xl font-bold text-blue-950">
                  {flow || "Niet ingevuld"}
                </p>
              </div>

              <button
                type="button"
                aria-pressed={
                  ernstigArbeidsongeval
                }
                onClick={() => {
                  setErnstigArbeidsongeval(
                    (huidigeWaarde) =>
                      !huidigeWaarde,
                  );
                  setExportFout("");
                }}
                className={`flex min-h-20 items-center gap-3 rounded-xl border px-4 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-amber-300 ${
                  ernstigArbeidsongeval
                    ? "border-amber-500 bg-amber-100 text-amber-950 shadow-sm"
                    : "border-slate-200 bg-white text-slate-700 hover:border-amber-300 hover:bg-amber-50"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
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
                </span>

                <span className="min-w-0">
                  <span className="block text-sm font-bold">
                    Ernstig arbeidsongeval
                  </span>
                  <span className="mt-0.5 block text-xs opacity-75">
                    {ernstigArbeidsongeval
                      ? "Opgenomen in verslag"
                      : "Toevoegen aan verslag"}
                  </span>
                </span>
              </button>
            </div>
          </div>

          <dl className="mt-6 grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-sm text-slate-500">
                Onderneming
              </dt>

              <dd className="break-words font-medium text-slate-900">
                {onderneming || "Niet ingevuld"}
              </dd>
            </div>

            <div>
              <dt className="text-sm text-slate-500">
                Adres
              </dt>

              <dd className="break-words font-medium text-slate-900">
                {adres || "Niet ingevuld"}
              </dd>
            </div>

            <div>
              <dt className="text-sm text-slate-500">
                Inspectiedatum
              </dt>

              <dd className="break-words font-medium text-slate-900">
                {inspectiedatum || "Niet ingevuld"}
              </dd>
            </div>

            <div>
              <dt className="text-sm text-slate-500">
                Inspecteur
              </dt>

              <dd className="break-words font-medium text-slate-900">
                {inspecteur || "Niet ingevuld"}
              </dd>
            </div>
          </dl>

          {ernstigArbeidsongeval && (
            <section
              aria-labelledby="ongevalsgegevens-titel"
              className="mt-5 overflow-hidden rounded-xl border border-amber-300 bg-amber-50"
            >
              <div className="border-b border-amber-200 px-4 py-3 sm:px-5">
                <h2
                  id="ongevalsgegevens-titel"
                  className="font-bold text-amber-950"
                >
                  Gegevens ernstig arbeidsongeval
                </h2>
                <p className="mt-1 text-sm text-amber-800">
                  Deze gegevens verschijnen als
                  afzonderlijke hoofding onderaan
                  het Word-verslag.
                </p>
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
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {[true, false].map((waarde) => (
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
                        {waarde ? "Ja" : "Nee"}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="sm:col-span-1 lg:col-span-2">
                  <legend className="text-sm font-semibold text-slate-700">
                    Werkpost van het ongeval bezocht?
                  </legend>
                  <div className="mt-2 grid max-w-sm grid-cols-2 gap-2">
                    {[true, false].map((waarde) => (
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
                        {waarde ? "Ja" : "Nee"}
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
              + Lege inbreuk toevoegen
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
                          <span className="block text-sm font-semibold text-slate-900">
                            Inbreuk {index + 1}
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
                    ? "lg:grid-cols-4"
                    : "lg:grid-cols-2"
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
                      }}
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-600"
                    >
                      <option value="">
                        Alle{" "}
                        {welzijnswetGeselecteerd
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

                {wetgevingFilter && (
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
                      onChange={(event) =>
                        setTitelFilter(
                          event.target.value,
                        )
                      }
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
                    placeholder="Bijvoorbeeld: onthaal"
                    className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="mt-6">
                <h3 className="font-semibold text-slate-900">
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
                    {zoekresultaten.map(
                      (inbreuk) => {
                        const wetgevingNaam =
                          wetgevingNaamPerId.get(
                            inbreuk.wetgevingId,
                          ) ??
                          "Onbekende wetgeving";

                        const boekNaam =
                          boekNaamPerId.get(
                            inbreuk.boekId,
                          ) ?? "Onbekend boek";

                        const titel =
                          titelPerId.get(
                            inbreuk.titelId,
                          );
                        const toonTitel =
                          !isVerborgenAfdeling(
                            inbreuk.titelId,
                          );

                        const compacteWettelijkeVerwijzing =
                          maakCompacteWettelijkeVerwijzing(
                            wetgevingNaam,
                            inbreuk.wettelijkeVerwijzing,
                          );

                        return (
                          <div
                            key={inbreuk.id}
                            className="rounded-lg border border-slate-200 p-4"
                          >
                            <p className="flex min-w-0 flex-col items-start gap-1 text-xs font-medium uppercase tracking-wide text-slate-500 sm:flex-row sm:items-center sm:gap-3">
                              <span className="min-w-0 max-w-full truncate sm:flex-1">
                                {wetgevingNaam} ·{" "}
                                {boekNaam}
                                {titel &&
                                toonTitel
                                  ? ` · ${titel.naam}`
                                  : ""}
                              </span>

                              <span className="shrink-0 font-semibold normal-case tracking-normal text-slate-700">
                                {
                                  compacteWettelijkeVerwijzing
                                }
                              </span>
                            </p>

                            <TekstMetOpmaak
                              tekst={
                                inbreuk.omschrijving
                              }
                              segmenten={
                                inbreuk.omschrijvingOpmaak
                              }
                              className="mt-2 block"
                            />

                            {inbreuk.kernwoorden
                              .length > 0 && (
                              <p className="mt-2 text-sm text-slate-500">
                                Kernwoorden:{" "}
                                {inbreuk.kernwoorden.join(
                                  ", ",
                                )}
                              </p>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                voegStandaardinbreukToe(
                                  inbreuk,
                                )
                              }
                              className="mt-4 w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800 sm:w-auto sm:py-2"
                            >
                              + Toevoegen aan
                              inspectie
                            </button>
                          </div>
                        );
                      },
                    )}
                  </div>
                )}
              </div>
            </div>

            <div
              ref={bewerkFormulierRef}
              className="min-w-0 scroll-mt-4 rounded-2xl border border-white bg-white/95 p-4 shadow-[0_12px_38px_rgba(15,23,42,0.07)] sm:p-8"
            >
              <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                {geselecteerdeId === null
                  ? "Selecteer eerst een standaardinbreuk"
                  : "Inbreuk bewerken"}
              </h2>

              {geselecteerdeId === null ? (
                <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <p className="font-medium text-slate-700">
                    Zoek hierboven een
                    standaardinbreuk.
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    Klik op “Toevoegen aan
                    inspectie” om de inbreuk te
                    registreren.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={bewaarWijzigingen}
                  className="mt-8 space-y-8"
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

                      <div>
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
                    </div>

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

                  <section
                    aria-labelledby="inspectievaststelling-titel"
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                  >
                    <div className="mb-6 flex items-start gap-4">
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
                          Situering
                        </h3>

                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          {geselecteerdeInbreuk
                            ?.specifiekeElementenAlsSituering
                            ? "Selecteer de elementen die samen de situering vormen."
                            : "Beschrijf de concrete situering zoals vastgesteld tijdens de inspectie."}
                        </p>
                      </div>
                    </div>

                    {geselecteerdeInbreuk
                      ?.specifiekeElementenAlsSituering ? (
                      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-800">
                        De geselecteerde elementen vormen samen de situering.
                      </div>
                    ) : (
                      <div>
                        <label
                          htmlFor="inCasu"
                          className="block text-sm font-semibold text-slate-700"
                        >
                          Situering
                        </label>

                        <textarea
                          id="inCasu"
                          value={inCasu}
                          onChange={(event) =>
                            setInCasu(
                              event.target.value,
                            )
                          }
                          rows={7}
                          placeholder="Beschrijf de situering tijdens de inspectie."
                          required
                          className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 leading-7 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                        />

                        <p className="mt-2 text-sm text-slate-500">
                          Vermeld feitelijke, controleerbare elementen en de plaats waarop de situering betrekking heeft.
                        </p>
                      </div>
                    )}

                    {geselecteerdeInbreuk &&
                      geselecteerdeInbreuk
                        .specifiekeElementen.length > 0 && (
                        <div className="mt-6 border-t border-slate-200 pt-6">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <h4 className="text-sm font-bold text-slate-800">
                                Specifieke elementen
                              </h4>
                              <p className="mt-1 text-sm leading-6 text-slate-500">
                                Duid aan welke vooraf gedefinieerde vaststellingen in deze inbreuk moeten worden opgenomen.
                              </p>
                            </div>

                            <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                              {
                                geselecteerdeSpecifiekeElementIds.length
                              }{" "}
                              geselecteerd
                            </span>
                          </div>

                          <div className="mt-4 grid gap-3">
                            {geselecteerdeInbreuk.specifiekeElementen.map(
                              (element) => {
                                const isGeselecteerd =
                                  geselecteerdeSpecifiekeElementIds.includes(
                                    element.id,
                                  );

                                return (
                                  <label
                                    key={element.id}
                                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                                      isGeselecteerd
                                        ? "border-blue-300 bg-blue-50 ring-2 ring-blue-100"
                                        : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={
                                        isGeselecteerd
                                      }
                                      onChange={(event) =>
                                        wijzigSpecifiekElement(
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
                  </section>

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

                        <ul className="mt-2 space-y-1 text-sm text-slate-600">
                          {fotos.map(
                            (foto, index) => (
                              <li
                                key={`${foto.id}-${index}`}
                                className="break-all"
                              >
                                {foto.naam}
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                    )}

                    <p className="mt-2 text-sm text-slate-500">
                      Deze foto’s horen
                      uitsluitend bij deze
                      concrete inbreuk. In het
                      Word-verslag worden ze
                      onder de situering geplaatst
                      met een vaste hoogte van
                      5 cm.
                    </p>
                    </div>
                  </section>

                  <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row">
                    <button
                      type="submit"
                      className="w-full rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800 sm:w-auto"
                    >
                      Inbreuk bijwerken
                    </button>

                    <button
                      type="button"
                      onClick={verwijderInbreuk}
                      className="w-full rounded-lg border border-red-300 px-6 py-3 font-semibold text-red-700 hover:bg-red-50 sm:w-auto"
                    >
                      Inbreuk verwijderen
                    </button>
                  </div>
                </form>
              )}
            </div>
          </section>
        </div>

        <footer className="fixed inset-x-0 bottom-0 z-20 mt-6 flex flex-col items-stretch gap-3 border-t border-slate-200 bg-white/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-10px_30px_rgba(15,23,42,0.1)] backdrop-blur lg:static lg:items-end lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:shadow-none">
          {exportFout && (
            <p
              role="alert"
              className="text-sm font-medium text-red-700"
            >
              {exportFout}
            </p>
          )}

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
        </footer>
      </div>
    </main>
  );
}
