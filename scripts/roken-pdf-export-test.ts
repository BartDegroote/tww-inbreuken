import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { PDFDocument } from "pdf-lib";

const SJABLOON_PAD = "public/sjablonen/105-roken-sjabloon.pdf";
const EXPORT_MODULE_PAD = "../lib/roken-pdf-export.ts";

function naarArrayBuffer(buffer: Buffer): ArrayBuffer {
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer;
}

async function voerTestUit() {
  const {
    controleerRokenPdfSjabloonIntegriteit,
    maakRokenPdfBestandsnaam,
    maakRokenPdfBuffer,
  } = await import(EXPORT_MODULE_PAD);
  const sjabloonBuffer = await readFile(SJABLOON_PAD);
  const sjabloon = naarArrayBuffer(sjabloonBuffer);

  await controleerRokenPdfSjabloonIntegriteit(sjabloon);

  const resultaat = await maakRokenPdfBuffer(sjabloon, {
    onderneming: "LiquidFloors",
    straatEnNummer: "Bekaertstraat 8/1",
    postcode: "8550",
    plaats: "Zwevegem",
    kboNummer: "0806.496.206",
    flow: "02/2026/2939",
    rapportDatum: "26/08/2026",
    vaststellingsDatum: "21/08/2026",
    werkruimte:
      "Cabine van een bestelwagen (gesloten ruimte buiten een onderneming)",
    locatie: "E17 ter hoogte van Kruisem",
    tijdstip: "07u34",
    nummerplaat: "2-EDF-682",
  });

  assert.equal(
    new TextDecoder("ascii").decode(resultaat.slice(0, 5)),
    "%PDF-",
    "De export moet een geldig PDF-bestand opleveren.",
  );

  const pdf = await PDFDocument.load(resultaat);
  assert.equal(pdf.getPageCount(), 1, "De rookbrief moet exact één pagina tellen.");
  assert.equal(
    pdf.getTitle(),
    "Schriftelijke waarschuwing roken - LiquidFloors",
  );
  assert.equal(
    maakRokenPdfBestandsnaam("02/2026/2939", "LiquidFloors"),
    "02 2026 2939 105 LIQUIDFLOORS.pdf",
  );
}

await voerTestUit();
