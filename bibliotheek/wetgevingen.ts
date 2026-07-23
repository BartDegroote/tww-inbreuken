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
];

export function zoekWetgevingOpId(
  wetgevingId: string,
): Wetgeving | undefined {
  return wetgevingen.find(
    (wetgeving) => wetgeving.id === wetgevingId,
  );
}
