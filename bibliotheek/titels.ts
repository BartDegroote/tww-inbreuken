export type Titel = {
  id: string;
  boekId: string;
  naam: string;
};

export const titels: Titel[] = [
  {
    id: "boek-iii-titel-1",
    boekId: "boek-iii",
    naam: "Titel 1",
  },
];

export function zoekTitelOpId(
  titelId: string,
): Titel | undefined {
  return titels.find((titel) => titel.id === titelId);
}

export function zoekTitelsVoorBoek(
  boekId: string,
): Titel[] {
  return titels.filter(
    (titel) => titel.boekId === boekId,
  );
}
