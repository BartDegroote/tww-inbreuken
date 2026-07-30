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
  ontmoetePersonen: [
    {
      naam: "Jan Janssens",
      functie: "Preventieadviseur HSE",
    },
  ],
  ernstigArbeidsongeval: {
    slachtofferVoornaam: "Bart",
    slachtofferNaam: "Degroote",
    ongevalsdatum: "2025-12-08",
    slachtofferWerkHervat: null,
    werkhervattingsdatum: "",
    werkpostBezocht: false,
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
  ],
};

await writeFile(
  "/private/tmp/tww-eao-word-controle.docx",
  await Packer.toBuffer(
    maakWordDocument(inspectie),
  ),
);
