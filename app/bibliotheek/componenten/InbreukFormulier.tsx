"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";

import type {
  Standaardinbreuk,
  TekstSegment,
} from "@/bibliotheek";

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
  onderwerp: string;
  boekId: string;
};

type InbreukFormulierProps = {
  inbreuk: Standaardinbreuk | null;
  wetgevingen: WetgevingOptie[];
  boeken: BoekOptie[];
  titels: TitelOptie[];

  /**
   * Alle reeds gebruikte kernwoorden uit de bibliotheek.
   * Deze prop is voorlopig optioneel zodat bestaande aanroepen
   * van het formulier blijven compileren.
   */
  kernwoordSuggesties?: string[];

  onBewaar: (
    inbreuk: Standaardinbreuk,
  ) => Promise<void>;

  onVerwijder: (
    inbreukId: string,
  ) => Promise<void>;
};

type OpmaakType = "vet" | "donkergrijs";

type BeperkteTeksteditorProps = {
  label: string;
  tekst: string;
  segmenten: TekstSegment[];
  opmaakType: OpmaakType;
  placeholder: string;
  rows?: number;
  verplicht?: boolean;
  disabled?: boolean;
  onChange: (
    tekst: string,
    segmenten: TekstSegment[],
  ) => void;
};

const veldStijl =
  "min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

const tekstvakStijl =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base leading-6 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

const knopStijl =
  "rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50";

function escapeHtml(tekst: string): string {
  return tekst
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function segmentenNaarHtml(
  tekst: string,
  segmenten: TekstSegment[],
  opmaakType: OpmaakType,
): string {
  if (segmenten.length === 0) {
    return escapeHtml(tekst).replaceAll("\n", "<br>");
  }

  return segmenten
    .map((segment) => {
      const inhoud = escapeHtml(
        segment.tekst,
      ).replaceAll("\n", "<br>");

      if (
        opmaakType === "vet" &&
        segment.vet
      ) {
        return `<strong>${inhoud}</strong>`;
      }

      if (
        opmaakType === "donkergrijs" &&
        segment.donkergrijs
      ) {
        return `<span style="color: rgb(71, 85, 105);">${inhoud}</span>`;
      }

      return inhoud;
    })
    .join("");
}

function voegSegmentToe(
  segmenten: TekstSegment[],
  nieuwSegment: TekstSegment,
): void {
  if (!nieuwSegment.tekst) {
    return;
  }

  const vorigSegment =
    segmenten[segmenten.length - 1];

  if (
    vorigSegment &&
    Boolean(vorigSegment.vet) ===
      Boolean(nieuwSegment.vet) &&
    Boolean(vorigSegment.donkergrijs) ===
      Boolean(nieuwSegment.donkergrijs)
  ) {
    vorigSegment.tekst += nieuwSegment.tekst;
    return;
  }

  segmenten.push(nieuwSegment);
}

function leesSegmentenUitEditor(
  editor: HTMLElement,
  opmaakType: OpmaakType,
): TekstSegment[] {
  const segmenten: TekstSegment[] = [];

  function bezoekKnoop(
    knoop: Node,
    geerfdeOpmaak: {
      vet: boolean;
      donkergrijs: boolean;
    },
  ) {
    if (knoop.nodeType === Node.TEXT_NODE) {
      voegSegmentToe(segmenten, {
        tekst: knoop.textContent ?? "",
        ...(geerfdeOpmaak.vet
          ? { vet: true }
          : {}),
        ...(geerfdeOpmaak.donkergrijs
          ? { donkergrijs: true }
          : {}),
      });

      return;
    }

    if (!(knoop instanceof HTMLElement)) {
      return;
    }

    if (knoop.tagName === "BR") {
      voegSegmentToe(segmenten, {
        tekst: "\n",
        ...(geerfdeOpmaak.vet
          ? { vet: true }
          : {}),
        ...(geerfdeOpmaak.donkergrijs
          ? { donkergrijs: true }
          : {}),
      });

      return;
    }

    const stijl = window.getComputedStyle(knoop);

    const isVet =
      geerfdeOpmaak.vet ||
      knoop.tagName === "STRONG" ||
      knoop.tagName === "B" ||
      Number.parseInt(stijl.fontWeight, 10) >= 600;

    const kleur = stijl.color
      .replace(/\s/g, "")
      .toLowerCase();

    const isDonkergrijs =
      geerfdeOpmaak.donkergrijs ||
      kleur === "rgb(71,85,105)" ||
      kleur === "rgba(71,85,105,1)";

    const isBlokelement =
      knoop.tagName === "DIV" ||
      knoop.tagName === "P";

    const aantalSegmentenVoor =
      segmenten.length;

    knoop.childNodes.forEach((kind) => {
      bezoekKnoop(kind, {
        vet:
          opmaakType === "vet"
            ? isVet
            : false,
        donkergrijs:
          opmaakType === "donkergrijs"
            ? isDonkergrijs
            : false,
      });
    });

    if (
      isBlokelement &&
      segmenten.length > aantalSegmentenVoor
    ) {
      const laatste =
        segmenten[segmenten.length - 1];

      if (!laatste.tekst.endsWith("\n")) {
        voegSegmentToe(segmenten, {
          tekst: "\n",
          ...(laatste.vet
            ? { vet: true }
            : {}),
          ...(laatste.donkergrijs
            ? { donkergrijs: true }
            : {}),
        });
      }
    }
  }

  editor.childNodes.forEach((knoop) => {
    bezoekKnoop(knoop, {
      vet: false,
      donkergrijs: false,
    });
  });

  const laatsteSegment =
    segmenten[segmenten.length - 1];

  if (laatsteSegment?.tekst.endsWith("\n")) {
    laatsteSegment.tekst =
      laatsteSegment.tekst.slice(0, -1);

    if (!laatsteSegment.tekst) {
      segmenten.pop();
    }
  }

  return segmenten;
}

function segmentenNaarTekst(
  segmenten: TekstSegment[],
): string {
  return segmenten
    .map((segment) => segment.tekst)
    .join("");
}

function BeperkteTeksteditor({
  label,
  tekst,
  segmenten,
  opmaakType,
  placeholder,
  rows = 6,
  verplicht = false,
  disabled = false,
  onChange,
}: BeperkteTeksteditorProps) {
  const editorRef =
    useRef<HTMLDivElement | null>(null);

  const laatsteVerzondenHtml =
    useRef<string>("");

  const html = useMemo(
    () =>
      segmentenNaarHtml(
        tekst,
        segmenten,
        opmaakType,
      ),
    [tekst, segmenten, opmaakType],
  );

  useEffect(() => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    if (
      editor.innerHTML !== html &&
      laatsteVerzondenHtml.current !== html
    ) {
      editor.innerHTML = html;
    }
  }, [html]);

  function verstuurWijziging() {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    const nieuweSegmenten =
      leesSegmentenUitEditor(
        editor,
        opmaakType,
      );

    const nieuweTekst =
      segmentenNaarTekst(nieuweSegmenten);

    laatsteVerzondenHtml.current =
      editor.innerHTML;

    onChange(
      nieuweTekst,
      nieuweSegmenten,
    );
  }

  function pasOpmaakToe(
    opdracht:
      | "bold"
      | "foreColor"
      | "removeFormat",
  ) {
    const editor = editorRef.current;

    if (!editor || disabled) {
      return;
    }

    editor.focus();

    if (opdracht === "foreColor") {
      document.execCommand(
        "foreColor",
        false,
        "#475569",
      );
    } else {
      document.execCommand(
        opdracht,
        false,
      );
    }

    verstuurWijziging();
  }

  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-700">
          {label}
          {verplicht && (
            <span className="ml-1 text-red-600">
              *
            </span>
          )}
        </span>

        <div className="flex flex-wrap gap-2">
          {opmaakType === "vet" && (
            <button
              type="button"
              className={knopStijl}
              disabled={disabled}
              onMouseDown={(event) =>
                event.preventDefault()
              }
              onClick={() =>
                pasOpmaakToe("bold")
              }
            >
              Vet
            </button>
          )}

          {opmaakType ===
            "donkergrijs" && (
            <button
              type="button"
              className={knopStijl}
              disabled={disabled}
              onMouseDown={(event) =>
                event.preventDefault()
              }
              onClick={() =>
                pasOpmaakToe("foreColor")
              }
            >
              Donkergrijs
            </button>
          )}

          <button
            type="button"
            className={knopStijl}
            disabled={disabled}
            onMouseDown={(event) =>
              event.preventDefault()
            }
            onClick={() =>
              pasOpmaakToe("removeFormat")
            }
          >
            Opmaak wissen
          </button>
        </div>
      </div>

      <div className="relative">
        {!tekst && (
          <span className="pointer-events-none absolute left-3 top-2 text-base text-slate-400">
            {placeholder}
          </span>
        )}

        <div
          ref={editorRef}
          contentEditable={!disabled}
          suppressContentEditableWarning
          role="textbox"
          aria-label={label}
          aria-required={verplicht}
          data-placeholder={placeholder}
          onInput={verstuurWijziging}
          onBlur={verstuurWijziging}
          className={`${tekstvakStijl} overflow-y-auto whitespace-pre-wrap`}
          style={{
            minHeight: `${rows * 1.5 + 1}rem`,
          }}
        />
      </div>

      <p className="mt-1.5 text-xs leading-5 text-slate-500">
        Selecteer tekst en gebruik de
        opmaakknoppen.
      </p>
    </div>
  );
}

function TekstMetOpmaak({
  tekst,
  segmenten,
  opmaakType,
}: {
  tekst: string;
  segmenten: TekstSegment[];
  opmaakType: OpmaakType;
}) {
  if (segmenten.length === 0) {
    return (
      <span className="whitespace-pre-wrap">
        {tekst}
      </span>
    );
  }

  return (
    <>
      {segmenten.map(
        (segment, index) => (
          <span
            key={`${index}-${segment.tekst}`}
            className={[
              "whitespace-pre-wrap",
              segment.vet
                ? "font-semibold"
                : "",
              segment.donkergrijs
                ? "text-slate-600"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {segment.tekst}
          </span>
        ),
      )}
    </>
  );
}

export default function InbreukFormulier({
  inbreuk,
  wetgevingen,
  boeken,
  titels,
  kernwoordSuggesties = [],
  onBewaar,
  onVerwijder,
}: InbreukFormulierProps) {
  const [formulier, setFormulier] =
    useState<Standaardinbreuk | null>(
      inbreuk,
    );

  const [
    kernwoordenTekst,
    setKernwoordenTekst,
  ] = useState("");

  const [
    toonKernwoordSuggesties,
    setToonKernwoordSuggesties,
  ] = useState(false);

  const [opgeslagen, setOpgeslagen] =
    useState(false);

  const [bezig, setBezig] =
    useState(false);

  const [
    foutmelding,
    setFoutmelding,
  ] = useState<string | null>(null);

  useEffect(() => {
    setFormulier(inbreuk);

    setKernwoordenTekst(
      inbreuk?.kernwoorden.join(", ") ?? "",
    );

    setOpgeslagen(false);
    setFoutmelding(null);
    setBezig(false);
    setToonKernwoordSuggesties(false);
  }, [inbreuk]);

  const beschikbareBoeken = useMemo(() => {
    if (!formulier?.wetgevingId) {
      return [];
    }

    return boeken.filter(
      (boek) =>
        boek.wetgevingId ===
        formulier.wetgevingId,
    );
  }, [
    boeken,
    formulier?.wetgevingId,
  ]);

  const beschikbareTitels = useMemo(() => {
    if (!formulier?.boekId) {
      return [];
    }

    return titels.filter(
      (titel) =>
        titel.boekId === formulier.boekId,
    );
  }, [titels, formulier?.boekId]);

  const actiefKernwoord = useMemo(() => {
    const delen =
      kernwoordenTekst.split(",");

    return (
      delen[delen.length - 1]
        ?.trim()
        .toLocaleLowerCase("nl-BE") ?? ""
    );
  }, [kernwoordenTekst]);

  const gefilterdeSuggesties = useMemo(() => {
    if (!actiefKernwoord) {
      return [];
    }

    const bestaandeKernwoorden =
      new Set(
        formulier?.kernwoorden.map(
          (kernwoord) =>
            kernwoord.toLocaleLowerCase(
              "nl-BE",
            ),
        ) ?? [],
      );

    return kernwoordSuggesties
      .filter((suggestie) => {
        const kleineSuggestie =
          suggestie.toLocaleLowerCase(
            "nl-BE",
          );

        return (
          kleineSuggestie.includes(
            actiefKernwoord,
          ) &&
          !bestaandeKernwoorden.has(
            kleineSuggestie,
          )
        );
      })
      .slice(0, 8);
  }, [
    actiefKernwoord,
    formulier?.kernwoorden,
    kernwoordSuggesties,
  ]);

  const geselecteerdeWetgeving =
    wetgevingen.find(
      (wetgeving) =>
        wetgeving.id ===
        formulier?.wetgevingId,
    );

  const geselecteerdBoek = boeken.find(
    (boek) =>
      boek.id === formulier?.boekId,
  );

  const geselecteerdeTitel = titels.find(
    (titel) =>
      titel.id === formulier?.titelId,
  );

  function wisStatus() {
    setOpgeslagen(false);
    setFoutmelding(null);
  }

  function wijzigWetgeving(
    wetgevingId: string,
  ) {
    setFormulier((huidig) => {
      if (!huidig) {
        return huidig;
      }

      return {
        ...huidig,
        wetgevingId,
        boekId: "",
        titelId: "",
      };
    });

    wisStatus();
  }

  function wijzigBoek(boekId: string) {
    setFormulier((huidig) => {
      if (!huidig) {
        return huidig;
      }

      return {
        ...huidig,
        boekId,
        titelId: "",
      };
    });

    wisStatus();
  }

  function wijzigTitel(
    titelId: string,
  ) {
    setFormulier((huidig) => {
      if (!huidig) {
        return huidig;
      }

      return {
        ...huidig,
        titelId,
      };
    });

    wisStatus();
  }

  function wijzigGewoonTekstveld(
    veld:
      | "situering"
      | "toelichting"
      | "wettelijkeVerwijzing",
    waarde: string,
  ) {
    setFormulier((huidig) => {
      if (!huidig) {
        return huidig;
      }

      return {
        ...huidig,
        [veld]: waarde,
      };
    });

    wisStatus();
  }

  function wijzigOpgemaakteTekst(
    tekstVeld:
      | "omschrijving"
      | "aanvulling",
    opmaakVeld:
      | "omschrijvingOpmaak"
      | "aanvullingOpmaak",
    tekst: string,
    segmenten: TekstSegment[],
  ) {
    setFormulier((huidig) => {
      if (!huidig) {
        return huidig;
      }

      return {
        ...huidig,
        [tekstVeld]: tekst,
        [opmaakVeld]: segmenten,
      };
    });

    wisStatus();
  }

  function normaliseerKernwoorden(
    waarde: string,
  ): string[] {
    const uniekeKernwoorden =
      new Map<string, string>();

    for (const deel of waarde.split(",")) {
      const kernwoord = deel.trim();

      if (!kernwoord) {
        continue;
      }

      const sleutel =
        kernwoord.toLocaleLowerCase(
          "nl-BE",
        );

      if (
        !uniekeKernwoorden.has(sleutel)
      ) {
        uniekeKernwoorden.set(
          sleutel,
          kernwoord,
        );
      }
    }

    return [
      ...uniekeKernwoorden.values(),
    ];
  }

  function wijzigKernwoorden(
    waarde: string,
  ) {
    setKernwoordenTekst(waarde);

    setFormulier((huidig) => {
      if (!huidig) {
        return huidig;
      }

      return {
        ...huidig,
        kernwoorden:
          normaliseerKernwoorden(
            waarde,
          ),
      };
    });

    setToonKernwoordSuggesties(true);
    wisStatus();
  }

  function kiesKernwoordSuggestie(
    suggestie: string,
  ) {
    const delen =
      kernwoordenTekst.split(",");

    delen[delen.length - 1] =
      ` ${suggestie}`;

    const nieuweTekst = delen
      .map((deel) => deel.trim())
      .filter(Boolean)
      .join(", ");

    const tekstMetKomma =
      `${nieuweTekst}, `;

    setKernwoordenTekst(
      tekstMetKomma,
    );

    setFormulier((huidig) => {
      if (!huidig) {
        return huidig;
      }

      return {
        ...huidig,
        kernwoorden:
          normaliseerKernwoorden(
            nieuweTekst,
          ),
      };
    });

    setToonKernwoordSuggesties(false);
    wisStatus();
  }

  async function bewaarWijzigingen(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!formulier || bezig) {
      return;
    }

    setBezig(true);
    setOpgeslagen(false);
    setFoutmelding(null);

    try {
      await onBewaar({
        ...formulier,
        kernwoorden:
          normaliseerKernwoorden(
            kernwoordenTekst,
          ),
      });

      setOpgeslagen(true);
    } catch (fout) {
      setFoutmelding(
        fout instanceof Error
          ? fout.message
          : "De standaardinbreuk kon niet worden opgeslagen.",
      );
    } finally {
      setBezig(false);
    }
  }

  async function verwijderInbreuk() {
    if (
      !formulier ||
      bezig ||
      !formulier.id.trim()
    ) {
      return;
    }

    const bevestigd =
      window.confirm(
        "Weet je zeker dat je deze standaardinbreuk wilt verwijderen?",
      );

    if (!bevestigd) {
      return;
    }

    setBezig(true);
    setOpgeslagen(false);
    setFoutmelding(null);

    try {
      await onVerwijder(
        formulier.id,
      );
    } catch (fout) {
      setFoutmelding(
        fout instanceof Error
          ? fout.message
          : "De standaardinbreuk kon niet worden verwijderd.",
      );
    } finally {
      setBezig(false);
    }
  }

  if (!formulier) {
    return (
      <div className="flex min-h-72 items-center justify-center p-6">
        <div className="max-w-sm text-center">
          <h2 className="text-lg font-semibold text-slate-900">
            Geen standaardinbreuk
            geselecteerd
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Selecteer een
            standaardinbreuk in de lijst
            of maak een nieuwe
            standaardinbreuk aan.
          </p>
        </div>
      </div>
    );
  }

  const formulierGeldig =
    formulier.wetgevingId.trim().length >
      0 &&
    formulier.boekId.trim().length > 0 &&
    formulier.titelId.trim().length > 0 &&
    formulier.omschrijving.trim().length >
      0 &&
    formulier.wettelijkeVerwijzing
      .trim().length > 0;

  const isNieuweInbreuk =
    formulier.id.trim().length === 0;

  return (
    <form
      onSubmit={bewaarWijzigingen}
    >
      <div className="border-b border-slate-200 p-5">
        <h2 className="text-lg font-semibold text-slate-900">
          Standaardinbreuk
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Bewerk de juridische indeling
          en de inhoud van de
          standaardinbreuk.
        </p>
      </div>

      <div className="space-y-6 p-5">
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Juridische indeling
          </h3>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Wetgeving
              </span>

              <select
                value={
                  formulier.wetgevingId
                }
                onChange={(event) =>
                  wijzigWetgeving(
                    event.target.value,
                  )
                }
                className={veldStijl}
                disabled={bezig}
                required
              >
                <option value="">
                  Selecteer wetgeving
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
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Boek
              </span>

              <select
                value={formulier.boekId}
                onChange={(event) =>
                  wijzigBoek(
                    event.target.value,
                  )
                }
                className={veldStijl}
                disabled={
                  !formulier.wetgevingId ||
                  bezig
                }
                required
              >
                <option value="">
                  Selecteer boek
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
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Titel
              </span>

              <select
                value={
                  formulier.titelId
                }
                onChange={(event) =>
                  wijzigTitel(
                    event.target.value,
                  )
                }
                className={veldStijl}
                disabled={
                  !formulier.boekId ||
                  bezig
                }
                required
              >
                <option value="">
                  Selecteer titel
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
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Onderwerp
              </span>

              <input
                type="text"
                value={
                  geselecteerdeTitel
                    ?.onderwerp ?? ""
                }
                className={veldStijl}
                placeholder="Wordt afgeleid uit de titel"
                disabled
              />
            </label>
          </div>
        </section>

        <section className="border-t border-slate-200 pt-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Inhoud
          </h3>

          <div className="mt-4 space-y-5">
            <div className="relative">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Kernwoorden
                </span>

                <input
                  type="text"
                  value={kernwoordenTekst}
                  onChange={(event) =>
                    wijzigKernwoorden(
                      event.target.value,
                    )
                  }
                  onFocus={() =>
                    setToonKernwoordSuggesties(
                      true,
                    )
                  }
                  onBlur={() => {
                    window.setTimeout(
                      () =>
                        setToonKernwoordSuggesties(
                          false,
                        ),
                      150,
                    );
                  }}
                  className={veldStijl}
                  placeholder="arbeidsplaats, veiligheid, gezondheid"
                  disabled={bezig}
                  autoComplete="off"
                />

                <span className="mt-1.5 block text-xs leading-5 text-slate-500">
                  Scheid verschillende
                  kernwoorden met een
                  komma.
                </span>
              </label>

              {toonKernwoordSuggesties &&
                gefilterdeSuggesties.length >
                  0 && (
                  <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                    {gefilterdeSuggesties.map(
                      (suggestie) => (
                        <button
                          key={suggestie}
                          type="button"
                          className="block w-full px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-blue-50 hover:text-blue-800"
                          onMouseDown={(
                            event,
                          ) =>
                            event.preventDefault()
                          }
                          onClick={() =>
                            kiesKernwoordSuggestie(
                              suggestie,
                            )
                          }
                        >
                          {suggestie}
                        </button>
                      ),
                    )}
                  </div>
                )}
            </div>

            <BeperkteTeksteditor
              label="Omschrijving van de inbreuk"
              tekst={
                formulier.omschrijving
              }
              segmenten={
                formulier.omschrijvingOpmaak ??
                []
              }
              opmaakType="donkergrijs"
              placeholder="Beschrijf de vastgestelde inbreuk..."
              rows={7}
              verplicht
              disabled={bezig}
              onChange={(
                tekst,
                segmenten,
              ) =>
                wijzigOpgemaakteTekst(
                  "omschrijving",
                  "omschrijvingOpmaak",
                  tekst,
                  segmenten,
                )
              }
            />

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Situering van de inbreuk
              </span>

              <textarea
                value={
                  formulier.situering ??
                  ""
                }
                onChange={(event) =>
                  wijzigGewoonTekstveld(
                    "situering",
                    event.target.value,
                  )
                }
                rows={4}
                className={tekstvakStijl}
                placeholder="Duid aan waar, aan welke installatie of aan welke werkpost de inbreuk werd vastgesteld..."
                disabled={bezig}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-600">
                <span
                  aria-hidden="true"
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-500 text-xs font-bold text-slate-600"
                >
                  i
                </span>

                Toelichting / Goede
                praktijk
              </span>

              <textarea
                value={
                  formulier.toelichting ??
                  ""
                }
                onChange={(event) =>
                  wijzigGewoonTekstveld(
                    "toelichting",
                    event.target.value,
                  )
                }
                rows={5}
                className={`${tekstvakStijl} text-slate-600`}
                placeholder="Geef een toelichting of beschrijf een goede praktijk..."
                disabled={bezig}
              />

              <span className="mt-1.5 block text-xs leading-5 text-slate-500">
                Dit volledige blok wordt
                donkergrijs weergegeven,
                inclusief het
                informatiesymbool.
              </span>
            </label>

            <BeperkteTeksteditor
              label="Aanvulling inbreuk"
              tekst={
                formulier.aanvulling ??
                ""
              }
              segmenten={
                formulier.aanvullingOpmaak ??
                []
              }
              opmaakType="vet"
              placeholder="Voeg een maatregel, opdracht of andere aanvulling toe..."
              rows={5}
              disabled={bezig}
              onChange={(
                tekst,
                segmenten,
              ) =>
                wijzigOpgemaakteTekst(
                  "aanvulling",
                  "aanvullingOpmaak",
                  tekst,
                  segmenten,
                )
              }
            />

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Wettelijke verwijzing
                <span className="ml-1 text-red-600">
                  *
                </span>
              </span>

              <textarea
                value={
                  formulier.wettelijkeVerwijzing
                }
                onChange={(event) =>
                  wijzigGewoonTekstveld(
                    "wettelijkeVerwijzing",
                    event.target.value,
                  )
                }
                rows={4}
                className={tekstvakStijl}
                placeholder="Vermeld de toepasselijke wettelijke bepaling..."
                disabled={bezig}
                required
              />
            </label>
          </div>
        </section>

        <section className="border-t border-slate-200 pt-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Voorbeeldweergave
          </h3>

          <div className="mt-4 space-y-5">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {geselecteerdeWetgeving
                  ?.naam ??
                  "Geen wetgeving geselecteerd"}
              </p>

              <p className="mt-2 text-sm font-semibold text-slate-800">
                {geselecteerdBoek?.naam ??
                  "Geen boek geselecteerd"}
                {" · "}
                {geselecteerdeTitel
                  ?.naam ??
                  "Geen titel geselecteerd"}
              </p>

              {geselecteerdeTitel?.onderwerp && (
                <p className="mt-1 text-sm text-slate-600">
                  {
                    geselecteerdeTitel.onderwerp
                  }
                </p>
              )}
            </div>

            <div className="space-y-4">
              <p className="text-sm leading-6 text-slate-900">
                {formulier.omschrijving ? (
                  <TekstMetOpmaak
                    tekst={
                      formulier.omschrijving
                    }
                    segmenten={
                      formulier.omschrijvingOpmaak ??
                      []
                    }
                    opmaakType="donkergrijs"
                  />
                ) : (
                  <span className="text-slate-400">
                    De omschrijving
                    verschijnt hier.
                  </span>
                )}
              </p>

              {formulier.situering?.trim() && (
                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-900">
                  {formulier.situering}
                </p>
              )}

              {formulier.toelichting?.trim() && (
                <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-slate-600">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-500 text-xs font-bold text-slate-600"
                  >
                    i
                  </span>

                  <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {
                      formulier.toelichting
                    }
                  </p>
                </div>
              )}

              {formulier.aanvulling?.trim() && (
                <p className="text-sm leading-6 text-slate-900">
                  <TekstMetOpmaak
                    tekst={
                      formulier.aanvulling
                    }
                    segmenten={
                      formulier.aanvullingOpmaak ??
                      []
                    }
                    opmaakType="vet"
                  />
                </p>
              )}

              {formulier.wettelijkeVerwijzing && (
                <p className="whitespace-pre-wrap text-sm font-medium leading-6 text-slate-800">
                  {
                    formulier.wettelijkeVerwijzing
                  }
                </p>
              )}
            </div>
          </div>
        </section>
      </div>

      {foutmelding && (
        <div className="mx-5 mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {foutmelding}
        </div>
      )}

      <div className="flex flex-col gap-3 border-t border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={verwijderInbreuk}
          disabled={
            bezig || isNieuweInbreuk
          }
          className="min-h-11 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {bezig
            ? "Bezig..."
            : "Verwijderen"}
        </button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {opgeslagen && (
            <span className="text-sm font-medium text-emerald-700">
              Wijzigingen opgeslagen
            </span>
          )}

          <button
            type="submit"
            disabled={
              !formulierGeldig ||
              bezig
            }
            className="min-h-11 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {bezig
              ? "Bewaren..."
              : isNieuweInbreuk
                ? "Aanmaken"
                : "Bewaren"}
          </button>
        </div>
      </div>
    </form>
  );
}