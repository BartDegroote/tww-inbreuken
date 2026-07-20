import { vergelijkBoekIds } from "./boeken";

export type Titel = {
  id: string;
  boekId: string;
  naam: string;
};

export const titels: Titel[] = [
  { id: "boek-i-titel-1", boekId: "boek-i", naam: "1 - Inleidende bepalingen" },
  { id: "boek-i-titel-2", boekId: "boek-i", naam: "2 - Algemene beginselen welzijnsbeleid" },
  { id: "boek-i-titel-3", boekId: "boek-i", naam: "3 - Preventie psychosociale risico’s" },
  { id: "boek-i-titel-4", boekId: "boek-i", naam: "4 - Gezondheidstoezicht werknemers" },
  { id: "boek-i-titel-5", boekId: "boek-i", naam: "5 - Eerste hulp" },
  { id: "boek-i-titel-6", boekId: "boek-i", naam: "6 - Maatregelen bij arbeidsongeval" },

  { id: "boek-ii-titel-1", boekId: "boek-ii", naam: "1 - Interne preventiedienst" },
  { id: "boek-ii-titel-2", boekId: "boek-ii", naam: "2 - Gemeenschappelijke interne preventiedienst" },
  { id: "boek-ii-titel-3", boekId: "boek-ii", naam: "3 - Externe preventiedienst" },
  { id: "boek-ii-titel-4", boekId: "boek-ii", naam: "4 - Vorming en bijscholing preventieadviseurs" },
  { id: "boek-ii-titel-5", boekId: "boek-ii", naam: "5 - Externe diensten technische controles" },
  { id: "boek-ii-titel-6", boekId: "boek-ii", naam: "6 - Laboratoria" },
  { id: "boek-ii-titel-7", boekId: "boek-ii", naam: "7 - Comités voor preventie en bescherming" },
  { id: "boek-ii-titel-8", boekId: "boek-ii", naam: "8 - Rechtstreekse participatie" },
  { id: "boek-ii-titel-9", boekId: "boek-ii", naam: "9 - Hoge Raad voor preventie en bescherming" },

  { id: "boek-iii-titel-1", boekId: "boek-iii", naam: "1 - Basiseisen arbeidsplaatsen" },
  { id: "boek-iii-titel-2", boekId: "boek-iii", naam: "2 - Elektrische installaties" },
  { id: "boek-iii-titel-3", boekId: "boek-iii", naam: "3 - Brandpreventie arbeidsplaatsen" },
  { id: "boek-iii-titel-4", boekId: "boek-iii", naam: "4 - Explosieve atmosferen" },
  { id: "boek-iii-titel-5", boekId: "boek-iii", naam: "5 - Opslag ontvlambare vloeistoffen" },
  { id: "boek-iii-titel-6", boekId: "boek-iii", naam: "6 - Veiligheids- en gezondheidssignalering" },

  { id: "boek-iv-titel-1", boekId: "boek-iv", naam: "1 - Definities" },
  { id: "boek-iv-titel-2", boekId: "boek-iv", naam: "2 - Bepalingen voor alle arbeidsmiddelen" },
  { id: "boek-iv-titel-3", boekId: "boek-iv", naam: "3 - Mobiele arbeidsmiddelen" },
  { id: "boek-iv-titel-4", boekId: "boek-iv", naam: "4 - Hijsen of heffen van lasten" },
  { id: "boek-iv-titel-5", boekId: "boek-iv", naam: "5 - Tijdelijke werkzaamheden op hoogte" },

  { id: "boek-v-titel-1", boekId: "boek-v", naam: "1 - Thermische omgevingsfactoren" },
  { id: "boek-v-titel-2", boekId: "boek-v", naam: "2 - Lawaai" },
  { id: "boek-v-titel-3", boekId: "boek-v", naam: "3 - Trillingen" },
  { id: "boek-v-titel-4", boekId: "boek-v", naam: "4 - Hyperbare omgeving" },
  { id: "boek-v-titel-5", boekId: "boek-v", naam: "5 - Ioniserende stralingen" },
  { id: "boek-v-titel-6", boekId: "boek-v", naam: "6 - Kunstmatige optische straling" },
  { id: "boek-v-titel-7", boekId: "boek-v", naam: "7 - Elektromagnetische velden" },

  { id: "boek-vi-titel-1", boekId: "boek-vi", naam: "1 - Chemische agentia" },
  { id: "boek-vi-titel-2", boekId: "boek-vi", naam: "2 - Kankerverwekkende, mutagene en reprotoxische agentia" },
  { id: "boek-vi-titel-3", boekId: "boek-vi", naam: "3 - Asbest" },
  { id: "boek-vi-titel-4", boekId: "boek-vi", naam: "4 - Bepalingen voor asbestverwijderaars" },

  { id: "boek-vii-titel-1", boekId: "boek-vii", naam: "1 - Algemene bepalingen" },

  { id: "boek-viii-titel-1", boekId: "boek-viii", naam: "1 - Algemene bepalingen" },
  { id: "boek-viii-titel-2", boekId: "boek-viii", naam: "2 - Beeldschermen" },
  { id: "boek-viii-titel-3", boekId: "boek-viii", naam: "3 - Manueel hanteren van lasten" },
  { id: "boek-viii-titel-4", boekId: "boek-viii", naam: "4 - Werkzitplaatsen en rustzitplaatsen" },

  { id: "boek-ix-titel-1", boekId: "boek-ix", naam: "1 - Collectieve beschermingsmiddelen" },
  { id: "boek-ix-titel-2", boekId: "boek-ix", naam: "2 - Persoonlijke beschermingsmiddelen" },
  { id: "boek-ix-titel-3", boekId: "boek-ix", naam: "3 - Werkkledij" },

  { id: "boek-x-titel-1", boekId: "boek-x", naam: "1 - Nachtarbeiders en werknemers in ploegendienst" },
  { id: "boek-x-titel-2", boekId: "boek-x", naam: "2 - Uitzendarbeid" },
  { id: "boek-x-titel-3", boekId: "boek-x", naam: "3 - Jongeren op het werk" },
  { id: "boek-x-titel-4", boekId: "boek-x", naam: "4 - Stagiairs" },
  { id: "boek-x-titel-5", boekId: "boek-x", naam: "5 - Moederschapsbescherming" },
  { id: "boek-x-titel-6", boekId: "boek-x", naam: "6 - Dienstboden en huispersoneel" },
];

export function vergelijkTitelIds(a: Titel, b: Titel): number {
  const boekVerschil = vergelijkBoekIds(a.boekId, b.boekId);
  if (boekVerschil !== 0) return boekVerschil;

  const nummer = (id: string) => Number(id.match(/-titel-(\d+)$/)?.[1] ?? 0);
  return nummer(a.id) - nummer(b.id);
}

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
