export const ARAB_ID = "arab";
export const ARAB_NAAM = "ARAB";

// Boek en titel blijven technisch noodzakelijk voor het bestaande
// datamodel, maar worden nergens in de interface getoond.
export const ARAB_BOEK_ID = "arab-indeling";
export const ARAB_TITEL_ID = "arab-indeling-algemeen";

export function isArab(wetgevingId: string): boolean {
  return wetgevingId === ARAB_ID;
}
