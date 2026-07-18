import type { TekstSegment } from "@/bibliotheek";

import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  TextRun,
} from "docx";

export type WordInbreuk = {
  beschrijving: string;
  beschrijvingOpmaak?: TekstSegment[];
  inCasu: string;
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

function veiligeBestandsnaam(waarde: string): string {
  const opgeschoond = waarde
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
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
    segmenten.some(
      (segment) => segment.tekst.length > 0,
    )
  ) {
    return segmenten;
  }

  return tekst
    ? [
        {
          tekst,
        },
      ]
    : [];
}

function maakOpgemaakteRuns(
  tekst: string,
  segmenten?: TekstSegment[],
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

      if (regel.length > 0) {
        runs.push(
          new TextRun({
            text: regel,
            bold: segment.vet === true,
            color: segment.donkergrijs
              ? "666666"
              : "000000",
            size: 22,
            font: "Arial",
          }),
        );
      }
    });
  }

  return runs;
}

function voegOpgemaakteParagraafToe(
  kinderen: Paragraph[],
  tekst: string,
  segmenten?: TekstSegment[],
) {
  const runs = maakOpgemaakteRuns(
    tekst,
    segmenten,
  );

  if (runs.length === 0) {
    return;
  }

  kinderen.push(
    new Paragraph({
      spacing: {
        after: 100,
        line: 276,
      },
      children: runs,
    }),
  );
}

function voegGewoneTekstParagrafenToe(
  kinderen: Paragraph[],
  tekst: string,
  opties?: {
    prefix?: string;
    cursief?: boolean;
    vet?: boolean;
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
        spacing: {
          after: 80,
          line: 276,
        },
        children: [
          new TextRun({
            text: `${prefix}${regel}`,
            bold: opties?.vet,
            italics: opties?.cursief,
            size: 22,
            font: "Arial",
          }),
        ],
      }),
    );
  });
}

function maakScheidingslijn(): Paragraph {
  return new Paragraph({
    border: {
      bottom: {
        color: "808080",
        size: 6,
        space: 6,
        style: BorderStyle.DASHED,
      },
    },
    spacing: {
      before: 140,
      after: 200,
    },
  });
}

function maakInbreukParagrafen(
  inbreuk: WordInbreuk,
  index: number,
): Paragraph[] {
  const kinderen: Paragraph[] = [
    new Paragraph({
      spacing: {
        before: 80,
        after: 140,
      },
      children: [
        new TextRun({
          text: `${index + 1}.`,
          bold: true,
          size: 24,
          font: "Arial",
        }),
      ],
    }),
  ];

  voegOpgemaakteParagraafToe(
    kinderen,
    inbreuk.beschrijving,
    inbreuk.beschrijvingOpmaak,
  );

  voegGewoneTekstParagrafenToe(
    kinderen,
    inbreuk.inCasu,
    {
      prefix: "☐ ",
    },
  );

  voegGewoneTekstParagrafenToe(
    kinderen,
    inbreuk.toelichting,
    {
      prefix: "ⓘ ",
    },
  );

  voegOpgemaakteParagraafToe(
    kinderen,
    inbreuk.aanvulling,
    inbreuk.aanvullingOpmaak,
  );

  voegGewoneTekstParagrafenToe(
    kinderen,
    inbreuk.wettelijkeVerwijzing,
  );

  kinderen.push(maakScheidingslijn());

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

  const titel = `${tekstOfStreepje(
    inspectie.onderneming,
  ).toUpperCase()}${
    inspectie.flow.trim()
      ? ` - ${inspectie.flow.trim()}`
      : ""
  }`;

  const document = new Document({
    creator:
      inspectie.inspecteur || "TWW Inbreuken",
    title: `Inspectieverslag ${inspectie.onderneming}`,
    description:
      "Automatisch gegenereerd inspectieverslag",
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1134,
              right: 1134,
              bottom: 1134,
              left: 1134,
            },
          },
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: {
              after: 100,
            },
            children: [
              new TextRun({
                text: titel,
                bold: true,
                size: 28,
                font: "Arial",
              }),
            ],
          }),

          new Paragraph({
            spacing: {
              after: 60,
            },
            children: [
              new TextRun({
                text: "Adres: ",
                bold: true,
                size: 22,
                font: "Arial",
              }),
              new TextRun({
                text: tekstOfStreepje(
                  inspectie.adres,
                ),
                size: 22,
                font: "Arial",
              }),
            ],
          }),

          new Paragraph({
            spacing: {
              after: 60,
            },
            children: [
              new TextRun({
                text: "Inspectiedatum: ",
                bold: true,
                size: 22,
                font: "Arial",
              }),
              new TextRun({
                text: tekstOfStreepje(
                  inspectie.inspectiedatum,
                ),
                size: 22,
                font: "Arial",
              }),
            ],
          }),

          new Paragraph({
            spacing: {
              after: 120,
            },
            children: [
              new TextRun({
                text: "Inspecteur: ",
                bold: true,
                size: 22,
                font: "Arial",
              }),
              new TextRun({
                text: tekstOfStreepje(
                  inspectie.inspecteur,
                ),
                size: 22,
                font: "Arial",
              }),
            ],
          }),

          maakScheidingslijn(),

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

  const onderneming = veiligeBestandsnaam(
    inspectie.onderneming,
  );

  const datum = veiligeBestandsnaam(
    inspectie.inspectiedatum,
  );

  link.href = objectUrl;
  link.download = `Inspectieverslag-${onderneming}${
    datum !== "inspectie" ? `-${datum}` : ""
  }.docx`;

  window.document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 1000);
}