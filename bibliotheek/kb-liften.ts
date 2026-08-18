import { VERBORGEN_AFDELING_SUFFIX } from "./welzijnswet";

export const KB_BEVEILIGING_LIFTEN_ID =
  "kb-beveiliging-liften";

export const KB_BEVEILIGING_LIFTEN_NAAM =
  "KB beveiliging liften";

export type KbLiftenHoofdstuk = {
  id: string;
  wetgevingId: typeof KB_BEVEILIGING_LIFTEN_ID;
  naam: string;
};

export type KbLiftenTechnischeTitel = {
  id: string;
  boekId: string;
  naam: string;
};

// Koninklijk besluit van 9 maart 2003 betreffende de beveiliging
// van liften (Numac 2003011127). Dit KB is ingedeeld in negen
// hoofdstukken en bevat geen afdelingen.
export const kbLiftenHoofdstukken: KbLiftenHoofdstuk[] = [
  {
    id: "kb-liften-hoofdstuk-i",
    wetgevingId: KB_BEVEILIGING_LIFTEN_ID,
    naam: "I - Definities",
  },
  {
    id: "kb-liften-hoofdstuk-ii",
    wetgevingId: KB_BEVEILIGING_LIFTEN_ID,
    naam: "II - Toepassingsgebied",
  },
  {
    id: "kb-liften-hoofdstuk-iii",
    wetgevingId: KB_BEVEILIGING_LIFTEN_ID,
    naam: "III - Algemene veiligheidsvoorwaarden",
  },
  {
    id: "kb-liften-hoofdstuk-iv",
    wetgevingId: KB_BEVEILIGING_LIFTEN_ID,
    naam: "IV - Modernisatieprogramma",
  },
  {
    id: "kb-liften-hoofdstuk-v",
    wetgevingId: KB_BEVEILIGING_LIFTEN_ID,
    naam: "V - Uitbating",
  },
  {
    id: "kb-liften-hoofdstuk-vi",
    wetgevingId: KB_BEVEILIGING_LIFTEN_ID,
    naam: "VI - Waarschuwingen en opschriften",
  },
  {
    id: "kb-liften-hoofdstuk-vii",
    wetgevingId: KB_BEVEILIGING_LIFTEN_ID,
    naam: "VII - Toezicht",
  },
  {
    id: "kb-liften-hoofdstuk-viii",
    wetgevingId: KB_BEVEILIGING_LIFTEN_ID,
    naam: "VIII - Overgangsmaatregelen",
  },
  {
    id: "kb-liften-hoofdstuk-ix",
    wetgevingId: KB_BEVEILIGING_LIFTEN_ID,
    naam: "IX - Opheffings- en eindbepalingen",
  },
];

// Prisma vereist intern ook een titel. Omdat dit KB geen afdelingen
// heeft, krijgt elk hoofdstuk één verborgen technische titel.
export const kbLiftenTechnischeTitels: KbLiftenTechnischeTitel[] =
  kbLiftenHoofdstukken.map((hoofdstuk) => ({
    id: `${hoofdstuk.id}${VERBORGEN_AFDELING_SUFFIX}`,
    boekId: hoofdstuk.id,
    naam: "Rechtstreeks onder het hoofdstuk",
  }));

export function isKbBeveiligingLiften(
  wetgevingId: string,
): boolean {
  return wetgevingId === KB_BEVEILIGING_LIFTEN_ID;
}
