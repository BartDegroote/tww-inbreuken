"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";

import type {
  SpecifiekElement,
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
  boekId: string;
};

type InbreukFormulierProps = {
  inbreuk: Standaardinbreuk | null;
  wetgevingen: WetgevingOptie[];
  boeken: BoekOptie[];
  titels: TitelOptie[];

  kernwoordSuggesties?: string[];
  onderwerpSuggesties?: Array<
    Pick<
      Standaardinbreuk,
      | "wetgevingId"
      | "boekId"
      | "titelId"
      | "onderwerp"
    >
  >;

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
    return escapeHtml(tekst).replaceAll(
      "\n",
      "<br>",
    );
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
  ): void {
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
      Number.parseInt(
        stijl.fontWeight,
        10,
      ) >= 600;

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
      segmenten.length >
        aantalSegmentenVoor
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

  if (
    laatsteSegment?.tekst.endsWith("\n")
  ) {
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

  function verstuurWijziging(): void {
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
      segmentenNaarTekst(
        nieuweSegmenten,
      );

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
  ): void {
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
                pasOpmaakToe(
                  "foreColor",
                )
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
              pasOpmaakToe(
                "removeFormat",
              )
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
                ? "font-bold"
                : "",
              segment.donkergrijs
                ? "text-[#666666]"
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

function maakTijdelijkElementId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID ===
      "function"
  ) {
    return crypto.randomUUID();
  }

  return `nieuw-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function normaliseerSpecifiekeElementen(
  elementen: SpecifiekElement[],
): SpecifiekElement[] {
  return elementen
    .map((element) => ({
      ...element,
      tekst: element.tekst.trim(),
    }))
    .filter(
      (element) =>
        element.tekst.length > 0,
    )
    .map((element, index) => ({
      ...element,
      volgorde: index,
    }));
}

function initialiseerFormulier(
  inbreuk: Standaardinbreuk | null,
): Standaardinbreuk | null {
  if (!inbreuk) {
    return null;
  }

  return {
    ...inbreuk,
    geverifieerd: inbreuk.geverifieerd ?? false,
    onderwerp: inbreuk.onderwerp ?? "",
    specifiekeElementenIngeschakeld:
      inbreuk.specifiekeElementenIngeschakeld ??
      false,
    specifiekeElementenAlsSituering:
      Boolean(
        inbreuk.specifiekeElementenIngeschakeld &&
          inbreuk.specifiekeElementenAlsSituering,
      ),
    specifiekeElementen:
      inbreuk.specifiekeElementen ?? [],
  };
}

function InbreukFormulierInhoud({
  inbreuk,
  wetgevingen,
  boeken,
  titels,
  kernwoordSuggesties = [],
  onderwerpSuggesties = [],
  onBewaar,
  onVerwijder,
}: InbreukFormulierProps) {
  const [formulier, setFormulier] =
    useState<Standaardinbreuk | null>(
      () => initialiseerFormulier(inbreuk),
    );

  const [
    kernwoordenTekst,
    setKernwoordenTekst,
  ] = useState(() =>
    inbreuk?.kernwoorden.join(", ") ?? "",
  );

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
    formulier,
  ]);

  const beschikbareTitels = useMemo(() => {
    if (!formulier?.boekId) {
      return [];
    }

    return titels.filter(
      (titel) =>
        titel.boekId ===
        formulier.boekId,
    );
  }, [
    titels,
    formulier,
  ]);

  const beschikbareOnderwerpSuggesties =
    useMemo(() => {
      if (
        !formulier?.wetgevingId ||
        !formulier.boekId ||
        !formulier.titelId
      ) {
        return [];
      }

      const uniekeOnderwerpen =
        new Map<string, string>();

      for (const bron of onderwerpSuggesties) {
        if (
          bron.wetgevingId !==
            formulier.wetgevingId ||
          bron.boekId !== formulier.boekId ||
          bron.titelId !== formulier.titelId
        ) {
          continue;
        }

        const onderwerp = bron.onderwerp.trim();

        if (!onderwerp) {
          continue;
        }

        const sleutel =
          onderwerp.toLocaleLowerCase(
            "nl-BE",
          );

        if (!uniekeOnderwerpen.has(sleutel)) {
          uniekeOnderwerpen.set(
            sleutel,
            onderwerp,
          );
        }
      }

      return [
        ...uniekeOnderwerpen.values(),
      ].sort((eerste, tweede) =>
        eerste.localeCompare(
          tweede,
          "nl-BE",
          {
            sensitivity: "base",
          },
        ),
      );
    }, [formulier, onderwerpSuggesties]);

  const zichtbareOnderwerpSuggesties =
    useMemo(() => {
      const invoer =
        formulier?.onderwerp
          .trim()
          .toLocaleLowerCase("nl-BE") ?? "";

      return beschikbareOnderwerpSuggesties
        .filter((onderwerp) => {
          const genormaliseerd =
            onderwerp.toLocaleLowerCase("nl-BE");

          return (
            genormaliseerd !== invoer &&
            (!invoer ||
              genormaliseerd.includes(invoer))
          );
        })
        .slice(0, 6);
    }, [
      beschikbareOnderwerpSuggesties,
      formulier,
    ]);

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

  function wisStatus(): void {
    setOpgeslagen(false);
    setFoutmelding(null);
  }

  function wijzigWetgeving(
    wetgevingId: string,
  ): void {
    setFormulier((huidig) => {
      if (!huidig) {
        return huidig;
      }

      return {
        ...huidig,
        wetgevingId,
        boekId: "",
        titelId: "",
        onderwerp: "",
      };
    });

    wisStatus();
  }

  function wijzigBoek(
    boekId: string,
  ): void {
    setFormulier((huidig) => {
      if (!huidig) {
        return huidig;
      }

      return {
        ...huidig,
        boekId,
        titelId: "",
        onderwerp: "",
      };
    });

    wisStatus();
  }

  function wijzigTitel(
    titelId: string,
  ): void {
    setFormulier((huidig) => {
      if (!huidig) {
        return huidig;
      }

      return {
        ...huidig,
        titelId,
        onderwerp:
          huidig.titelId === titelId
            ? huidig.onderwerp
            : "",
      };
    });

    wisStatus();
  }

  function wijzigOnderwerp(
    onderwerp: string,
  ): void {
    setFormulier((huidig) => {
      if (!huidig) {
        return huidig;
      }

      return {
        ...huidig,
        onderwerp,
      };
    });

    wisStatus();
  }

  function wijzigGeverifieerd(
    geverifieerd: boolean,
  ): void {
    setFormulier((huidig) => {
      if (!huidig) {
        return huidig;
      }

      return {
        ...huidig,
        geverifieerd,
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
  ): void {
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
  ): void {
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

  function wijzigSpecifiekeElementenIngeschakeld(
    ingeschakeld: boolean,
  ): void {
    setFormulier((huidig) => {
      if (!huidig) {
        return huidig;
      }

      const huidigeElementen =
        huidig.specifiekeElementen ?? [];

      return {
        ...huidig,
        specifiekeElementenIngeschakeld:
          ingeschakeld,
        specifiekeElementenAlsSituering:
          ingeschakeld
            ? huidig.specifiekeElementenAlsSituering
            : false,
        specifiekeElementen:
          ingeschakeld &&
          huidigeElementen.length === 0
            ? [
                {
                  id: maakTijdelijkElementId(),
                  tekst: "",
                  volgorde: 0,
                },
              ]
            : huidigeElementen,
      };
    });

    wisStatus();
  }

  function wijzigPlaatsingSpecifiekeElementen(
    alsSituering: boolean,
  ): void {
    setFormulier((huidig) => {
      if (!huidig) {
        return huidig;
      }

      return {
        ...huidig,
        specifiekeElementenAlsSituering:
          alsSituering,
      };
    });

    wisStatus();
  }

  function voegSpecifiekElementToe(): void {
    setFormulier((huidig) => {
      if (!huidig) {
        return huidig;
      }

      const huidigeElementen =
        huidig.specifiekeElementen ?? [];

      return {
        ...huidig,
        specifiekeElementen: [
          ...huidigeElementen,
          {
            id: maakTijdelijkElementId(),
            tekst: "",
            volgorde:
              huidigeElementen.length,
          },
        ],
      };
    });

    wisStatus();
  }

  function wijzigSpecifiekElement(
    elementId: string,
    tekst: string,
  ): void {
    setFormulier((huidig) => {
      if (!huidig) {
        return huidig;
      }

      return {
        ...huidig,
        specifiekeElementen:
          huidig.specifiekeElementen.map(
            (element) =>
              element.id === elementId
                ? {
                    ...element,
                    tekst,
                  }
                : element,
          ),
      };
    });

    wisStatus();
  }

  function verwijderSpecifiekElement(
    elementId: string,
  ): void {
    setFormulier((huidig) => {
      if (!huidig) {
        return huidig;
      }

      const nieuweElementen =
        huidig.specifiekeElementen
          .filter(
            (element) =>
              element.id !== elementId,
          )
          .map((element, index) => ({
            ...element,
            volgorde: index,
          }));

      return {
        ...huidig,
        specifiekeElementen:
          nieuweElementen,
      };
    });

    wisStatus();
  }

  function verplaatsSpecifiekElement(
    elementId: string,
    richting: "omhoog" | "omlaag",
  ): void {
    setFormulier((huidig) => {
      if (!huidig) {
        return huidig;
      }

      const elementen = [
        ...huidig.specifiekeElementen,
      ];

      const huidigeIndex =
        elementen.findIndex(
          (element) =>
            element.id === elementId,
        );

      if (huidigeIndex < 0) {
        return huidig;
      }

      const nieuweIndex =
        richting === "omhoog"
          ? huidigeIndex - 1
          : huidigeIndex + 1;

      if (
        nieuweIndex < 0 ||
        nieuweIndex >= elementen.length
      ) {
        return huidig;
      }

      const tijdelijk =
        elementen[huidigeIndex];

      elementen[huidigeIndex] =
        elementen[nieuweIndex];

      elementen[nieuweIndex] =
        tijdelijk;

      return {
        ...huidig,
        specifiekeElementen:
          elementen.map(
            (element, index) => ({
              ...element,
              volgorde: index,
            }),
          ),
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
  ): void {
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
  ): void {
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
  ): Promise<void> {
    event.preventDefault();

    if (!formulier || bezig) {
      return;
    }

    setBezig(true);
    setOpgeslagen(false);
    setFoutmelding(null);

    try {
      const specifiekeElementen =
        normaliseerSpecifiekeElementen(
          formulier.specifiekeElementen ??
            [],
        );

      await onBewaar({
        ...formulier,
        onderwerp:
          formulier.onderwerp.trim(),
        kernwoorden:
          normaliseerKernwoorden(
            kernwoordenTekst,
          ),
        specifiekeElementen:
          formulier
            .specifiekeElementenIngeschakeld
            ? specifiekeElementen
            : [],
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

  async function verwijderInbreuk(): Promise<void> {
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
            Geen standaardinbreuk geselecteerd
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Selecteer een standaardinbreuk
            in de lijst of maak een nieuwe
            standaardinbreuk aan.
          </p>
        </div>
      </div>
    );
  }

  const geldigeSpecifiekeElementen =
    normaliseerSpecifiekeElementen(
      formulier.specifiekeElementen ?? [],
    );

  const specifiekeElementenGeldig =
    !formulier
      .specifiekeElementenIngeschakeld ||
    geldigeSpecifiekeElementen.length > 0;

  const formulierGeldig =
    formulier.wetgevingId.trim().length >
      0 &&
    formulier.boekId.trim().length > 0 &&
    formulier.titelId.trim().length > 0 &&
    formulier.onderwerp.trim().length >
      0 &&
    formulier.omschrijving.trim().length >
      0 &&
    formulier.wettelijkeVerwijzing
      .trim().length > 0 &&
    specifiekeElementenGeldig;

  const isNieuweInbreuk =
    formulier.id.trim().length === 0;

  return (
    <form onSubmit={bewaarWijzigingen}>
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
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Juridische indeling
            </h3>

            <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={formulier.geverifieerd}
                onChange={(event) =>
                  wijzigGeverifieerd(
                    event.target.checked,
                  )
                }
                disabled={bezig}
                className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />

              Geverifieerd?
            </label>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Wetgeving
                <span className="ml-1 text-red-600">
                  *
                </span>
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
                <span className="ml-1 text-red-600">
                  *
                </span>
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
                <span className="ml-1 text-red-600">
                  *
                </span>
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

            <div className="block">
              <label
                htmlFor="inbreuk-onderwerp"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Onderwerp
                <span className="ml-1 text-red-600">
                  *
                </span>
              </label>

              <input
                id="inbreuk-onderwerp"
                type="text"
                value={
                  formulier.onderwerp
                }
                onChange={(event) =>
                  wijzigOnderwerp(
                    event.target.value,
                  )
                }
                className={veldStijl}
                placeholder="Bijvoorbeeld: Arbeidsmiddelen"
                list="onderwerp-suggesties"
                disabled={
                  !formulier.titelId ||
                  bezig
                }
                autoComplete="off"
                required
              />

              <datalist id="onderwerp-suggesties">
                {beschikbareOnderwerpSuggesties.map(
                  (onderwerp) => (
                    <option
                      key={onderwerp}
                      value={onderwerp}
                    />
                  ),
                )}
              </datalist>

              <span className="mt-1.5 block text-xs leading-5 text-slate-500">
                Je kunt een bestaand onderwerp
                kiezen of een nieuw onderwerp
                invoeren.
              </span>

              {zichtbareOnderwerpSuggesties.length >
                0 && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="mr-1 text-xs text-slate-500">
                    Suggesties:
                  </span>

                  {zichtbareOnderwerpSuggesties.map(
                    (onderwerp) => (
                      <button
                        key={onderwerp}
                        type="button"
                        onClick={() =>
                          wijzigOnderwerp(onderwerp)
                        }
                        className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800 transition hover:border-blue-300 hover:bg-blue-100"
                        disabled={bezig}
                      >
                        {onderwerp}
                      </button>
                    ),
                  )}
                </div>
              )}
            </div>
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
                  kernwoorden met een komma.
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

            <section className="border-t border-slate-200 pt-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Specifieke elementen
                  </h4>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Voeg afzonderlijke elementen
                    toe die bij deze
                    standaardinbreuk moeten worden
                    gecontroleerd of vermeld.
                  </p>
                </div>

                <label className="inline-flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={
                      formulier
                        .specifiekeElementenIngeschakeld
                    }
                    onChange={(event) =>
                      wijzigSpecifiekeElementenIngeschakeld(
                        event.target.checked,
                      )
                    }
                    disabled={bezig}
                    className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />

                  <span className="text-sm font-semibold text-slate-700">
                    Ingeschakeld
                  </span>
                </label>
              </div>

              {formulier
                .specifiekeElementenIngeschakeld && (
                <div className="mt-4 space-y-3">
                  {formulier.specifiekeElementen
                    .length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">
                        Er zijn nog geen specifieke
                        elementen toegevoegd.
                      </p>
                    </div>
                  ) : (
                    formulier.specifiekeElementen.map(
                      (element, index) => (
                        <div
                          key={element.id}
                          className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                        >
                          <div className="flex items-start gap-3">
                            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-slate-600 shadow-sm">
                              {index + 1}
                            </span>

                            <div className="min-w-0 flex-1">
                              <label className="block">
                                <span className="sr-only">
                                  Specifiek element{" "}
                                  {index + 1}
                                </span>

                                <textarea
                                  value={element.tekst}
                                  onChange={(event) =>
                                    wijzigSpecifiekElement(
                                      element.id,
                                      event.target.value,
                                    )
                                  }
                                  rows={3}
                                  className={tekstvakStijl}
                                  placeholder="Omschrijf het specifieke element..."
                                  disabled={bezig}
                                />
                              </label>

                              <div className="mt-3 flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  className={knopStijl}
                                  disabled={bezig || index === 0}
                                  onClick={() =>
                                    verplaatsSpecifiekElement(
                                      element.id,
                                      "omhoog",
                                    )
                                  }
                                >
                                  Omhoog
                                </button>

                                <button
                                  type="button"
                                  className={knopStijl}
                                  disabled={
                                    bezig ||
                                    index ===
                                      formulier
                                        .specifiekeElementen
                                        .length -
                                        1
                                  }
                                  onClick={() =>
                                    verplaatsSpecifiekElement(
                                      element.id,
                                      "omlaag",
                                    )
                                  }
                                >
                                  Omlaag
                                </button>

                                <button
                                  type="button"
                                  disabled={bezig}
                                  onClick={() =>
                                    verwijderSpecifiekElement(
                                      element.id,
                                    )
                                  }
                                  className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 shadow-sm transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Verwijderen
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ),
                    )
                  )}

                  <button
                    type="button"
                    onClick={voegSpecifiekElementToe}
                    disabled={bezig}
                    className="min-h-10 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Specifiek element toevoegen
                  </button>

                  {!specifiekeElementenGeldig && (
                    <p className="text-sm font-medium text-red-600">
                      Voeg minstens één ingevuld
                      specifiek element toe of
                      schakel deze functie uit.
                    </p>
                  )}
                </div>
              )}
            </section>

            <div className="space-y-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm font-medium text-slate-700">
                  Situering van de inbreuk
                </span>

                {formulier.specifiekeElementenIngeschakeld && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-slate-500">
                      Specifieke elementen:
                    </span>

                    <div
                      role="group"
                      aria-label="Plaatsing van specifieke elementen"
                      className="inline-flex w-fit rounded-lg border border-slate-200 bg-slate-100 p-1 shadow-inner"
                    >
                      <button
                        type="button"
                        aria-pressed={
                          !formulier.specifiekeElementenAlsSituering
                        }
                        onClick={() =>
                          wijzigPlaatsingSpecifiekeElementen(
                            false,
                          )
                        }
                        disabled={bezig}
                        className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                          !formulier.specifiekeElementenAlsSituering
                            ? "bg-white text-blue-700 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                        } disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        Onder situering
                      </button>

                      <button
                        type="button"
                        aria-pressed={
                          formulier.specifiekeElementenAlsSituering
                        }
                        onClick={() =>
                          wijzigPlaatsingSpecifiekeElementen(
                            true,
                          )
                        }
                        disabled={bezig}
                        className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                          formulier.specifiekeElementenAlsSituering
                            ? "bg-blue-600 text-white shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                        } disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        Als situering
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {formulier.specifiekeElementenIngeschakeld &&
              formulier.specifiekeElementenAlsSituering ? (
                <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                  De gekozen elementen vormen tijdens de inspectie de situering.
                </div>
              ) : (
                <textarea
                  aria-label="Situering van de inbreuk"
                  value={
                    formulier.situering ?? ""
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
              )}
            </div>

            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-600">
                <span
                  aria-hidden="true"
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-500 text-xs font-bold text-slate-600"
                >
                  i
                </span>

                Toelichting / Goede praktijk
              </span>

              <textarea
                value={
                  formulier.toelichting ?? ""
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
                formulier.aanvulling ?? ""
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
                  formulier
                    .wettelijkeVerwijzing
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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Voorbeeld Word-export
            </h3>

            <span className="text-xs text-slate-400">
              Verdana · enkele regelafstand
            </span>
          </div>

          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-slate-100 p-3 sm:p-6">
            <div
              className="mx-auto min-h-72 max-w-3xl bg-white px-5 py-7 text-[10pt] leading-[1.2] text-black shadow-sm sm:px-10 sm:py-9"
              style={{
                fontFamily:
                  "Verdana, Geneva, sans-serif",
              }}
            >
              <div className="grid grid-cols-[24px_minmax(0,1fr)] pl-3">
                <span>1.</span>

                <p>
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
                      De omschrijving verschijnt hier.
                    </span>
                  )}
                </p>
              </div>

              {!formulier.specifiekeElementenAlsSituering &&
                formulier.situering?.trim() && (
                  <div className="ml-9 grid grid-cols-[24px_minmax(0,1fr)]">
                    <span>☐</span>
                    <p className="whitespace-pre-wrap">
                      {formulier.situering}
                    </p>
                  </div>
                )}

              {formulier.specifiekeElementenIngeschakeld &&
                geldigeSpecifiekeElementen.length > 0 && (
                  <div
                    className={
                      formulier.specifiekeElementenAlsSituering
                        ? "ml-9"
                        : "ml-[60px]"
                    }
                  >
                    {geldigeSpecifiekeElementen.map(
                      (element) => (
                        <div
                          key={element.id}
                          className="grid grid-cols-[24px_minmax(0,1fr)]"
                        >
                          <span>
                            {formulier.specifiekeElementenAlsSituering
                              ? "☐"
                              : "▪"}
                          </span>

                          <p className="whitespace-pre-wrap">
                            {element.tekst}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                )}

              {formulier.toelichting?.trim() && (
                <div className="ml-9 flex items-start gap-2 text-[#595959]">
                  <span aria-hidden="true">ⓘ</span>

                  <p className="whitespace-pre-wrap">
                    {formulier.toelichting}
                  </p>
                </div>
              )}

              {formulier.aanvulling?.trim() && (
                <p className="ml-9">
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
                <p className="ml-9 whitespace-pre-wrap pt-0 text-[9pt] italic">
                  {formulier.wettelijkeVerwijzing}
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
              !formulierGeldig || bezig
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

export default function InbreukFormulier(
  props: InbreukFormulierProps,
) {
  const formulierSleutel = props.inbreuk
    ? JSON.stringify(props.inbreuk)
    : "geen-inbreuk";

  return (
    <InbreukFormulierInhoud
      key={formulierSleutel}
      {...props}
    />
  );
}
