import {
  KB_BEVEILIGING_LIFTEN_ID,
  KB_BEVEILIGING_LIFTEN_NAAM,
} from "./kb-liften";
import {
  ARAB_BOEK_ID,
  ARAB_ID,
  ARAB_NAAM,
  ARAB_TITEL_ID,
} from "./arab";
import {
  KB_TMB_BOEK_ID,
  KB_TMB_ID,
  KB_TMB_NAAM,
  KB_TMB_TITEL_ID,
} from "./kb-tmb";
import {
  ROOKWET_2009_BOEK_ID,
  ROOKWET_2009_ID,
  ROOKWET_2009_NAAM,
  ROOKWET_2009_TITEL_ID,
} from "./rookwet";
import { WELZIJNSWET_ID } from "./welzijnswet";

export const CODEX_WELZIJN_ID = "codex-welzijn";

export type Wetgeving = {
  id: string;
  naam: string;
};

export const wetgevingen: Wetgeving[] = [
  {
    id: CODEX_WELZIJN_ID,
    naam: "Codex over het welzijn op het werk",
  },
  {
    id: WELZIJNSWET_ID,
    naam: "Welzijnswet van 4 augustus 1996",
  },
  {
    id: ROOKWET_2009_ID,
    naam: ROOKWET_2009_NAAM,
  },
  {
    id: KB_BEVEILIGING_LIFTEN_ID,
    naam: KB_BEVEILIGING_LIFTEN_NAAM,
  },
  {
    id: KB_TMB_ID,
    naam: KB_TMB_NAAM,
  },
  {
    id: ARAB_ID,
    naam: ARAB_NAAM,
  },
];

const technischeIndelingPerWetgeving = new Map([
  [
    ROOKWET_2009_ID,
    {
      boekId: ROOKWET_2009_BOEK_ID,
      titelId: ROOKWET_2009_TITEL_ID,
    },
  ],
  [
    KB_TMB_ID,
    {
      boekId: KB_TMB_BOEK_ID,
      titelId: KB_TMB_TITEL_ID,
    },
  ],
  [
    ARAB_ID,
    {
      boekId: ARAB_BOEK_ID,
      titelId: ARAB_TITEL_ID,
    },
  ],
]);

export function zoekTechnischeIndelingVoorOnderwerpen(
  wetgevingId: string,
): { boekId: string; titelId: string } | undefined {
  return technischeIndelingPerWetgeving.get(wetgevingId);
}

export function isWetgevingMetEnkelOnderwerpen(
  wetgevingId: string,
): boolean {
  return technischeIndelingPerWetgeving.has(wetgevingId);
}

const wetgevingVolgorde = new Map(
  wetgevingen.map((wetgeving, index) => [
    wetgeving.id,
    index,
  ]),
);

export function vergelijkWetgevingIds(
  eersteId: string,
  tweedeId: string,
): number {
  return (
    (wetgevingVolgorde.get(eersteId) ??
      Number.MAX_SAFE_INTEGER) -
    (wetgevingVolgorde.get(tweedeId) ??
      Number.MAX_SAFE_INTEGER)
  );
}

export function zoekWetgevingOpId(
  wetgevingId: string,
): Wetgeving | undefined {
  return wetgevingen.find(
    (wetgeving) => wetgeving.id === wetgevingId,
  );
}
