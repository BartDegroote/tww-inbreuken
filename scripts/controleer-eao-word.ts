import { writeFile } from "node:fs/promises";

import { Packer } from "docx";

import {
  maakWordDocument,
  type WordInspectie,
} from "../lib/word-export";

const inspectie: WordInspectie = {
  onderneming: "VOORBEELD",
  adres: "Voorbeeldstraat 1",
  inspectiedatum: "2026-07-24",
  inspecteur: "Bart Degroote",
  flow: "02/2026/2551/105",
  ontmoetePersonen: [],
  ernstigArbeidsongeval: {
    slachtofferVoornaam: "Bart",
    slachtofferNaam: "Degroote",
    ongevalsdatum: "2025-12-08",
    slachtofferWerkHervat: true,
    werkhervattingsdatum: "2026-02-09",
    werkpostBezocht: true,
  },
  inbreuken: [
    {
      inbreukType: "EAO_CODES",
      beschrijving:
        "De werkgever heeft het omstandig verslag naar aanleiding van een ernstig arbeidsongeval, zoals gedefinieerd in artikel I.6-2 van de Codex over het Welzijn op het Werk, niet binnen de wettelijke termijn van 10 dagen overgemaakt aan de bevoegde ambtenaar.",
      beschrijvingOpmaak: [],
      inCasu: "",
      specifiekeElementen: [],
      specifiekeElementenAlsSituering: false,
      fotos: [],
      toelichting: "",
      aanvulling: "",
      aanvullingOpmaak: [],
      wettelijkeVerwijzing:
        "Dit is een overtreding op art. 94ter van de wet van 4 augustus 1996 betreffende het welzijn van de werknemers bij de uitvoering van hun werk.",
      afwijkendeGebeurtenisCode: "41",
      betrokkenVoorwerpCode: "07.01",
      soortLetselCode: "013",
    },
  ],
};

await writeFile(
  "/private/tmp/tww-eao-word-controle.docx",
  await Packer.toBuffer(
    maakWordDocument(inspectie),
  ),
);
