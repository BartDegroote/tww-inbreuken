import {
  KB_BEVEILIGING_LIFTEN_ID,
  KB_BEVEILIGING_LIFTEN_NAAM,
} from "./kb-liften";
import { ARAB_ID, ARAB_NAAM } from "./arab";
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
    id: KB_BEVEILIGING_LIFTEN_ID,
    naam: KB_BEVEILIGING_LIFTEN_NAAM,
  },
  {
    id: ARAB_ID,
    naam: ARAB_NAAM,
  },
];

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
