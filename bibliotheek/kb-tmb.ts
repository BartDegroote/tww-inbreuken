export const KB_TMB_ID = "kb-tmb";
export const KB_TMB_NAAM = "KB TMB";

// Het bestaande datamodel vereist intern een boek en titel. Voor
// het KB TMB zijn deze niveaus uitsluitend technisch: de app toont
// enkel de wetgeving en het vrij ingevulde onderwerp.
export const KB_TMB_BOEK_ID = "kb-tmb-indeling";
export const KB_TMB_TITEL_ID =
  "kb-tmb-indeling-algemeen";

export function isKbTmb(wetgevingId: string): boolean {
  return wetgevingId === KB_TMB_ID;
}
