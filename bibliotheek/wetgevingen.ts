export type Wetgeving = {
  id: string;
  naam: string;
};

export const wetgevingen: Wetgeving[] = [
  {
    id: "codex-welzijn",
    naam: "Codex over het welzijn op het werk",
  },
];

export function zoekWetgevingOpId(
  wetgevingId: string,
): Wetgeving | undefined {
  return wetgevingen.find(
    (wetgeving) => wetgeving.id === wetgevingId,
  );
}