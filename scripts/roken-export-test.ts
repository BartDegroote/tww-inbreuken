import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import JSZip from "jszip";

const SJABLOON_PAD = "public/sjablonen/105-roken-sjabloon.dotx";
const EXPORT_MODULE_PAD = "../lib/roken-word-export.ts";
const TOEGESTANE_WIJZIGINGEN = new Set([
  "[Content_Types].xml",
  "word/document.xml",
  "word/footer1.xml",
]);

function naarArrayBuffer(buffer: Buffer): ArrayBuffer {
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer;
}

async function leesZipBestand(zip: JSZip, pad: string): Promise<Uint8Array> {
  const bestand = zip.file(pad);
  assert.ok(bestand, `Ontbrekend Word-onderdeel: ${pad}`);
  return bestand.async("uint8array");
}

async function voerTestUit() {
  const {
    controleerRokenSjabloonIntegriteit,
    maakRokenDocxBuffer,
  } = await import(EXPORT_MODULE_PAD);
  const sjabloonBuffer = await readFile(SJABLOON_PAD);
  const sjabloon = naarArrayBuffer(sjabloonBuffer);

  await controleerRokenSjabloonIntegriteit(sjabloon);

  const resultaat = await maakRokenDocxBuffer(sjabloon, {
    onderneming: "Voorbeeld Onderneming BV",
    straatEnNummer: "Teststraat 12",
    postcode: "9000",
    plaats: "Gent",
    kboNummer: "0123.456.789",
    flow: "02/2026/1234",
    rapportDatum: "26/08/2026",
    vaststellingsDatum: "25/08/2026",
    werkruimte:
      "Cabine van een bestelwagen (gesloten ruimte buiten een onderneming)",
    locatie: "Controlelaan 5, 1000 Brussel",
    tijdstip: "14u35",
    nummerplaat: "1-ABC-234",
  });

  const bronZip = await JSZip.loadAsync(sjabloon);
  const resultaatZip = await JSZip.loadAsync(resultaat);
  const bronPaden = Object.keys(bronZip.files)
    .filter((pad) => !bronZip.files[pad].dir)
    .sort();
  const resultaatPaden = Object.keys(resultaatZip.files)
    .filter((pad) => !resultaatZip.files[pad].dir)
    .sort();

  assert.deepEqual(
    resultaatPaden,
    bronPaden,
    "De Word-export moet exact dezelfde pakketonderdelen behouden.",
  );

  for (const pad of bronPaden) {
    if (bronZip.files[pad].dir || TOEGESTANE_WIJZIGINGEN.has(pad)) continue;

    assert.deepEqual(
      await leesZipBestand(resultaatZip, pad),
      await leesZipBestand(bronZip, pad),
      `Het vaste Word-onderdeel ${pad} werd onverwacht gewijzigd.`,
    );
  }

  const documentXml = await resultaatZip
    .file("word/document.xml")!
    .async("string");
  const footerXml = await resultaatZip.file("word/footer1.xml")!.async("string");

  assert.equal(
    (documentXml.match(/02\/2026\/1234/g) ?? []).length,
    2,
    "Het flownummer moet tweemaal in de brieftekst staan.",
  );
  assert.equal(
    (footerXml.match(/02\/2026\/1234/g) ?? []).length,
    1,
    "Het flownummer moet eenmaal in de voettekst staan.",
  );
}

await voerTestUit();
