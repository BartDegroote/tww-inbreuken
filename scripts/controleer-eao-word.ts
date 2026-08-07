import { writeFile } from "node:fs/promises";

import { Packer } from "docx";

import {
  maakWordDocument,
  type WordFoto,
  type WordInspectie,
} from "../lib/word-export";

function maakControleFoto(
  naam: string,
  basis64: string,
): WordFoto {
  return {
    naam,
    data: new Uint8Array(
      Buffer.from(basis64, "base64"),
    ),
    breedte: 400,
    hoogte: 300,
  };
}

const controleFotos = [
  maakControleFoto(
    "foto-1.png",
    "iVBORw0KGgoAAAANSUhEUgAAACgAAAAeCAIAAADRv8uKAAAALklEQVR42u3NMQEAMAgAIF0Ve5nSgIvg6QMFyOqJCy+OiMVisVgsFovFYrF49wHTKwFxuzAm7gAAAABJRU5ErkJggg==",
  ),
  maakControleFoto(
    "foto-2.png",
    "iVBORw0KGgoAAAANSUhEUgAAACgAAAAeCAIAAADRv8uKAAAALklEQVR42u3NMQEAMAgAIF0Ca9rF0Ivg6QMFyJqOCy+OiMVisVgsFovFYrF49wErBQFBngAtoAAAAABJRU5ErkJggg==",
  ),
];

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
      fotos: controleFotos,
      toelichting:
        "De instructies moeten begrijpelijk en beschikbaar zijn voor de betrokken werknemers.",
      aanvulling:
        "U dient dit voor de volledige onderneming na te gaan.",
      aanvullingOpmaak: [],
      wettelijkeVerwijzing:
        "Dit is een overtreding op art. IV.2-5 van de codex over het welzijn op het werk.",
    },
    {
      inbreukType: "STANDAARD",
      beschrijving:
        "Deze inbreuk werd zonder afzonderlijke vaststelling verwerkt.",
      beschrijvingOpmaak: [],
      inCasu: "",
      specifiekeElementen: [],
      specifiekeElementenAlsSituering: false,
      vaststellingen: [
        {
          tekst: "",
          specifiekeElementen: [],
          eigenElementen: [],
        },
      ],
      fotos: [],
      toelichting: "",
      aanvulling: "",
      aanvullingOpmaak: [],
      wettelijkeVerwijzing:
        "Dit is een overtreding op art. IV.2-6 van de codex over het welzijn op het werk.",
    },
  ],
};

await writeFile(
  "/private/tmp/tww-eao-word-controle.docx",
  await Packer.toBuffer(
    maakWordDocument(inspectie),
  ),
);
