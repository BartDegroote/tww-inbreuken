export const WELZIJNSWET_ID = "welzijnswet-1996";

export const VERBORGEN_AFDELING_SUFFIX = "-algemeen";

export type WelzijnswetHoofdstuk = {
  id: string;
  wetgevingId: typeof WELZIJNSWET_ID;
  naam: string;
};

export type WelzijnswetAfdeling = {
  id: string;
  boekId: string;
  naam: string;
};

export const welzijnswetHoofdstukken: WelzijnswetHoofdstuk[] = [
  {
    id: "welzijnswet-hoofdstuk-i",
    wetgevingId: WELZIJNSWET_ID,
    naam: "I - Toepassingsgebied en definities",
  },
  {
    id: "welzijnswet-hoofdstuk-ii",
    wetgevingId: WELZIJNSWET_ID,
    naam: "II - Algemene beginselen",
  },
  {
    id: "welzijnswet-hoofdstuk-iii",
    wetgevingId: WELZIJNSWET_ID,
    naam:
      "III - Tewerkstelling op eenzelfde, aanpalende of naburige arbeidsplaats",
  },
  {
    id: "welzijnswet-hoofdstuk-iv",
    wetgevingId: WELZIJNSWET_ID,
    naam:
      "IV - Ondernemingen van buitenaf en uitzendkrachten",
  },
  {
    id: "welzijnswet-hoofdstuk-v",
    wetgevingId: WELZIJNSWET_ID,
    naam: "V - Tijdelijke of mobiele bouwplaatsen",
  },
  {
    id: "welzijnswet-hoofdstuk-vbis",
    wetgevingId: WELZIJNSWET_ID,
    naam:
      "Vbis - Preventie van psychosociale risico’s op het werk",
  },
  {
    id: "welzijnswet-hoofdstuk-vi",
    wetgevingId: WELZIJNSWET_ID,
    naam: "VI - Preventie- en beschermingsdiensten",
  },
  {
    id: "welzijnswet-hoofdstuk-vii",
    wetgevingId: WELZIJNSWET_ID,
    naam:
      "VII - Hoge Raad voor Preventie en Bescherming op het werk",
  },
  {
    id: "welzijnswet-hoofdstuk-viii",
    wetgevingId: WELZIJNSWET_ID,
    naam:
      "VIII - Comité voor Preventie en Bescherming op het werk",
  },
  {
    id: "welzijnswet-hoofdstuk-ix",
    wetgevingId: WELZIJNSWET_ID,
    naam: "IX - Gemeenschappelijke bepalingen voor de organen",
  },
  {
    id: "welzijnswet-hoofdstuk-x",
    wetgevingId: WELZIJNSWET_ID,
    naam: "X - Beroep bij de arbeidsrechtbanken",
  },
  {
    id: "welzijnswet-hoofdstuk-xi",
    wetgevingId: WELZIJNSWET_ID,
    naam: "XI - Toezicht en strafbepalingen",
  },
  {
    id: "welzijnswet-hoofdstuk-xibis",
    wetgevingId: WELZIJNSWET_ID,
    naam:
      "XIbis - Herhaling van ernstige arbeidsongevallen voorkomen",
  },
  {
    id: "welzijnswet-hoofdstuk-xii",
    wetgevingId: WELZIJNSWET_ID,
    naam: "XII - Slotbepalingen",
  },
];

const hoofdstukkenZonderAfdelingen = [
  "welzijnswet-hoofdstuk-i",
  "welzijnswet-hoofdstuk-ii",
  "welzijnswet-hoofdstuk-iii",
  "welzijnswet-hoofdstuk-vii",
  "welzijnswet-hoofdstuk-ix",
  "welzijnswet-hoofdstuk-x",
  "welzijnswet-hoofdstuk-xi",
  "welzijnswet-hoofdstuk-xii",
] as const;

export const welzijnswetAfdelingen: WelzijnswetAfdeling[] = [
  ...hoofdstukkenZonderAfdelingen.map((boekId) => ({
    id: `${boekId}${VERBORGEN_AFDELING_SUFFIX}`,
    boekId,
    naam: "Rechtstreeks onder het hoofdstuk",
  })),
  {
    id: "welzijnswet-hoofdstuk-iv-afdeling-1",
    boekId: "welzijnswet-hoofdstuk-iv",
    naam:
      "1 - Werkzaamheden van werkgevers of zelfstandigen van buitenaf",
  },
  {
    id: "welzijnswet-hoofdstuk-iv-afdeling-2",
    boekId: "welzijnswet-hoofdstuk-iv",
    naam: "2 - Werkzaamheden van uitzendkrachten bij gebruikers",
  },
  {
    id: "welzijnswet-hoofdstuk-v-afdeling-1",
    boekId: "welzijnswet-hoofdstuk-v",
    naam: "1 - Inleidende bepalingen",
  },
  {
    id: "welzijnswet-hoofdstuk-v-afdeling-2",
    boekId: "welzijnswet-hoofdstuk-v",
    naam: "2 - Ontwerp van het bouwwerk",
  },
  {
    id: "welzijnswet-hoofdstuk-v-afdeling-3",
    boekId: "welzijnswet-hoofdstuk-v",
    naam: "3 - Verwezenlijking van het bouwwerk",
  },
  {
    id: "welzijnswet-hoofdstuk-v-afdeling-4",
    boekId: "welzijnswet-hoofdstuk-v",
    naam: "4 - Aanwezigheidsregistratiesysteem",
  },
  {
    id: "welzijnswet-hoofdstuk-v-afdeling-5",
    boekId: "welzijnswet-hoofdstuk-v",
    naam: "5 - Coördinatiestructuur",
  },
  {
    id: "welzijnswet-hoofdstuk-vbis-afdeling-1",
    boekId: "welzijnswet-hoofdstuk-vbis",
    naam: "1 - Algemeenheden",
  },
  {
    id: "welzijnswet-hoofdstuk-vbis-afdeling-2",
    boekId: "welzijnswet-hoofdstuk-vbis",
    naam:
      "2 - Geweld, pesterijen en ongewenst seksueel gedrag op het werk",
  },
  {
    id: "welzijnswet-hoofdstuk-vi-afdeling-1",
    boekId: "welzijnswet-hoofdstuk-vi",
    naam: "1 - Algemene bepalingen",
  },
  {
    id: "welzijnswet-hoofdstuk-vi-afdeling-2",
    boekId: "welzijnswet-hoofdstuk-vi",
    naam:
      "2 - Interne Dienst voor Preventie en Bescherming op het werk",
  },
  {
    id: "welzijnswet-hoofdstuk-vi-afdeling-3",
    boekId: "welzijnswet-hoofdstuk-vi",
    naam:
      "3 - Externe preventiediensten, medisch toezicht en technische controles",
  },
  {
    id: "welzijnswet-hoofdstuk-vi-afdeling-4",
    boekId: "welzijnswet-hoofdstuk-vi",
    naam:
      "4 - Coördinatie van de Diensten voor Preventie en Bescherming",
  },
  {
    id: "welzijnswet-hoofdstuk-vi-afdeling-5",
    boekId: "welzijnswet-hoofdstuk-vi",
    naam: "5 - Gemeenschappelijke bepalingen",
  },
  {
    id: "welzijnswet-hoofdstuk-viii-afdeling-1",
    boekId: "welzijnswet-hoofdstuk-viii",
    naam: "1 - Toepassingsgebied",
  },
  {
    id: "welzijnswet-hoofdstuk-viii-afdeling-2",
    boekId: "welzijnswet-hoofdstuk-viii",
    naam: "2 - Oprichting",
  },
  {
    id: "welzijnswet-hoofdstuk-viii-afdeling-3",
    boekId: "welzijnswet-hoofdstuk-viii",
    naam: "3 - Samenstelling",
  },
  {
    id: "welzijnswet-hoofdstuk-viii-afdeling-4",
    boekId: "welzijnswet-hoofdstuk-viii",
    naam: "4 - Bevoegdheden",
  },
  {
    id: "welzijnswet-hoofdstuk-viii-afdeling-5",
    boekId: "welzijnswet-hoofdstuk-viii",
    naam: "5 - Werking",
  },
  {
    id: "welzijnswet-hoofdstuk-viii-afdeling-6",
    boekId: "welzijnswet-hoofdstuk-viii",
    naam: "6 - Overgang van onderneming en overname van activa",
  },
  {
    id: "welzijnswet-hoofdstuk-viii-afdeling-7",
    boekId: "welzijnswet-hoofdstuk-viii",
    naam: "7 - Overdracht onder gerechtelijk gezag",
  },
  {
    id: "welzijnswet-hoofdstuk-xibis-afdeling-1",
    boekId: "welzijnswet-hoofdstuk-xibis",
    naam: "1 - Definitie",
  },
  {
    id: "welzijnswet-hoofdstuk-xibis-afdeling-2",
    boekId: "welzijnswet-hoofdstuk-xibis",
    naam:
      "2 - Onderzoek en verslaggeving van ernstige arbeidsongevallen",
  },
  {
    id: "welzijnswet-hoofdstuk-xibis-afdeling-3",
    boekId: "welzijnswet-hoofdstuk-xibis",
    naam: "3 - De deskundige",
  },
  {
    id: "welzijnswet-hoofdstuk-xibis-afdeling-4",
    boekId: "welzijnswet-hoofdstuk-xibis",
    naam: "4 - Honorarium van de deskundige",
  },
  {
    id: "welzijnswet-hoofdstuk-xibis-afdeling-5",
    boekId: "welzijnswet-hoofdstuk-xibis",
    naam:
      "5 - Terugvordering van het honorarium van de deskundige",
  },
  {
    id: "welzijnswet-hoofdstuk-xibis-afdeling-6",
    boekId: "welzijnswet-hoofdstuk-xibis",
    naam: "6 - Algemeenheden",
  },
  {
    id: "welzijnswet-hoofdstuk-xibis-afdeling-7",
    boekId: "welzijnswet-hoofdstuk-xibis",
    naam: "7 - Aangifte van ernstige arbeidsongevallen",
  },
];

export function isWelzijnswet(wetgevingId: string): boolean {
  return wetgevingId === WELZIJNSWET_ID;
}

export function isVerborgenAfdeling(titelId: string): boolean {
  return titelId.endsWith(VERBORGEN_AFDELING_SUFFIX);
}
