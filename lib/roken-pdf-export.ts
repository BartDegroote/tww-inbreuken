import {
  PDFDocument,
  PDFFont,
  PDFPage,
  StandardFonts,
  rgb,
} from "pdf-lib";

import type { RokenRapportGegevens } from "@/lib/roken-word-export";

export const ROKEN_PDF_SJABLOON_PAD =
  "/sjablonen/105-roken-sjabloon.pdf";
export const ROKEN_PDF_SJABLOON_SHA256 =
  "f0cb5735a894858eac3bbe6b16e9dbfe46ff9beb07d50696a3147db76694cda1";
export const MAX_PDF_LOCATIE_BREEDTESCORE = 63.5;
export const MAX_FLOW_VOLGNUMMER_TEKENS = 8;

type Invulveld = {
  x: number;
  wisX?: number;
  onderkantVanafBoven: number;
  wisBreedte: number;
  maximaleTekstbreedte: number;
  lettergrootte: number;
  minimaleLettergrootte?: number;
  tekst: string;
  lettertype: PDFFont;
  kleur?: ReturnType<typeof rgb>;
};

function veiligeBestandsnaam(waarde: string): string {
  return (
    waarde
      .normalize("NFKC")
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, " ")
      .replace(/\s+/g, " ")
      .trim() || "rapport"
  );
}

export function formatteerRapportDatum(datum = new Date()): string {
  return [
    String(datum.getDate()).padStart(2, "0"),
    String(datum.getMonth() + 1).padStart(2, "0"),
    String(datum.getFullYear()),
  ].join("/");
}

export function maakRokenPdfBestandsnaam(
  flow: string,
  onderneming: string,
): string {
  const flowDeel = veiligeBestandsnaam(flow.replaceAll("/", " "));
  const ondernemingDeel = veiligeBestandsnaam(onderneming.toUpperCase());

  return `${flowDeel} 105 ${ondernemingDeel}.pdf`;
}

export async function controleerRokenPdfSjabloonIntegriteit(
  sjabloon: ArrayBuffer,
): Promise<void> {
  const hash = await globalThis.crypto.subtle.digest("SHA-256", sjabloon);
  const hashHex = Array.from(new Uint8Array(hash), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");

  if (hashHex !== ROKEN_PDF_SJABLOON_SHA256) {
    throw new Error(
      "Het PDF-sjabloon wijkt af van het goedgekeurde origineel. De brief werd daarom niet aangemaakt.",
    );
  }
}

function passendeLettergrootte({
  tekst,
  lettertype,
  lettergrootte,
  minimaleLettergrootte = lettergrootte,
  maximaleTekstbreedte,
}: Pick<
  Invulveld,
  | "tekst"
  | "lettertype"
  | "lettergrootte"
  | "minimaleLettergrootte"
  | "maximaleTekstbreedte"
>): number {
  let grootte = lettergrootte;

  while (
    grootte > minimaleLettergrootte &&
    lettertype.widthOfTextAtSize(tekst, grootte) > maximaleTekstbreedte
  ) {
    grootte = Math.max(minimaleLettergrootte, grootte - 0.25);
  }

  if (lettertype.widthOfTextAtSize(tekst, grootte) > maximaleTekstbreedte) {
    throw new Error(
      `De tekst “${tekst}” is te lang om zonder verschuiving in de brief te plaatsen.`,
    );
  }

  return grootte;
}

function vulVeldIn(pagina: PDFPage, veld: Invulveld): void {
  const paginahoogte = pagina.getHeight();
  const grootte = passendeLettergrootte(veld);
  const basislijn = paginahoogte - veld.onderkantVanafBoven;

  pagina.drawRectangle({
    x: (veld.wisX ?? veld.x) - 1,
    y: basislijn - 1.4,
    width: veld.wisBreedte + 2,
    height: veld.lettergrootte + 3,
    color: rgb(1, 1, 1),
  });
  pagina.drawText(veld.tekst, {
    x: veld.x,
    y: basislijn,
    size: grootte,
    font: veld.lettertype,
    color: veld.kleur ?? rgb(0, 0, 0),
  });
}

export async function maakRokenPdfBuffer(
  sjabloon: ArrayBuffer,
  gegevens: RokenRapportGegevens,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(sjabloon);

  if (pdf.getPageCount() !== 1) {
    throw new Error("Het PDF-sjabloon moet exact één pagina bevatten.");
  }

  const pagina = pdf.getPage(0);
  const normaal = await pdf.embedFont(StandardFonts.TimesRoman);
  const vet = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const blauw = rgb(0.12, 0.5, 0.82);
  const postcodePlaats = `${gegevens.postcode} ${gegevens.plaats}`.trim();

  const velden: Invulveld[] = [
    {
      x: 74.5,
      onderkantVanafBoven: 164.41,
      wisBreedte: 230,
      maximaleTekstbreedte: 230,
      lettergrootte: 10,
      minimaleLettergrootte: 8,
      tekst: gegevens.onderneming,
      lettertype: normaal,
    },
    {
      x: 74.5,
      onderkantVanafBoven: 187.21,
      wisBreedte: 260,
      maximaleTekstbreedte: 260,
      lettergrootte: 10,
      minimaleLettergrootte: 8,
      tekst: gegevens.straatEnNummer,
      lettertype: normaal,
    },
    {
      x: 74.5,
      onderkantVanafBoven: 198.61,
      wisBreedte: 260,
      maximaleTekstbreedte: 260,
      lettergrootte: 10,
      minimaleLettergrootte: 8,
      tekst: postcodePlaats,
      lettertype: normaal,
    },
    {
      x: 219.85,
      onderkantVanafBoven: 266.07,
      wisBreedte: 65,
      maximaleTekstbreedte: 65,
      lettergrootte: 7,
      tekst: gegevens.kboNummer,
      lettertype: normaal,
    },
    {
      x: 354.5,
      onderkantVanafBoven: 266.07,
      wisBreedte: 70,
      maximaleTekstbreedte: 70,
      lettergrootte: 7,
      tekst: gegevens.flow,
      lettertype: normaal,
    },
    {
      x: 488.4,
      onderkantVanafBoven: 266.07,
      wisBreedte: 45,
      maximaleTekstbreedte: 45,
      lettergrootte: 7,
      tekst: gegevens.rapportDatum,
      lettertype: normaal,
    },
    {
      x: 92,
      onderkantVanafBoven: 354.41,
      wisBreedte: 42.5,
      maximaleTekstbreedte: 40,
      lettergrootte: 8.5,
      tekst: gegevens.vaststellingsDatum,
      lettertype: normaal,
    },
    {
      x: 219.65,
      onderkantVanafBoven: 481.01,
      wisBreedte: 305,
      maximaleTekstbreedte: 305,
      lettergrootte: 10,
      minimaleLettergrootte: 8.5,
      tekst: gegevens.werkruimte,
      lettertype: normaal,
    },
    {
      x: 219.65,
      onderkantVanafBoven: 499.61,
      wisBreedte: 305,
      maximaleTekstbreedte: 305,
      lettergrootte: 10,
      minimaleLettergrootte: 8.5,
      tekst: gegevens.locatie,
      lettertype: normaal,
    },
    {
      x: 269,
      wisX: 265.7,
      onderkantVanafBoven: 518.21,
      wisBreedte: 30,
      maximaleTekstbreedte: 30,
      lettergrootte: 10,
      tekst: gegevens.tijdstip,
      lettertype: normaal,
    },
    {
      x: 184.25,
      onderkantVanafBoven: 536.81,
      wisBreedte: 48,
      maximaleTekstbreedte: 48,
      lettergrootte: 10,
      tekst: gegevens.nummerplaat,
      lettertype: normaal,
    },
    {
      x: 361.25,
      onderkantVanafBoven: 602.29,
      wisBreedte: 58,
      maximaleTekstbreedte: 59,
      lettergrootte: 10,
      minimaleLettergrootte: 9,
      tekst: gegevens.flow,
      lettertype: vet,
    },
    {
      x: 482.9,
      onderkantVanafBoven: 806.42,
      wisBreedte: 35,
      maximaleTekstbreedte: 35,
      lettergrootte: 7,
      minimaleLettergrootte: 6,
      tekst: gegevens.flow,
      lettertype: normaal,
      kleur: blauw,
    },
  ];

  velden.forEach((veld) => vulVeldIn(pagina, veld));

  pdf.setTitle(`Schriftelijke waarschuwing roken - ${gegevens.onderneming}`);
  pdf.setAuthor("Bart Degroote");
  pdf.setSubject("Schriftelijke waarschuwing 105 - roken");
  pdf.setCreator("WebApp TWW");
  pdf.setProducer("WebApp TWW");

  return pdf.save({ useObjectStreams: false });
}
