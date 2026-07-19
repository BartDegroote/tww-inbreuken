"use client";

import Link from "next/link";
import {
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  bewaarInspectie,
  type OpgeslagenInbreukInput,
} from "@/app/inspecties/actions";

import type {
  Standaardinbreuk,
  TekstSegment,
} from "@/bibliotheek";
import TekstMetOpmaak from "@/app/bibliotheek/TekstMetOpmaak";
import {
  downloadWordVerslag,
  type WordFoto,
  type WordInbreuk,
} from "@/lib/word-export";

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
  fotos: InspectieFoto[];
};

type InspectieUitvoerenClientProps = {
  inspectieId: string;
  onderneming: string;
  adres: string;
  inspectiedatum: string;
  inspecteur: string;
  flow: string;
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

export default function InspectieUitvoerenClient({
  inspectieId,
  onderneming,
  adres,
  inspectiedatum,
  inspecteur,
  flow,
  wetgevingen,
  boeken,
  titels,
  standaardinbreuken,
  initialInbreuken,
}: InspectieUitvoerenClientProps) {
  const [inbreuken, setInbreuken] =
    useState<Inbreuk[]>(initialInbreuken);

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
    if (!boekFilter) {
      return titels;
    }

    return titels.filter(
      (titel) => titel.boekId === boekFilter,
    );
  }, [titels, boekFilter]);

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

        const wetgevingNaam =
          wetgevingNaamPerId.get(
            inbreuk.wetgevingId,
          ) ?? "";

        const boekNaam =
          boekNaamPerId.get(
            inbreuk.boekId,
          ) ?? "";

        const titel =
          titelPerId.get(inbreuk.titelId);

        const zoekbareTekst = [
          wetgevingNaam,
          boekNaam,
          titel?.naam ?? "",
          inbreuk.onderwerp,
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
          .toLowerCase();

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
    wetgevingNaamPerId,
    boekNaamPerId,
    titelPerId,
  ]);

  function maakFormulierLeeg() {
    setGeselecteerdeId(null);
    setBeschrijving("");
    setInCasu("");
    setWettelijkeVerwijzing("");
    setGeselecteerdeSpecifiekeElementIds([]);
    setFotos([]);
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
      inCasu: standaard.situering ?? "",
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
      fotos: [],
    };

    setInbreuken((huidigeInbreuken) => [
      ...huidigeInbreuken,
      nieuweInbreuk,
    ]);

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
      const invoer: OpgeslagenInbreukInput[] = teBewaren.map((inbreuk) => ({
        id: inbreuk.id,
        standaardinbreukId: inbreuk.standaardinbreukId,
        beschrijving: inbreuk.beschrijving,
        beschrijvingOpmaak: inbreuk.beschrijvingOpmaak,
        inCasu: inbreuk.inCasu,
        toelichting: inbreuk.toelichting,
        aanvulling: inbreuk.aanvulling,
        aanvullingOpmaak: inbreuk.aanvullingOpmaak,
        wettelijkeVerwijzing: inbreuk.wettelijkeVerwijzing,
        specifiekeElementen: inbreuk.specifiekeElementen,
        geselecteerdeSpecifiekeElementIds:
          inbreuk.geselecteerdeSpecifiekeElementIds,
        bewaardeFotoIds: inbreuk.fotos
          .filter((foto) => Boolean(foto.url))
          .map((foto) => foto.id),
      }));

      await bewaarInspectie(inspectieId, invoer);

      const opgeslagen = await Promise.all(
        teBewaren.map(async (inbreuk) => {
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
      return huidigeInbreuken;
    }

    return huidigeInbreuken.map((inbreuk) => {
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
    });
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
    if (inbreuken.length === 0 || exportBezig) {
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
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <header className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Link
                href="/"
                className="text-sm font-medium text-blue-700 hover:underline"
              >
                ← Terug naar dashboard
              </Link>

              <h1 className="mt-3 text-3xl font-bold text-slate-900">
                Inspectie uitvoeren
              </h1>

              <p className="mt-1 text-slate-600">
                Zoek een standaardinbreuk en voeg
                de concrete vaststelling toe.
              </p>
            </div>

            <div className="rounded-lg bg-blue-50 px-5 py-4">
              <p className="text-sm text-blue-700">
                Flow
              </p>

              <p className="text-xl font-bold text-blue-950">
                {flow || "Niet ingevuld"}
              </p>
            </div>
          </div>

          <dl className="mt-6 grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-sm text-slate-500">
                Onderneming
              </dt>

              <dd className="font-medium text-slate-900">
                {onderneming || "Niet ingevuld"}
              </dd>
            </div>

            <div>
              <dt className="text-sm text-slate-500">
                Adres
              </dt>

              <dd className="font-medium text-slate-900">
                {adres || "Niet ingevuld"}
              </dd>
            </div>

            <div>
              <dt className="text-sm text-slate-500">
                Inspectiedatum
              </dt>

              <dd className="font-medium text-slate-900">
                {inspectiedatum || "Niet ingevuld"}
              </dd>
            </div>

            <div>
              <dt className="text-sm text-slate-500">
                Inspecteur
              </dt>

              <dd className="font-medium text-slate-900">
                {inspecteur || "Niet ingevuld"}
              </dd>
            </div>
          </dl>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="rounded-xl bg-white p-5 shadow-sm">
            <button
              type="button"
              onClick={startNieuweInbreuk}
              className="w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800"
            >
              + Nieuwe inbreuk
            </button>

            <div className="mt-6">
              <h2 className="font-semibold text-slate-900">
                Inbreuken ({inbreuken.length})
              </h2>

              {inbreuken.length === 0 ? (
                <p className="mt-3 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                  Er zijn nog geen inbreuken
                  toegevoegd.
                </p>
              ) : (
                <ol className="mt-3 space-y-2">
                  {inbreuken.map(
                    (inbreuk, index) => (
                      <li key={inbreuk.id}>
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

          <section className="space-y-6">
            <div className="rounded-xl bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-2xl font-bold text-slate-900">
                Standaardinbreuk zoeken
              </h2>

              <p className="mt-1 text-slate-600">
                De gegevens worden uit de
                centrale bibliotheek geladen.
              </p>

              <div className="mt-6 grid gap-4 lg:grid-cols-4">
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

                <div>
                  <label
                    htmlFor="boek"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Boek
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
                      Alle boeken
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

                <div>
                  <label
                    htmlFor="titel"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Titel
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
                      Alle titels
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

                        return (
                          <div
                            key={inbreuk.id}
                            className="rounded-lg border border-slate-200 p-4"
                          >
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                              {wetgevingNaam} ·{" "}
                              {boekNaam}
                              {titel
                                ? ` · ${titel.naam}`
                                : ""}
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
                              className="mt-4 rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800"
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

            <div className="rounded-xl bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-2xl font-bold text-slate-900">
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
                          Beschrijf de concrete situering zoals vastgesteld tijdens de inspectie.
                        </p>
                      </div>
                    </div>

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
                      className="mt-2 block w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-700"
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
                      className="rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800"
                    >
                      Wijzigingen bewaren
                    </button>

                    <button
                      type="button"
                      onClick={verwijderInbreuk}
                      className="rounded-lg border border-red-300 px-6 py-3 font-semibold text-red-700 hover:bg-red-50"
                    >
                      Inbreuk verwijderen
                    </button>
                  </div>
                </form>
              )}
            </div>
          </section>
        </div>

        <footer className="mt-6 flex flex-col items-end gap-3">
          {exportFout && (
            <p
              role="alert"
              className="text-sm font-medium text-red-700"
            >
              {exportFout}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3">
            {opslagStatus && (
              <span className="text-sm font-medium text-slate-500">
                {opslagStatus}
              </span>
            )}
            <button
              type="button"
              onClick={() => void slaDossierOp()}
              className="rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800"
            >
              Inspectie opslaan
            </button>
            <button
              type="button"
              onClick={genereerWordVerslag}
              disabled={inbreuken.length === 0 || exportBezig}
              className="rounded-lg bg-emerald-700 px-6 py-3 font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {exportBezig
                ? "Word-verslag wordt gemaakt..."
                : "Word-verslag genereren"}
            </button>
          </div>
        </footer>
      </div>
    </main>
  );
}
