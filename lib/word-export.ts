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
  inCasu: string;
  toelichting: string;
  aanvulling: string;
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

function voegTekstParagrafenToe(
  kinderen: Paragraph[],
  tekst: string,
  opties?: {
    prefix?: string;
    cursief?: boolean;
    vet?: boolean;
  },
) {
  const regels = tekst
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

  voegTekstParagrafenToe(
    kinderen,
    inbreuk.beschrijving.trim(),
  );

  if (inbreuk.inCasu.trim()) {
    voegTekstParagrafenToe(
      kinderen,
      inbreuk.inCasu.trim(),
      {
        prefix: "\u2610 ",
      },
    );
  }

  if (inbreuk.toelichting.trim()) {
    voegTekstParagrafenToe(
      kinderen,
      inbreuk.toelichting.trim(),
      {
        prefix: "\u24D8 ",
      },
    );
  }

  if (inbreuk.aanvulling.trim()) {
    voegTekstParagrafenToe(
      kinderen,
      inbreuk.aanvulling.trim(),
      {
        vet: true,
      },
    );
  }

  voegTekstParagrafenToe(
    kinderen,
    inbreuk.wettelijkeVerwijzing.trim(),
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
    creator: inspectie.inspecteur || "TWW Inbreuken",
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
                text: tekstOfStreepje(inspectie.adres),
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