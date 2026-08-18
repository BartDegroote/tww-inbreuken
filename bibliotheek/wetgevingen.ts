import {
  KB_BEVEILIGING_LIFTEN_ID,
  KB_BEVEILIGING_LIFTEN_NAAM,
} from "./kb-liften";
import { ARAB_ID, ARAB_NAAM } from "./arab";

export type Wetgeving = {
  id: string;
  naam: string;
};

export const wetgevingen: Wetgeving[] = [
  {
    id: "codex-welzijn",
    naam: "Codex over het welzijn op het werk",
  },
  {
    id: "welzijnswet-1996",
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

export function zoekWetgevingOpId(
  wetgevingId: string,
): Wetgeving | undefined {
  return wetgevingen.find(
    (wetgeving) => wetgeving.id === wetgevingId,
  );
}
