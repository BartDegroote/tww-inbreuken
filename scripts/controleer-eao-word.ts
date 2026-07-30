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
    slachtofferWerkHervat: null,
    werkhervattingsdatum: "",
    werkpostBezocht: null,
  },
  inbreuken: [
    {
      inbreukType: "STANDAARD",
      beschrijving:
        "De schriftelijke instructies voor het arbeidsmiddel waren onvolledig.",
      beschrijvingOpmaak: [],
      inCasu: "",
      specifiekeElementen: [],
      specifiekeElementenAlsSituering: false,
      vaststellingen: [
        {
          tekst:
            "Het betreft de hoogwerker in werkplaats A.",
          specifiekeElementen: [
            "De instructies vermelden de veiligheidsvoorzieningen niet.",
          ],
          eigenElementen: [
            "De bedieningsinstructie was niet beschikbaar bij het arbeidsmiddel.",
          ],
        },
        {
          tekst:
            "Het betreft de heftruck in de laadzone.",
          specifiekeElementen: [],
          eigenElementen: [
            "De instructies waren alleen in een voor de bestuurder onbekende taal beschikbaar.",
          ],
        },
      ],
      fotos: [],
      toelichting:
        "De instructies moeten begrijpelijk en beschikbaar zijn voor de betrokken werknemers.",
      aanvulling:
        "U dient dit voor de volledige onderneming na te gaan.",
      aanvullingOpmaak: [],
      wettelijkeVerwijzing:
        "Dit is een overtreding op art. IV.2-5 van de codex over het welzijn op het werk.",
    },
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
