import { kbLiftenHoofdstukken } from "./kb-liften";
import { welzijnswetHoofdstukken } from "./welzijnswet";

export type Boek = {
  id: string;
  wetgevingId: string;
  naam: string;
};

export const boeken: Boek[] = [
  {
    id: "boek-i",
    wetgevingId: "codex-welzijn",
    naam: "I - Algemene beginselen",
  },
  {
    id: "boek-ii",
    wetgevingId: "codex-welzijn",
    naam: "II - Organisatorische structuren en sociaal overleg",
  },
  {
    id: "boek-iii",
    wetgevingId: "codex-welzijn",
    naam: "III - Arbeidsplaatsen",
  },
  {
    id: "boek-iv",
    wetgevingId: "codex-welzijn",
    naam: "IV - Arbeidsmiddelen",
  },
  {
    id: "boek-v",
    wetgevingId: "codex-welzijn",
    naam: "V - Omgevingsfactoren en fysische agentia",
  },
  {
    id: "boek-vi",
    wetgevingId: "codex-welzijn",
    naam: "VI - Chemische en gevaarlijke agentia",
  },
  {
    id: "boek-vii",
    wetgevingId: "codex-welzijn",
    naam: "VII - Biologische agentia",
  },
  {
    id: "boek-viii",
    wetgevingId: "codex-welzijn",
    naam: "VIII - Ergonomie en preventie van MSA",
  },
  {
    id: "boek-ix",
    wetgevingId: "codex-welzijn",
    naam: "IX - Collectieve bescherming en individuele uitrusting",
  },
  {
    id: "boek-x",
    wetgevingId: "codex-welzijn",
    naam: "X - Werkorganisatie en bijzondere werknemerscategorieën",
  },
  ...kbLiftenHoofdstukken,
  ...welzijnswetHoofdstukken,
];

const boekVolgorde = new Map(
  boeken.map((boek, index) => [boek.id, index]),
);

export function vergelijkBoekIds(a: string, b: string): number {
  return (boekVolgorde.get(a) ?? Number.MAX_SAFE_INTEGER) -
    (boekVolgorde.get(b) ?? Number.MAX_SAFE_INTEGER);
}

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
