import {
  decodePDFRawStream,
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFFont,
  PDFName,
  PDFPage,
  PDFRawStream,
  rgb,
} from "pdf-lib";

import type { RokenRapportGegevens } from "@/lib/roken-word-export";

export const ROKEN_PDF_SJABLOON_PAD =
  "/sjablonen/105-roken-sjabloon.pdf";
export const ROKEN_PDF_SJABLOON_SHA256 =
  "afcd501e417a4c135c3ef759fbd1732201cafa4b2c0616ec7e5f69c3d035faaf";
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
  const wisOnderMarge = veld.lettergrootte * 0.24;
  const wisHoogte = veld.lettergrootte * 1.06;

  pagina.drawRectangle({
    x: (veld.wisX ?? veld.x) - 1,
    y: basislijn - wisOnderMarge,
    width: veld.wisBreedte + 2,
    // Wis uitsluitend de oorspronkelijke veldtekst. De vroegere hogere
    // rechthoek raakte de staarten van letters (zoals de j) in de regel erboven.
    height: wisHoogte,
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

function haalIngebedLettertypeOp(
  pdf: PDFDocument,
  pagina: PDFPage,
  naam: "Verdana" | "Verdana-Bold" | "Verdana-Italic",
): Uint8Array {
  const bronnen = pagina.node.Resources();
  if (!bronnen) {
    throw new Error("Het goedgekeurde PDF-sjabloon bevat geen lettertypebronnen.");
  }
  const lettertypes = bronnen.lookup(PDFName.of("Font"), PDFDict);

  for (const [, verwijzing] of lettertypes.entries()) {
    const hoofdlettertype = pdf.context.lookup(verwijzing, PDFDict);
    const afstammelingen = hoofdlettertype.lookupMaybe(
      PDFName.of("DescendantFonts"),
      PDFArray,
    );
    const lettertype = afstammelingen
      ? pdf.context.lookup(afstammelingen.get(0), PDFDict)
      : hoofdlettertype;
    const basisnaam = lettertype.get(PDFName.of("BaseFont"))?.toString() ?? "";

    // De volledige, door het goedgekeurde documentsjabloon ingebedde fonts
    // hebben geen Word-subsetprefix (zoals AAAAAA+). Zo vermijden we dat een
    // afwijkend browser- of systeemlettertype wordt gebruikt.
    const juisteVariant =
      naam === "Verdana"
        ? /^\/Verdana-\d+$/.test(basisnaam)
        : new RegExp(`^\\/${naam}-\\d+$`).test(basisnaam);

    if (!juisteVariant) continue;

    const omschrijving = lettertype.lookup(
      PDFName.of("FontDescriptor"),
      PDFDict,
    );
    const bestandVerwijzing = omschrijving.get(PDFName.of("FontFile2"));
    if (!bestandVerwijzing) continue;

    const bestand = pdf.context.lookup(bestandVerwijzing);
    if (!(bestand instanceof PDFRawStream)) continue;

    return decodePDFRawStream(bestand).decode();
  }

  throw new Error(
    `Het goedgekeurde PDF-sjabloon bevat het vereiste lettertype ${naam} niet.`,
  );
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
  const { default: fontkit } = await import("@pdf-lib/fontkit");
  pdf.registerFontkit(fontkit);
  const normaal = await pdf.embedFont(
    haalIngebedLettertypeOp(pdf, pagina, "Verdana"),
    { subset: true },
  );
  const vet = await pdf.embedFont(
    haalIngebedLettertypeOp(pdf, pagina, "Verdana-Bold"),
    { subset: true },
  );
  const cursief = await pdf.embedFont(
    haalIngebedLettertypeOp(pdf, pagina, "Verdana-Italic"),
    { subset: true },
  );
  const blauw = rgb(0.12, 0.5, 0.82);
  const postcodePlaats = `${gegevens.postcode} ${gegevens.plaats}`.trim();
  const bestelwagenHoofdtekst = "Cabine van een bestelwagen";
  const bestelwagenToelichting = "(gesloten ruimte buiten onderneming)";
  const isBestelwagen = gegevens.werkruimte.startsWith(bestelwagenHoofdtekst);
  const werkruimteHoofdtekst = isBestelwagen
    ? bestelwagenHoofdtekst
    : gegevens.werkruimte;

  const velden: Invulveld[] = [
    {
      x: 74.5,
      onderkantVanafBoven: 161.15,
      wisBreedte: 230,
      maximaleTekstbreedte: 230,
      lettergrootte: 10,
      minimaleLettergrootte: 8,
      tekst: gegevens.onderneming,
      lettertype: normaal,
    },
    {
      x: 74.5,
      onderkantVanafBoven: 185.45,
      wisBreedte: 260,
      maximaleTekstbreedte: 260,
      lettergrootte: 10,
      minimaleLettergrootte: 8,
      tekst: gegevens.straatEnNummer,
      lettertype: normaal,
    },
    {
      x: 74.5,
      onderkantVanafBoven: 197.6,
      wisBreedte: 260,
      maximaleTekstbreedte: 260,
      lettergrootte: 10,
      minimaleLettergrootte: 8,
      tekst: postcodePlaats,
      lettertype: normaal,
    },
    {
      x: 219.85,
      onderkantVanafBoven: 265.9,
      wisBreedte: 65,
      maximaleTekstbreedte: 65,
      lettergrootte: 7,
      tekst: gegevens.kboNummer,
      lettertype: normaal,
    },
    {
      x: 354.5,
      onderkantVanafBoven: 265.9,
      wisBreedte: 70,
      maximaleTekstbreedte: 70,
      lettergrootte: 7,
      tekst: gegevens.flow,
      lettertype: normaal,
    },
    {
      x: 488.4,
      onderkantVanafBoven: 265.9,
      wisBreedte: 45,
      maximaleTekstbreedte: 45,
      lettergrootte: 7,
      tekst: gegevens.rapportDatum,
      lettertype: normaal,
    },
    {
      x: 98.93,
      onderkantVanafBoven: 367.65,
      wisBreedte: 60,
      maximaleTekstbreedte: 61.5,
      lettergrootte: 10,
      tekst: gegevens.vaststellingsDatum,
      lettertype: normaal,
    },
    {
      x: 219.65,
      onderkantVanafBoven: 513.15,
      wisBreedte: 310,
      maximaleTekstbreedte: 310,
      lettergrootte: 10,
      minimaleLettergrootte: 8.5,
      tekst: werkruimteHoofdtekst,
      lettertype: normaal,
    },
    {
      x: 219.65,
      onderkantVanafBoven: 531.3,
      wisBreedte: 305,
      maximaleTekstbreedte: 305,
      lettergrootte: 10,
      minimaleLettergrootte: 8.5,
      tekst: gegevens.locatie,
      lettertype: normaal,
    },
    {
      x: 273.63,
      wisX: 272.5,
      onderkantVanafBoven: 549.45,
      wisBreedte: 38,
      maximaleTekstbreedte: 38,
      lettergrootte: 10,
      tekst: gegevens.tijdstip,
      lettertype: normaal,
    },
    {
      x: 219.65,
      onderkantVanafBoven: 567.6,
      wisBreedte: 65,
      maximaleTekstbreedte: 65,
      lettergrootte: 10,
      tekst: gegevens.nummerplaat,
      lettertype: normaal,
    },
    {
      x: 456.05,
      wisX: 450,
      onderkantVanafBoven: 804.97,
      wisBreedte: 112,
      maximaleTekstbreedte: 106,
      lettergrootte: 7,
      minimaleLettergrootte: 6,
      tekst: `${gegevens.flow} - Pagina 1/1`,
      lettertype: normaal,
      kleur: blauw,
    },
  ];

  velden.forEach((veld) => vulVeldIn(pagina, veld));

  if (isBestelwagen) {
    const werkruimteX = 219.65;
    const werkruimteBasislijn = pagina.getHeight() - 513.15;
    pagina.drawText(bestelwagenToelichting, {
      x:
        werkruimteX +
        normaal.widthOfTextAtSize(bestelwagenHoofdtekst, 10) +
        4,
      y: werkruimteBasislijn + 0.25,
      size: 8,
      font: normaal,
      color: rgb(0.38, 0.38, 0.38),
    });
  }

  // Het goedgekeurde sjabloon bevat hier “art. 13, van”. Verwijder uitsluitend
  // die overbodige komma en behoud positie, lettertype en lettergrootte.
  const wettelijkeVerwijzingOnderkant = pagina.getHeight() - 586.632;
  pagina.drawRectangle({
    x: 260.5,
    y: wettelijkeVerwijzingOnderkant - 1.5,
    width: 36.5,
    height: 11.5,
    color: rgb(1, 1, 1),
  });
  pagina.drawText("13 van", {
    x: 261.088,
    // pdf-lib plaatst Verdana-Italic 1,89 punt onder de opgegeven tekst-y.
    // Deze correctie zet de zichtbare letteronderkant exact op de bronregel.
    y: wettelijkeVerwijzingOnderkant + 1.89,
    size: 9,
    font: cursief,
  });

  // De lengte van een flownummer varieert. Daarom wordt het volledige einde
  // van deze zin opnieuw geplaatst, zodat “vermelden.” altijd direct aansluit
  // en nooit over de waarde heen schuift.
  const referentieBasislijn = pagina.getHeight() - 631.8;
  pagina.drawRectangle({
    x: 395.5,
    y: referentieBasislijn - 2,
    width: 148,
    height: 14,
    color: rgb(1, 1, 1),
  });
  pagina.drawText(gegevens.flow, {
    x: 396.65,
    y: referentieBasislijn,
    size: 10,
    font: vet,
  });
  pagina.drawText(" vermelden.", {
    x: 396.65 + vet.widthOfTextAtSize(gegevens.flow, 10),
    y: referentieBasislijn,
    size: 10,
    font: normaal,
  });

  pdf.setTitle(`Schriftelijke waarschuwing roken - ${gegevens.onderneming}`);
  pdf.setAuthor("Bart Degroote");
  pdf.setSubject("Schriftelijke waarschuwing 105 - roken");
  pdf.setCreator("WebApp TWW");
  pdf.setProducer("WebApp TWW");

  return pdf.save({ useObjectStreams: false });
}
