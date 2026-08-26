import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb } from "pdf-lib";

const projectmap = resolve(import.meta.dirname, "..");
const bron = join(projectmap, "public/sjablonen/105-roken-sjabloon.dotx");
const doel = join(projectmap, "public/sjablonen/105-roken-sjabloon.pdf");
const werkmap = join(tmpdir(), `tww-roken-pdf-${process.pid}`);
const profielmap = join(werkmap, "profiel");
const uitvoermap = join(werkmap, "uitvoer");
const fontconfig = join(werkmap, "fonts.conf");

const normaalPad = "/System/Library/Fonts/Supplemental/Verdana.ttf";
const vetPad = "/System/Library/Fonts/Supplemental/Verdana Bold.ttf";
const cursiefPad = "/System/Library/Fonts/Supplemental/Verdana Italic.ttf";

mkdirSync(profielmap, { recursive: true });
mkdirSync(uitvoermap, { recursive: true });

writeFileSync(
  fontconfig,
  `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd">
<fontconfig>
  <dir>/System/Library/Fonts</dir>
  <dir>/System/Library/Fonts/Supplemental</dir>
  <dir>/Library/Fonts</dir>
  <cachedir>${join(werkmap, "fontcache")}</cachedir>
</fontconfig>
`,
);

try {
  execFileSync(
    "soffice",
    [
      `-env:UserInstallation=file://${profielmap}`,
      "--headless",
      "--convert-to",
      "pdf",
      "--outdir",
      uitvoermap,
      bron,
    ],
    {
      env: {
        ...process.env,
        FONTCONFIG_FILE: fontconfig,
        SAL_PRIVATE_FONTPATH: "/System/Library/Fonts/Supplemental",
      },
      stdio: "inherit",
    },
  );

  const gegenereerdPad = join(uitvoermap, "105-roken-sjabloon.pdf");
  const pdf = await PDFDocument.load(readFileSync(gegenereerdPad));
  pdf.registerFontkit(fontkit);

  if (pdf.getPageCount() < 1) {
    throw new Error("De omzetting van het Word-sjabloon bevat geen pagina.");
  }

  while (pdf.getPageCount() > 1) {
    pdf.removePage(1);
  }

  const pagina = pdf.getPage(0);
  const normaal = await pdf.embedFont(readFileSync(normaalPad), { subset: false });
  const vet = await pdf.embedFont(readFileSync(vetPad), { subset: false });
  const cursief = await pdf.embedFont(readFileSync(cursiefPad), { subset: false });
  const blauw = rgb(0.2667, 0.4471, 0.7686);

  // LibreOffice laat de dubbele punt door een afwijkende tabelmeting naar de
  // volgende regel springen. Word houdt “Betreft:” op één regel; herstel die
  // vaste titel exact in de voorziene onderwerpregel.
  pagina.drawRectangle({
    x: 70,
    y: 509,
    width: 300,
    height: 28,
    color: rgb(1, 1, 1),
  });
  pagina.drawText("Betreft:", {
    x: 73.1,
    y: 527.64,
    size: 10,
    font: vet,
  });
  pagina.drawText("Rokende persoon in werkruimte", {
    x: 123.3,
    y: 527.64,
    size: 10,
    font: normaal,
  });

  // Word houdt de ondertekening op dezelfde pagina. LibreOffice plaatst ze
  // door een verschil in paginering op pagina 2; hier wordt ze teruggezet in
  // de daarvoor voorziene vrije ondertekenruimte van het originele sjabloon.
  pagina.drawText("Bart Degroote,", {
    x: 78.1,
    y: 107.2,
    size: 10,
    font: normaal,
  });
  pagina.drawText("Sociaal inspecteur", {
    x: 78.1,
    y: 95.05,
    size: 10,
    font: normaal,
  });

  // Verwijder de door LibreOffice berekende aanduiding 1/2. De dynamische
  // footer wordt bij de export volledig opnieuw geplaatst als pagina 1/1.
  pagina.drawRectangle({
    x: 450,
    y: 31.5,
    width: 112,
    height: 11,
    color: rgb(1, 1, 1),
  });
  pagina.drawText("02/2026/**** - Pagina 1/1", {
    x: 456.05,
    y: 36.89,
    size: 7,
    font: normaal,
    color: blauw,
  });

  // Zorg dat de drie goedgekeurde Verdana-varianten als volledig ingebedde
  // documentlettertypes beschikbaar blijven voor dynamische invulwaarden.
  pagina.drawText(" ", { x: 0, y: 0, size: 0.1, font: vet, color: rgb(1, 1, 1) });
  pagina.drawText(" ", {
    x: 0,
    y: 0,
    size: 0.1,
    font: cursief,
    color: rgb(1, 1, 1),
  });

  writeFileSync(doel, await pdf.save({ useObjectStreams: false }));
  console.log(`PDF-sjabloon bijgewerkt: ${doel}`);
} finally {
  rmSync(werkmap, { recursive: true, force: true });
}
