import type { TekstSegment } from "@/bibliotheek";

import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  ImageRun,
  PageNumber,
  Packer,
  Paragraph,
  TabStopType,
  TextRun,
} from "docx";

export type WordFoto = {
  naam: string;
  data: Uint8Array;
  breedte: number;
  hoogte: number;
};

export type WordInbreuk = {
  beschrijving: string;
  beschrijvingOpmaak?: TekstSegment[];
  inCasu: string;
  specifiekeElementen?: string[];
  specifiekeElementenAlsSituering?: boolean;
  fotos?: WordFoto[];
  toelichting: string;
  aanvulling: string;
  aanvullingOpmaak?: TekstSegment[];
  wettelijkeVerwijzing: string;
};

export type WordInspectie = {
  onderneming: string;
  adres: string;
  inspectiedatum: string;
  inspecteur: string;
  flow: string;
  inbreuken: WordInbreuk[];
};

const LETTERTYPE = "Verdana";

const DONKERBLAUW = "1F4E78";
const DONKERGRIJS = "595959";
const LICHTGRIJS = "D9E2F3";

const HOOFDTEKST_GROOTTE = 20; // 10 pt
const WETTELIJKE_VERWIJZING_GROOTTE = 18; // 9 pt
const ENKELE_REGELAFSTAND = 240;
const AFSTAND_NA_WETTELIJKE_VERWIJZING = 360;

// ImageRun gebruikt pixels. 5 cm bij 96 dpi is ongeveer 189 px.
const FOTO_HOOGTE_PX = 189;

// De nummers en opsommingstekens beginnen links van de tekst.
// Alle vervolgregels beginnen exact op dezelfde positie als de hoofdtekst.
const TEKST_INSPrONG = 540;
const HANGENDE_INSPrONG = 360;

// De vaststelling krijgt een extra niveau:
// het vierkante teken begint waar de gewone inbreuktekst begint,
// en de tekst van de vaststelling begint na het teken.
const SITUERING_TEKST_INSPrONG =
  TEKST_INSPrONG + HANGENDE_INSPrONG;

// Specifieke elementen staan één tabniveau verder dan de vaststelling.
// Het kleine vierkant begint waar de tekst van de vaststelling begint.
const SPECIFIEK_ELEMENT_TEKST_INSPrONG =
  SITUERING_TEKST_INSPrONG + HANGENDE_INSPrONG;

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

      runs.push(
        new TextRun({
          text: regel,
          bold:
            opties?.standaardVet === true ||
            segment.vet === true,
          color: segment.donkergrijs
            ? "666666"
            : "000000",
          size:
            opties?.grootte ??
            HOOFDTEKST_GROOTTE,
          font: LETTERTYPE,
        }),
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
          new TextRun({
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

function maakHorizontaleLijn(): Paragraph {
  return new Paragraph({
    border: {
      bottom: {
        color: LICHTGRIJS,
        size: 8,
        space: 1,
        style: BorderStyle.SINGLE,
      },
    },
    spacing: {
      before: 80,
      after: 220,
    },
  });
}

function maakGegevensregel(
  label: string,
  waarde: string,
): Paragraph {
  return new Paragraph({
    tabStops: [
      {
        type: TabStopType.LEFT,
        position: 2000,
      },
    ],
    spacing: {
      after: 70,
    },
    children: [
      new TextRun({
        text: label,
        bold: true,
        color: DONKERGRIJS,
        size: 20,
        font: LETTERTYPE,
      }),
      new TextRun({
        text: "\t",
        font: LETTERTYPE,
      }),
      new TextRun({
        text: tekstOfStreepje(waarde),
        size: 20,
        font: LETTERTYPE,
      }),
    ],
  });
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

  return fotos.map((foto) => {
    const verhouding =
      foto.hoogte > 0 &&
      foto.breedte > 0
        ? foto.breedte / foto.hoogte
        : 1;

    const berekendeBreedte = Math.max(
      1,
      Math.round(
        FOTO_HOOGTE_PX * verhouding,
      ),
    );

    return new Paragraph({
      indent: {
        left: TEKST_INSPrONG,
      },
      spacing: {
        before: 50,
        after: 140,
      },
      children: [
        new ImageRun({
          data: foto.data,
          type: "png",
          transformation: {
            width: berekendeBreedte,
            height: FOTO_HOOGTE_PX,
          },
          altText: {
            title: foto.naam,
            description: foto.naam,
            name: foto.naam,
          },
        }),
      ],
    });
  });
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
      indent: {
        left: TEKST_INSPrONG,
        hanging: HANGENDE_INSPrONG,
      },
      tabStops: [
        {
          type: TabStopType.LEFT,
          position: TEKST_INSPrONG,
        },
      ],
      spacing: {
        before:
          index === 0 ? 40 : 0,
        after: 0,
        line: ENKELE_REGELAFSTAND,
      },
      keepNext: true,
      children: [
        new TextRun({
          text: `${index + 1}.`,
          bold: false,
          size: HOOFDTEKST_GROOTTE,
          font: LETTERTYPE,
        }),
        new TextRun({
          text: "\t",
          font: LETTERTYPE,
        }),
        ...beschrijvingsRuns,
      ],
    }),
  ];

  voegSitueringToe(
    kinderen,
    inbreuk.inCasu,
    inbreuk.specifiekeElementen,
    inbreuk.specifiekeElementenAlsSituering,
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
      kleur: DONKERGRIJS,
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
      afstandVoor: 0,
      afstandNa:
        AFSTAND_NA_WETTELIJKE_VERWIJZING,
      regelafstand:
        ENKELE_REGELAFSTAND,
    },
  );

  return kinderen;
}

export function maakWordDocument(inspectie: WordInspectie): Document {
  if (inspectie.inbreuken.length === 0) {
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
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 900,
              right: 1134,
              bottom: 900,
              left: 1134,
            },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment:
                  AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    color: DONKERGRIJS,
                    size: 18,
                    font: LETTERTYPE,
                    children: [
                      "Pagina ",
                      PageNumber.CURRENT,
                      " van ",
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
            spacing: {
              after: 40,
            },
            children: [
              new TextRun({
                text: "INSPECTIEVERSLAG",
                bold: true,
                color: DONKERBLAUW,
                size: 36,
                font: LETTERTYPE,
              }),
            ],
          }),

          new Paragraph({
            spacing: {
              after: 180,
            },
            children: [
              new TextRun({
                text: "INBREUKEN",
                bold: true,
                color: DONKERGRIJS,
                size: 24,
                font: LETTERTYPE,
              }),
            ],
          }),

          maakGegevensregel(
            "Onderneming",
            inspectie.onderneming.toUpperCase(),
          ),
          maakGegevensregel(
            "Flow",
            inspectie.flow,
          ),
          maakGegevensregel(
            "Adres",
            inspectie.adres,
          ),
          maakGegevensregel(
            "Inspectiedatum",
            inspectie.inspectiedatum,
          ),
          maakGegevensregel(
            "Inspecteur",
            inspectie.inspecteur,
          ),

          maakHorizontaleLijn(),

          ...inspectie.inbreuken.flatMap(
            maakInbreukParagrafen,
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
