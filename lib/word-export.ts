import {
  zoekEaoCode,
  type InbreukType,
  type TekstSegment,
} from "@/bibliotheek";
import { MAX_FOTOS_PER_INBREUK } from "@/lib/inspectie-limieten";

import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  ImageRun,
  LevelFormat,
  LevelSuffix,
  PageNumber,
  Packer,
  Paragraph,
  TabStopType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
  XmlAttributeComponent,
  XmlComponent,
  type IRunOptions,
} from "docx";

export type WordFoto = {
  naam: string;
  data: Uint8Array;
  breedte: number;
  hoogte: number;
};

export type WordInbreuk = {
  inbreukType: InbreukType;
  beschrijving: string;
  beschrijvingOpmaak?: TekstSegment[];
  inCasu: string;
  specifiekeElementen?: string[];
  specifiekeElementenAlsSituering?: boolean;
  vaststellingen?: WordVaststelling[];
  fotos?: WordFoto[];
  toelichting: string;
  aanvulling: string;
  aanvullingOpmaak?: TekstSegment[];
  wettelijkeVerwijzing: string;
  afwijkendeGebeurtenisCode?: string;
  betrokkenVoorwerpCode?: string;
  soortLetselCode?: string;
};

export type WordVaststelling = {
  tekst: string;
  specifiekeElementen: string[];
  eigenElementen: string[];
};

export type WordOngevalsgegevens = {
  slachtofferVoornaam: string;
  slachtofferNaam: string;
  ongevalsdatum: string;
  slachtofferWerkHervat: boolean | null;
  werkhervattingsdatum: string;
  werkpostBezocht: boolean | null;
};

export type WordOntmoetePersoon = {
  aanspreking?: "HEER" | "MEVROUW" | "";
  naam: string;
  functie: string;
};

export type WordInspectie = {
  onderneming: string;
  adres: string;
  inspectiedatum: string;
  inspecteur: string;
  flow: string;
  ontmoetePersonen?: WordOntmoetePersoon[];
  andereOpmerkingen?: string[];
  inbreuken: WordInbreuk[];
  ernstigArbeidsongeval?: WordOngevalsgegevens | null;
};

const LETTERTYPE = "Verdana";

const HOOFDTEKST_GROOTTE = 20; // 10 pt
const WETTELIJKE_VERWIJZING_GROOTTE = 18; // 9 pt
const ENKELE_REGELAFSTAND = 240;
const AFSTAND_VOOR_WETTELIJKE_VERWIJZING = 20; // 1 pt
const AFSTAND_NA_WETTELIJKE_VERWIJZING = 360;

// ImageRun gebruikt pixels. 5 cm bij 96 dpi is ongeveer 189 px.
const FOTO_HOOGTE_PX = 189;
// De beschikbare regelbreedte na de inspringing is ongeveer 609 px.
// Voor twee foto's blijft een kleine ruimte van exact drie spaties vrij.
const FOTO_REGELBREEDTE_PX = 609;
const FOTO_TUSSENRUIMTE_PX = 12;
const FOTO_TUSSENRUIMTE = "   ";

// De nummers en opsommingstekens beginnen links van de tekst.
// Alle vervolgregels beginnen exact op dezelfde positie als de hoofdtekst.
const TEKST_INSPrONG = 1068;
const HANGENDE_INSPrONG = 360;
const NUMMER_INSPrONG =
  TEKST_INSPrONG - HANGENDE_INSPrONG;
const SJABLOON_LINKERLIJN = 709;

const INBREUK_NUMMERING_REFERENTIE =
  "tww-inbreuken";
const VERSLAG_ONDERDELEN_NUMMERING_REFERENTIE =
  "tww-verslag-onderdelen";
const ONTMOETE_PERSONEN_NUMMERING_REFERENTIE =
  "tww-ontmoete-personen";
const ANDERE_OPMERKINGEN_NUMMERING_REFERENTIE =
  "tww-andere-opmerkingen";

// De vaststelling krijgt een extra niveau:
// het vierkante teken begint waar de gewone inbreuktekst begint,
// en de tekst van de vaststelling begint na het teken.
const SITUERING_TEKST_INSPrONG =
  TEKST_INSPrONG + HANGENDE_INSPrONG;

// Specifieke elementen staan één tabniveau verder dan de vaststelling.
// Het kleine vierkant begint waar de tekst van de vaststelling begint.
const SPECIFIEK_ELEMENT_TEKST_INSPrONG =
  SITUERING_TEKST_INSPrONG + HANGENDE_INSPrONG;

class ThemaGrijzeKleurAttributen extends XmlAttributeComponent<{
  val: string;
  themeColor: string;
  themeShade: string;
}> {
  protected readonly xmlKeys = {
    val: "w:val",
    themeColor: "w:themeColor",
    themeShade: "w:themeShade",
  };
}

class ThemaGrijzeKleur extends XmlComponent {
  constructor() {
    super("w:color");
    this.root.push(
      new ThemaGrijzeKleurAttributen({
        val: "7F7F7F",
        themeColor: "background1",
        themeShade: "80",
      }),
    );
  }
}

/**
 * Word-thema: Wit, Achtergrond 1, donkerder 50%.
 * De fallbackkleur blijft zichtbaar in programma's die geen themakleur lezen.
 */
class ThemaGrijzeTekstRun extends TextRun {
  constructor(options: IRunOptions | string) {
    const optiesMetFallbackkleur: IRunOptions =
      typeof options === "string"
        ? {
            text: options,
            color: "7F7F7F",
          }
        : {
            ...options,
            color: "7F7F7F",
          };

    super(optiesMetFallbackkleur);

    const eigenschappen = this
      .properties as unknown as {
      root: XmlComponent[];
    };
    const kleurIndex =
      eigenschappen.root.findIndex(
        (onderdeel) =>
          (
            onderdeel as unknown as {
              rootKey?: string;
            }
          ).rootKey === "w:color",
      );

    if (kleurIndex >= 0) {
      eigenschappen.root.splice(
        kleurIndex,
        1,
        new ThemaGrijzeKleur(),
      );
    }
  }
}

function veiligeBestandsnaam(
  waarde: string,
): string {
  const opgeschoond = waarde
    .trim()
    .replace(
      /[<>:"/\\|?*\u0000-\u001F]/g,
      " ",
    )
    .replace(/\s+/g, " ")
    .replace(/\.+$/g, "");

  return opgeschoond || "inspectie";
}

function tekstOfStreepje(
  waarde: string,
): string {
  return waarde.trim() || "-";
}

function geldigeSegmenten(
  tekst: string,
  segmenten?: TekstSegment[],
): TekstSegment[] {
  if (
    segmenten &&
    segmenten.length > 0 &&
    segmenten.some(
      (segment) => segment.tekst.length > 0,
    )
  ) {
    return segmenten;
  }

  return tekst ? [{ tekst }] : [];
}

function maakOpgemaakteRuns(
  tekst: string,
  segmenten?: TekstSegment[],
  opties?: {
    grootte?: number;
    standaardVet?: boolean;
  },
): TextRun[] {
  const runs: TextRun[] = [];

  for (const segment of geldigeSegmenten(
    tekst,
    segmenten,
  )) {
    const regels = segment.tekst
      .replace(/\r\n/g, "\n")
      .split("\n");

    regels.forEach((regel, index) => {
      if (index > 0) {
        runs.push(
          new TextRun({
            break: 1,
          }),
        );
      }

      if (regel.length === 0) {
        return;
      }

      const runOpties: IRunOptions = {
        text: regel,
        bold:
          opties?.standaardVet === true ||
          segment.vet === true,
        ...(!segment.donkergrijs
          ? { color: "000000" }
          : {}),
        size:
          opties?.grootte ??
          HOOFDTEKST_GROOTTE,
        font: LETTERTYPE,
      };

      runs.push(
        segment.donkergrijs
          ? new ThemaGrijzeTekstRun(
              runOpties,
            )
          : new TextRun(runOpties),
      );
    });
  }

  return runs;
}

function voegGewoneTekstParagrafenToe(
  kinderen: Paragraph[],
  tekst: string,
  opties?: {
    prefix?: string;
    cursief?: boolean;
    vet?: boolean;
    kleur?: string;
    grootte?: number;
    inspringingLinks?: number;
    hangendeInspringing?: number;
    themaGrijs?: boolean;
    afstandVoor?: number;
    afstandNa?: number;
    regelafstand?: number;
  },
) {
  const opgeschoondeTekst = tekst.trim();

  if (!opgeschoondeTekst) {
    return;
  }

  const regels = opgeschoondeTekst
    .replace(/\r\n/g, "\n")
    .split("\n");

  regels.forEach((regel, index) => {
    const prefix =
      index === 0
        ? opties?.prefix ?? ""
        : "";

    kinderen.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        indent:
          opties?.inspringingLinks !== undefined
            ? {
                left:
                  opties.inspringingLinks,
                hanging:
                  opties.hangendeInspringing,
              }
            : undefined,
        spacing: {
          before:
            index === 0
              ? opties?.afstandVoor ?? 0
              : 0,
          after:
            opties?.afstandNa ?? 0,
          line:
            opties?.regelafstand ??
            ENKELE_REGELAFSTAND,
        },
        children: [
          opties?.themaGrijs
            ? new ThemaGrijzeTekstRun({
                text: `${prefix}${regel}`,
                bold: opties.vet,
                italics: opties.cursief,
                size:
                  opties.grootte ??
                  HOOFDTEKST_GROOTTE,
                font: LETTERTYPE,
              })
            : new TextRun({
                text: `${prefix}${regel}`,
                bold: opties?.vet,
                italics: opties?.cursief,
                color:
                  opties?.kleur ?? "000000",
                size:
                  opties?.grootte ??
                  HOOFDTEKST_GROOTTE,
                font: LETTERTYPE,
              }),
        ],
      }),
    );
  });
}

function maakVerslagOnderdeelTitel(
  tekst: string,
): Paragraph {
  const heeftDubbelePunt = tekst.endsWith(":");
  const titelZonderDubbelePunt =
    heeftDubbelePunt
      ? tekst.slice(0, -1)
      : tekst;

  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    numbering: {
      reference:
        VERSLAG_ONDERDELEN_NUMMERING_REFERENTIE,
      level: 0,
    },
    spacing: {
      before: 0,
      after: 120,
      line: ENKELE_REGELAFSTAND,
    },
    children: [
      new TextRun({
        text: titelZonderDubbelePunt,
        bold: true,
        underline: {},
        size: HOOFDTEKST_GROOTTE,
        font: LETTERTYPE,
      }),
      ...(heeftDubbelePunt
        ? [
            new TextRun({
              text: ":",
              bold: true,
              size: HOOFDTEKST_GROOTTE,
              font: LETTERTYPE,
            }),
          ]
        : []),
    ],
  });
}

function maakOntmoetePersonenParagrafen(
  personen: WordOntmoetePersoon[] = [],
): Paragraph[] {
  const geldigePersonen = personen
    .map((persoon) => {
      const aanspreking =
        persoon.aanspreking === "HEER"
          ? "de heer"
          : persoon.aanspreking === "MEVROUW"
            ? "mevrouw"
            : "";

      return {
        aanspreking,
        naam: persoon.naam.trim(),
        functie: formatteerFunctieVoorVerslag(
          persoon.functie,
        ),
      };
    })
    .filter(
      (persoon) =>
        persoon.naam.length > 0 &&
        persoon.functie.length > 0,
    );

  return [
    maakVerslagOnderdeelTitel(
      "Personen ontmoet tijdens het inspectiebezoek:",
    ),
    ...geldigePersonen.map(
      (persoon) =>
        new Paragraph({
          numbering: {
            reference:
              ONTMOETE_PERSONEN_NUMMERING_REFERENTIE,
            level: 0,
          },
          spacing: {
            before: 0,
            after: 0,
            line: ENKELE_REGELAFSTAND,
          },
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: `${persoon.aanspreking ? `${persoon.aanspreking} ` : ""}${persoon.naam}, ${persoon.functie}`,
              size: HOOFDTEKST_GROOTTE,
              font: LETTERTYPE,
            }),
          ],
        }),
    ),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      indent: {
        left: TEKST_INSPrONG,
      },
      spacing: {
        before: 0,
        after: 120,
        line: ENKELE_REGELAFSTAND,
      },
    }),
  ];
}

function maakAndereOpmerkingenParagrafen(
  opmerkingen: string[] = [],
): Paragraph[] {
  const geldigeOpmerkingen = opmerkingen
    .map((opmerking) => opmerking.trim())
    .filter(Boolean);

  if (geldigeOpmerkingen.length === 0) {
    return [];
  }

  return [
    maakVerslagOnderdeelTitel("Andere opmerkingen:"),
    ...geldigeOpmerkingen.map(
      (opmerking) =>
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          numbering: {
            reference:
              ANDERE_OPMERKINGEN_NUMMERING_REFERENTIE,
            level: 0,
          },
          spacing: {
            before: 0,
            after: 120,
            line: ENKELE_REGELAFSTAND,
          },
          children: [
            new TextRun({
              text: opmerking,
              size: HOOFDTEKST_GROOTTE,
              font: LETTERTYPE,
            }),
          ],
        }),
    ),
  ];
}

function formatteerFunctieVoorVerslag(
  functie: string,
): string {
  const opgeschoondeFunctie = functie.trim();

  if (!opgeschoondeFunctie) {
    return "";
  }

  // Vakafkortingen zoals HR, HSE, CEO en ICT behouden hun hoofdletters.
  if (/^\p{Lu}{2,}(?:[^\p{L}]|$)/u.test(opgeschoondeFunctie)) {
    return opgeschoondeFunctie;
  }

  return `${opgeschoondeFunctie[0].toLocaleLowerCase("nl-BE")}${opgeschoondeFunctie.slice(1)}`;
}

function maakVaststellingenInleiding(): Paragraph[] {
  return [
    maakVerslagOnderdeelTitel(
      "Niet-beperkende lijst van vaststellingen gemeld als schriftelijke waarschuwing:",
    ),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      indent: {
        left: SJABLOON_LINKERLIJN,
      },
      spacing: {
        before: 0,
        after: 120,
        line: ENKELE_REGELAFSTAND,
      },
      children: [
        new TextRun({
          text: "Volgende overtredingen werden vastgesteld en deel ik u mee als schriftelijke waarschuwing in uitvoering van art. 21 2° van het sociaal strafwetboek ingevoerd door de wet van 6 juni 2010:",
          size: HOOFDTEKST_GROOTTE,
          font: LETTERTYPE,
        }),
      ],
    }),
  ];
}

function voegSitueringToe(
  kinderen: Paragraph[],
  tekst: string,
  specifiekeElementen: string[] = [],
  specifiekeElementenAlsSituering = false,
) {
  const opgeschoondeTekst = tekst.trim();
  const opgeschoondeElementen = specifiekeElementen
    .map((element) => element.trim())
    .filter(Boolean);

  if (!opgeschoondeTekst && opgeschoondeElementen.length === 0) {
    return;
  }

  const voegOnderdeelToe = (
    onderdeel: string,
    teken: string,
    tekstInspringing: number,
    afstandVoor: number,
  ) => {
    const regels = onderdeel
      .replace(/\r\n/g, "\n")
      .split("\n");

    kinderen.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        indent: {
          left: tekstInspringing,
          hanging: HANGENDE_INSPrONG,
        },
        tabStops: [
          {
            type: TabStopType.LEFT,
            position: tekstInspringing,
          },
        ],
        spacing: {
          before: afstandVoor,
          after: 0,
          line: ENKELE_REGELAFSTAND,
        },
        children: [
          new TextRun({
            text: teken,
            size: HOOFDTEKST_GROOTTE,
            font: LETTERTYPE,
          }),
          new TextRun({
            text: "\t",
            font: LETTERTYPE,
          }),
          ...regels.flatMap((regel, index) => {
            const runs: TextRun[] = [];

            if (index > 0) {
              runs.push(
                new TextRun({
                  break: 1,
                }),
              );
            }

            runs.push(
              new TextRun({
                text: regel,
                size: HOOFDTEKST_GROOTTE,
                font: LETTERTYPE,
              }),
            );

            return runs;
          }),
        ],
      }),
    );
  };

  if (
    opgeschoondeTekst &&
    !specifiekeElementenAlsSituering
  ) {
    voegOnderdeelToe(
      opgeschoondeTekst,
      "☐",
      SITUERING_TEKST_INSPrONG,
      0,
    );
  }

  opgeschoondeElementen.forEach((element) => {
    voegOnderdeelToe(
      element,
      specifiekeElementenAlsSituering ? "☐" : "▪",
      specifiekeElementenAlsSituering
        ? SITUERING_TEKST_INSPrONG
        : SPECIFIEK_ELEMENT_TEKST_INSPrONG,
      0,
    );
  });
}

function maakFotoParagrafen(
  fotos?: WordFoto[],
): Paragraph[] {
  if (!fotos?.length) {
    return [];
  }

  const getoondeFotos = fotos.slice(
    0,
    MAX_FOTOS_PER_INBREUK,
  );
  const verhoudingen = getoondeFotos.map(
    (foto) =>
      foto.hoogte > 0 &&
      foto.breedte > 0
        ? foto.breedte / foto.hoogte
        : 1,
  );
  const beschikbareFotobreedte =
    FOTO_REGELBREEDTE_PX -
    (getoondeFotos.length > 1
      ? FOTO_TUSSENRUIMTE_PX
      : 0);
  const gezamenlijkeVerhouding =
    verhoudingen.reduce(
      (totaal, verhouding) =>
        totaal + verhouding,
      0,
    );
  // Beide foto's krijgen exact dezelfde hoogte en blijven samen op één regel.
  const fotoHoogte = Math.max(
    1,
    Math.min(
      FOTO_HOOGTE_PX,
      Math.floor(
        beschikbareFotobreedte /
          Math.max(
            gezamenlijkeVerhouding,
            1,
          ),
      ),
    ),
  );
  const afbeeldingRuns = getoondeFotos.flatMap(
    (foto, index) => {
      const breedte = Math.max(
        1,
        Math.round(
          fotoHoogte * verhoudingen[index],
        ),
      );
      const runs: Array<ImageRun | TextRun> = [];

      if (index > 0) {
        runs.push(
          new TextRun({
            text: FOTO_TUSSENRUIMTE,
            size: HOOFDTEKST_GROOTTE,
            font: LETTERTYPE,
          }),
        );
      }

      runs.push(
        new ImageRun({
          data: foto.data,
          type: "png",
          transformation: {
            width: breedte,
            height: fotoHoogte,
          },
          altText: {
            title: foto.naam,
            description: foto.naam,
            name: foto.naam,
          },
        }),
      );

      return runs;
    },
  );

  return [
    new Paragraph({
      indent: {
        left: TEKST_INSPrONG,
      },
      spacing: {
        before: 50,
        after: 140,
      },
      children: afbeeldingRuns,
    }),
  ];
}

function maakInbreukParagrafen(
  inbreuk: WordInbreuk,
  index: number,
): Paragraph[] {
  const beschrijvingsRuns =
    maakOpgemaakteRuns(
      inbreuk.beschrijving,
      inbreuk.beschrijvingOpmaak,
      {
        grootte:
          HOOFDTEKST_GROOTTE,
      },
    );

  const kinderen: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      numbering: {
        reference:
          INBREUK_NUMMERING_REFERENTIE,
        level: 0,
      },
      spacing: {
        before:
          index === 0 ? 40 : 0,
        after: 0,
        line: ENKELE_REGELAFSTAND,
      },
      keepNext: true,
      children: beschrijvingsRuns,
    }),
  ];

  const vaststellingen =
    inbreuk.vaststellingen?.length
      ? inbreuk.vaststellingen
      : [
          {
            tekst: inbreuk.inCasu,
            specifiekeElementen:
              inbreuk.specifiekeElementen ?? [],
            eigenElementen: [],
          },
        ];

  vaststellingen.forEach(
    (vaststelling) => {
      voegSitueringToe(
        kinderen,
        vaststelling.tekst,
        [
          ...vaststelling.specifiekeElementen,
          ...vaststelling.eigenElementen,
        ],
        inbreuk.specifiekeElementenAlsSituering,
      );
    },
  );

  kinderen.push(
    ...maakFotoParagrafen(
      inbreuk.fotos,
    ),
  );

  voegGewoneTekstParagrafenToe(
    kinderen,
    inbreuk.toelichting,
    {
      prefix: "ⓘ ",
      themaGrijs: true,
      grootte:
        HOOFDTEKST_GROOTTE,
      inspringingLinks:
        TEKST_INSPrONG,
      afstandVoor: 0,
      afstandNa: 0,
    },
  );

  const aanvullingRuns =
    maakOpgemaakteRuns(
      inbreuk.aanvulling,
      inbreuk.aanvullingOpmaak,
      {
        grootte:
          HOOFDTEKST_GROOTTE,
      },
    );

  if (aanvullingRuns.length > 0) {
    kinderen.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        indent: {
          left: TEKST_INSPrONG,
        },
        spacing: {
          before: 0,
          after: 0,
          line: ENKELE_REGELAFSTAND,
        },
        children: aanvullingRuns,
      }),
    );
  }

  voegGewoneTekstParagrafenToe(
    kinderen,
    inbreuk.wettelijkeVerwijzing,
    {
      cursief: true,
      kleur: "000000",
      grootte:
        WETTELIJKE_VERWIJZING_GROOTTE,
      inspringingLinks:
        TEKST_INSPrONG,
      afstandVoor:
        AFSTAND_VOOR_WETTELIJKE_VERWIJZING,
      afstandNa:
        AFSTAND_NA_WETTELIJKE_VERWIJZING,
      regelafstand:
        ENKELE_REGELAFSTAND,
    },
  );

  return kinderen;
}

function formatteerDatumVoorWord(
  datum: string,
): string {
  const delen = datum.split("-");

  if (
    delen.length === 3 &&
    delen[0].length === 4
  ) {
    return `${delen[2]}/${delen[1]}/${delen[0]}`;
  }

  return datum;
}

function formatteerLangeDatumVoorWord(
  datum: string,
): string {
  const [jaar, maand, dag] = datum
    .split("-")
    .map(Number);

  if (
    !jaar ||
    !maand ||
    !dag
  ) {
    return datum;
  }

  return new Intl.DateTimeFormat("nl-BE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(
    new Date(
      Date.UTC(jaar, maand - 1, dag),
    ),
  );
}

const GEEN_TABELRAND = {
  style: BorderStyle.NONE,
  size: 0,
  color: "FFFFFF",
} as const;

function maakEaoCodeTabel(
  inbreuk: WordInbreuk,
): Table {
  const rijen = [
    {
      label: "Afwijkende gebeurtenis",
      optie: zoekEaoCode(
        "afwijkendeGebeurtenissen",
        inbreuk.afwijkendeGebeurtenisCode ??
          "",
      ),
      verkortCode: false,
    },
    {
      label: "Betrokken voorwerp",
      optie: zoekEaoCode(
        "betrokkenVoorwerpen",
        inbreuk.betrokkenVoorwerpCode ?? "",
      ),
      verkortCode: false,
    },
    {
      label: "Soort letsel",
      optie: zoekEaoCode(
        "soortenLetsel",
        inbreuk.soortLetselCode ?? "",
      ),
      verkortCode: true,
    },
  ];

  return new Table({
    width: {
      size: 8755,
      type: WidthType.DXA,
    },
    indent: {
      size: 1441,
      type: WidthType.DXA,
    },
    columnWidths: [1400, 7355],
    layout: TableLayoutType.FIXED,
    borders: {
      top: GEEN_TABELRAND,
      bottom: GEEN_TABELRAND,
      left: GEEN_TABELRAND,
      right: GEEN_TABELRAND,
      insideHorizontal: GEEN_TABELRAND,
      insideVertical: GEEN_TABELRAND,
    },
    rows: rijen.map(
      ({ label, optie, verkortCode }) =>
        new TableRow({
          children: [
            new TableCell({
              width: {
                size: 1400,
                type: WidthType.DXA,
              },
              verticalAlign:
                VerticalAlign.CENTER,
              margins: {
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
              },
              borders: {
                top: GEEN_TABELRAND,
                bottom: GEEN_TABELRAND,
                left: GEEN_TABELRAND,
                right: GEEN_TABELRAND,
              },
              children: [
                new Paragraph({
                  alignment:
                    AlignmentType.LEFT,
                  spacing: {
                    before: 0,
                    after: 0,
                    line:
                      ENKELE_REGELAFSTAND,
                  },
                  children: [
                    new TextRun({
                      text: label,
                      size:
                        HOOFDTEKST_GROOTTE,
                      font: LETTERTYPE,
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: {
                size: 7355,
                type: WidthType.DXA,
              },
              verticalAlign:
                VerticalAlign.CENTER,
              margins: {
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
              },
              borders: {
                top: GEEN_TABELRAND,
                bottom: GEEN_TABELRAND,
                left: GEEN_TABELRAND,
                right: GEEN_TABELRAND,
              },
              children: [
                new Paragraph({
                  alignment:
                    AlignmentType.JUSTIFIED,
                  spacing: {
                    before: 0,
                    after: 0,
                    line:
                      ENKELE_REGELAFSTAND,
                  },
                  children: [
                    new ThemaGrijzeTekstRun({
                      text: optie
                        ? `${verkortCode
                            ? optie.code.replace(
                                /^0/,
                                "",
                              )
                            : optie.code} – ${optie.omschrijving}`
                        : "Niet ingevuld",
                      size:
                        HOOFDTEKST_GROOTTE,
                      font: LETTERTYPE,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
    ),
  });
}

function maakEaoInbreukOnderdelen(
  inbreuk: WordInbreuk,
  index: number,
  gegevens: WordOngevalsgegevens,
): Array<Paragraph | Table> {
  const volledigeNaam = [
    gegevens.slachtofferVoornaam.trim(),
    gegevens.slachtofferNaam
      .trim()
      .toLocaleUpperCase("nl-BE"),
  ]
    .filter(Boolean)
    .join(" ");

  const onderdelen: Array<
    Paragraph | Table
  > = [
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      numbering: {
        reference:
          INBREUK_NUMMERING_REFERENTIE,
        level: 0,
      },
      spacing: {
        before: index === 0 ? 40 : 0,
        after: 0,
        line: ENKELE_REGELAFSTAND,
      },
      keepNext: true,
      children: maakOpgemaakteRuns(
        inbreuk.beschrijving,
        inbreuk.beschrijvingOpmaak,
        {
          grootte:
            HOOFDTEKST_GROOTTE,
        },
      ),
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      indent: {
        left:
          SITUERING_TEKST_INSPrONG,
        hanging: HANGENDE_INSPrONG,
      },
      tabStops: [
        {
          type: TabStopType.LEFT,
          position:
            SITUERING_TEKST_INSPrONG,
        },
      ],
      spacing: {
        before: 0,
        after: 0,
        line: ENKELE_REGELAFSTAND,
      },
      keepNext: true,
      children: [
        new TextRun({
          text: "☐",
          size: HOOFDTEKST_GROOTTE,
          font: LETTERTYPE,
        }),
        new TextRun({
          text: "\t",
          font: LETTERTYPE,
        }),
        new TextRun({
          text: `Het betreft het ongeval van de heer ${volledigeNaam}, d.d. ${formatteerDatumVoorWord(
            gegevens.ongevalsdatum,
          )} met volgende codes:`,
          size: HOOFDTEKST_GROOTTE,
          font: LETTERTYPE,
        }),
      ],
    }),
    maakEaoCodeTabel(inbreuk),
  ];

  const werkhervatting =
    gegevens.slachtofferWerkHervat === null
      ? ""
      : gegevens.slachtofferWerkHervat
        ? gegevens.werkhervattingsdatum
          ? `Het slachtoffer heeft het werk pas op ${formatteerLangeDatumVoorWord(
              gegevens.werkhervattingsdatum,
            )} hervat.`
          : "Het slachtoffer heeft het werk inmiddels hervat."
        : "Het slachtoffer heeft het werk nog niet hervat.";

  const werkhervattingParagrafen: Paragraph[] =
    [];
  voegGewoneTekstParagrafenToe(
    werkhervattingParagrafen,
    werkhervatting,
    {
      inspringingLinks:
        TEKST_INSPrONG,
      afstandVoor: 0,
      afstandNa: 0,
    },
  );
  onderdelen.push(
    ...werkhervattingParagrafen,
  );

  onderdelen.push(
    ...maakFotoParagrafen(
      inbreuk.fotos,
    ),
  );

  const wettelijkeParagrafen: Paragraph[] =
    [];
  voegGewoneTekstParagrafenToe(
    wettelijkeParagrafen,
    inbreuk.wettelijkeVerwijzing,
    {
      cursief: true,
      kleur: "000000",
      grootte:
        WETTELIJKE_VERWIJZING_GROOTTE,
      inspringingLinks:
        TEKST_INSPrONG,
      afstandVoor:
        AFSTAND_VOOR_WETTELIJKE_VERWIJZING,
      afstandNa:
        AFSTAND_NA_WETTELIJKE_VERWIJZING,
      regelafstand:
        ENKELE_REGELAFSTAND,
    },
  );
  onderdelen.push(...wettelijkeParagrafen);

  return onderdelen;
}

function maakOngevalsParagrafen(
  gegevens?: WordOngevalsgegevens | null,
): Paragraph[] {
  if (!gegevens) {
    return [];
  }

  const volledigeNaam = [
    gegevens.slachtofferVoornaam.trim(),
    gegevens.slachtofferNaam.trim(),
  ]
    .filter(Boolean)
    .join(" ");

  const tekst = [
    "Het ernstig arbeidsongeval werd ter plaatse besproken en de voortgang van het actieplan werd geëvalueerd.",
    gegevens.slachtofferWerkHervat ===
      null
      ? ""
      : gegevens.slachtofferWerkHervat
        ? "Het slachtoffer heeft het werk inmiddels hervat."
        : "Het slachtoffer heeft het werk nog niet hervat.",
    gegevens.werkpostBezocht
      ? "Ook de werkpost waar het ongeval plaatsvond, werd bezocht."
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  return [
    new Paragraph({
      numbering: {
        reference:
          VERSLAG_ONDERDELEN_NUMMERING_REFERENTIE,
        level: 0,
      },
      spacing: {
        before: 240,
        after: 120,
        line: ENKELE_REGELAFSTAND,
      },
      keepNext: true,
      children: [
        new TextRun({
          text: `Ongeval ${volledigeNaam}, d.d. ${formatteerDatumVoorWord(
            gegevens.ongevalsdatum,
          )}`,
          bold: true,
          underline: {},
          size: HOOFDTEKST_GROOTTE,
          font: LETTERTYPE,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      indent: {
        left: NUMMER_INSPrONG,
      },
      spacing: {
        before: 0,
        after: 120,
        line: ENKELE_REGELAFSTAND,
      },
      children: [
        new TextRun({
          text: tekst,
          size: HOOFDTEKST_GROOTTE,
          font: LETTERTYPE,
        }),
      ],
    }),
  ];
}

export function maakWordDocument(inspectie: WordInspectie): Document {
  const heeftAndereOpmerkingen =
    inspectie.andereOpmerkingen?.some(
      (opmerking) => opmerking.trim().length > 0,
    ) ?? false;

  if (
    inspectie.inbreuken.length === 0 &&
    !inspectie.ernstigArbeidsongeval &&
    !heeftAndereOpmerkingen
  ) {
    throw new Error(
      "Er zijn geen inbreuken om te exporteren.",
    );
  }

  return new Document({
    creator:
      inspectie.inspecteur ||
      "TWW Inbreuken",
    title: `${tekstOfStreepje(
      inspectie.flow,
    )} ${tekstOfStreepje(
      inspectie.onderneming,
    )} - Inbreuken`,
    description:
      "Automatisch gegenereerd inspectieverslag met inbreuken",
    numbering: {
      config: [
        {
          reference:
            INBREUK_NUMMERING_REFERENTIE,
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: "%1.",
              alignment: AlignmentType.LEFT,
              suffix: LevelSuffix.TAB,
              style: {
                run: {
                  font: LETTERTYPE,
                  size: HOOFDTEKST_GROOTTE,
                },
                paragraph: {
                  indent: {
                    left: TEKST_INSPrONG,
                    hanging:
                      HANGENDE_INSPrONG,
                  },
                },
              },
            },
          ],
        },
        {
          reference:
            VERSLAG_ONDERDELEN_NUMMERING_REFERENTIE,
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: "%1.",
              alignment: AlignmentType.LEFT,
              suffix: LevelSuffix.TAB,
              style: {
                run: {
                  font: LETTERTYPE,
                  size: HOOFDTEKST_GROOTTE,
                  bold: true,
                },
                paragraph: {
                  indent: {
                    left: TEKST_INSPrONG,
                    hanging:
                      HANGENDE_INSPrONG,
                  },
                },
              },
            },
          ],
        },
        {
          reference:
            ONTMOETE_PERSONEN_NUMMERING_REFERENTIE,
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "•",
              alignment: AlignmentType.LEFT,
              suffix: LevelSuffix.TAB,
              style: {
                run: {
                  font: LETTERTYPE,
                  size: HOOFDTEKST_GROOTTE,
                },
                paragraph: {
                  indent: {
                    left:
                      SITUERING_TEKST_INSPrONG,
                    hanging:
                      HANGENDE_INSPrONG,
                  },
                },
              },
            },
          ],
        },
        {
          reference:
            ANDERE_OPMERKINGEN_NUMMERING_REFERENTIE,
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: "%1.",
              alignment: AlignmentType.LEFT,
              suffix: LevelSuffix.TAB,
              style: {
                run: {
                  font: LETTERTYPE,
                  size: HOOFDTEKST_GROOTTE,
                },
                paragraph: {
                  indent: {
                    left: TEKST_INSPrONG,
                    hanging:
                      HANGENDE_INSPrONG,
                  },
                },
              },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 11906,
              height: 16838,
            },
            margin: {
              top: 850,
              right: 850,
              bottom: 560,
              left: 850,
              footer: 709,
            },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment:
                  AlignmentType.RIGHT,
                border: {
                  top: {
                    color: "0070C0",
                    size: 4,
                    space: 1,
                    style:
                      BorderStyle.SINGLE,
                  },
                },
                children: [
                  new TextRun({
                    color: "0070C0",
                    size: 14,
                    font: LETTERTYPE,
                    children: [
                      `${tekstOfStreepje(
                        inspectie.flow,
                      )} - `,
                      "Pagina ",
                      PageNumber.CURRENT,
                      "/",
                      PageNumber.TOTAL_PAGES,
                    ],
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          new Paragraph({
            alignment:
              AlignmentType.JUSTIFIED,
            indent: {
              left: SJABLOON_LINKERLIJN,
            },
            spacing: {
              after: 120,
              line:
                ENKELE_REGELAFSTAND,
            },
            children: [
              new TextRun({
                text: "BIJLAGE – INSPECTIEVERSLAG",
                bold: true,
                color: "000000",
                size:
                  HOOFDTEKST_GROOTTE,
                font: LETTERTYPE,
              }),
            ],
          }),

          ...maakOntmoetePersonenParagrafen(
            inspectie.ontmoetePersonen,
          ),

          ...maakVaststellingenInleiding(),

          ...inspectie.inbreuken.flatMap(
            (inbreuk, index) => {
              if (
                inbreuk.inbreukType ===
                  "EAO_CODES" &&
                inspectie.ernstigArbeidsongeval
              ) {
                return maakEaoInbreukOnderdelen(
                  inbreuk,
                  index,
                  inspectie.ernstigArbeidsongeval,
                );
              }

              return maakInbreukParagrafen(
                inbreuk,
                index,
              );
            },
          ),

          ...(inspectie.inbreuken.some(
            (inbreuk) =>
              inbreuk.inbreukType ===
              "EAO_CODES",
          )
            ? []
            : maakOngevalsParagrafen(
                inspectie.ernstigArbeidsongeval,
              )),

          ...maakAndereOpmerkingenParagrafen(
            inspectie.andereOpmerkingen,
          ),
        ],
      },
    ],
  });
}

export async function downloadWordVerslag(
  inspectie: WordInspectie,
): Promise<void> {
  const document = maakWordDocument(inspectie);

  const blob =
    await Packer.toBlob(document);

  const objectUrl =
    URL.createObjectURL(blob);

  const link =
    window.document.createElement("a");

  const flow = veiligeBestandsnaam(
    inspectie.flow.replace(/\//g, " "),
  );

  const onderneming =
    veiligeBestandsnaam(
      inspectie.onderneming.toUpperCase(),
    );

  const bestandsdelen = [
    flow !== "inspectie" ? flow : "",
    onderneming !== "inspectie"
      ? onderneming
      : "",
  ].filter(Boolean);

  link.href = objectUrl;
  link.download = `${
    bestandsdelen.join(" ") ||
    "Inspectie"
  } - Inbreuken.docx`;

  window.document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 1000);
}
