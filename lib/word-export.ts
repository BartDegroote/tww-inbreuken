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
  TabStopPosition,
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

const ARIAL = "Arial";
const DONKERBLAUW = "1F4E78";
const DONKERGRIJS = "595959";
const LICHTGRIJS = "D9E2F3";
const FOTO_HOOGTE_PX = 189;
const SITUERING_TEKST_INSPrONG = 360;

function veiligeBestandsnaam(waarde: string): string {
  const opgeschoond = waarde
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\.+$/g, "");

  return opgeschoond || "inspectie";
}

function tekstOfStreepje(waarde: string): string {
  return waarde.trim() || "-";
}

function geldigeSegmenten(
  tekst: string,
  segmenten?: TekstSegment[],
): TekstSegment[] {
  if (
    segmenten &&
    segmenten.length > 0 &&
    segmenten.some((segment) => segment.tekst.length > 0)
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

  for (const segment of geldigeSegmenten(tekst, segmenten)) {
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

      if (regel.length > 0) {
        runs.push(
          new TextRun({
            text: regel,
            bold:
              opties?.standaardVet === true ||
              segment.vet === true,
            color: segment.donkergrijs
              ? "666666"
              : "000000",
            size: opties?.grootte ?? 22,
            font: ARIAL,
          }),
        );
      }
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
    afstandVoor?: number;
    afstandNa?: number;
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
      index === 0 ? opties?.prefix ?? "" : "";

    kinderen.push(
      new Paragraph({
        indent:
          opties?.inspringingLinks !== undefined
            ? {
                left: opties.inspringingLinks,
              }
            : undefined,
        spacing: {
          before:
            index === 0
              ? opties?.afstandVoor ?? 0
              : 0,
          after: opties?.afstandNa ?? 80,
          line: 276,
        },
        children: [
          new TextRun({
            text: `${prefix}${regel}`,
            bold: opties?.vet,
            italics: opties?.cursief,
            color: opties?.kleur ?? "000000",
            size: opties?.grootte ?? 22,
            font: ARIAL,
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
        font: ARIAL,
      }),
      new TextRun({
        text: "\t",
      }),
      new TextRun({
        text: tekstOfStreepje(waarde),
        size: 20,
        font: ARIAL,
      }),
    ],
  });
}

function voegSitueringToe(
  kinderen: Paragraph[],
  tekst: string,
) {
  const opgeschoondeTekst = tekst.trim();

  if (!opgeschoondeTekst) {
    return;
  }

  const regels = opgeschoondeTekst
    .replace(/\r\n/g, "\n")
    .split("\n");

  kinderen.push(
    new Paragraph({
      tabStops: [
        {
          type: TabStopType.LEFT,
          position: SITUERING_TEKST_INSPrONG,
        },
      ],
      spacing: {
        before: 80,
        after: 90,
        line: 276,
      },
      children: [
        new TextRun({
          text: "☐",
          size: 22,
          font: ARIAL,
        }),
        new TextRun({
          text: "\t",
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
              size: 22,
              font: ARIAL,
            }),
          );

          return runs;
        }),
      ],
    }),
  );
}

function maakFotoParagrafen(
  fotos?: WordFoto[],
): Paragraph[] {
  if (!fotos?.length) {
    return [];
  }

  return fotos.map((foto) => {
    const verhouding =
      foto.hoogte > 0 && foto.breedte > 0
        ? foto.breedte / foto.hoogte
        : 1;

    const berekendeBreedte = Math.max(
      1,
      Math.round(FOTO_HOOGTE_PX * verhouding),
    );

    return new Paragraph({
      indent: {
        left: SITUERING_TEKST_INSPrONG,
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
  const beschrijvingsRuns = maakOpgemaakteRuns(
    inbreuk.beschrijving,
    inbreuk.beschrijvingOpmaak,
    {
      grootte: 24,
    },
  );

  const kinderen: Paragraph[] = [
    new Paragraph({
      spacing: {
        before: index === 0 ? 40 : 260,
        after: 130,
        line: 300,
      },
      keepNext: true,
      children: [
        new TextRun({
          text: `${index + 1}. `,
          bold: true,
          size: 24,
          font: ARIAL,
        }),
        ...beschrijvingsRuns,
      ],
    }),
  ];

  voegSitueringToe(kinderen, inbreuk.inCasu);

  kinderen.push(
    ...maakFotoParagrafen(inbreuk.fotos),
  );

  voegGewoneTekstParagrafenToe(
    kinderen,
    inbreuk.toelichting,
    {
      prefix: "ⓘ ",
      kleur: DONKERGRIJS,
      grootte: 21,
      afstandVoor: 60,
      afstandNa: 100,
    },
  );

  const aanvullingRuns = maakOpgemaakteRuns(
    inbreuk.aanvulling,
    inbreuk.aanvullingOpmaak,
    {
      grootte: 22,
    },
  );

  if (aanvullingRuns.length > 0) {
    kinderen.push(
      new Paragraph({
        spacing: {
          before: 60,
          after: 110,
          line: 276,
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
      kleur: DONKERGRIJS,
      grootte: 20,
      inspringingLinks: 540,
      afstandVoor: 180,
      afstandNa: 180,
    },
  );

  return kinderen;
}

export async function downloadWordVerslag(
  inspectie: WordInspectie,
): Promise<void> {
  if (inspectie.inbreuken.length === 0) {
    throw new Error(
      "Er zijn geen inbreuken om te exporteren.",
    );
  }

  const document = new Document({
    creator:
      inspectie.inspecteur || "TWW Inbreuken",
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
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    color: DONKERGRIJS,
                    size: 18,
                    font: ARIAL,
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
                font: ARIAL,
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
                font: ARIAL,
              }),
            ],
          }),

          maakGegevensregel(
            "Onderneming",
            inspectie.onderneming.toUpperCase(),
          ),
          maakGegevensregel("Flow", inspectie.flow),
          maakGegevensregel("Adres", inspectie.adres),
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

  const blob = await Packer.toBlob(document);
  const objectUrl = URL.createObjectURL(blob);
  const link = window.document.createElement("a");

  const flow = veiligeBestandsnaam(
    inspectie.flow.replace(/\//g, " "),
  );

  const onderneming = veiligeBestandsnaam(
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
    bestandsdelen.join(" ") || "Inspectie"
  } - Inbreuken.docx`;

  window.document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 1000);
}