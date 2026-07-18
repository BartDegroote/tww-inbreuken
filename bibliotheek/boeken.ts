export type Boek = {
  id: string;
  wetgevingId: string;
  naam: string;
};

export const boeken: Boek[] = [
  {
    id: "boek-i",
    wetgevingId: "codex-welzijn",
    naam: "Boek I",
  },
  {
    id: "boek-ii",
    wetgevingId: "codex-welzijn",
    naam: "Boek II",
  },
  {
    id: "boek-iii",
    wetgevingId: "codex-welzijn",
    naam: "Boek III",
  },
  {
    id: "boek-iv",
    wetgevingId: "codex-welzijn",
    naam: "Boek IV",
  },
  {
    id: "boek-v",
    wetgevingId: "codex-welzijn",
    naam: "Boek V",
  },
  {
    id: "boek-vi",
    wetgevingId: "codex-welzijn",
    naam: "Boek VI",
  },
  {
    id: "boek-vii",
    wetgevingId: "codex-welzijn",
    naam: "Boek VII",
  },
  {
    id: "boek-viii",
    wetgevingId: "codex-welzijn",
    naam: "Boek VIII",
  },
  {
    id: "boek-ix",
    wetgevingId: "codex-welzijn",
    naam: "Boek IX",
  },
  {
    id: "boek-x",
    wetgevingId: "codex-welzijn",
    naam: "Boek X",
  },
];

export function zoekBoekOpId(
  boekId: string,
): Boek | undefined {
  return boeken.find((boek) => boek.id === boekId);
}

export function zoekBoekenVoorWetgeving(
  wetgevingId: string,
): Boek[] {
  return boeken.filter(
    (boek) => boek.wetgevingId === wetgevingId,
  );
}