export type TekstSegment = {
  tekst: string;
  vet?: boolean;
  donkergrijs?: boolean;
};

export type Standaardinbreuk = {
  id: string;

  wetgevingId: string;
  boekId: string;
  titelId: string;

  kernwoorden: string[];

  omschrijving: string;
  omschrijvingOpmaak?: TekstSegment[];

  situering?: string;

  toelichting?: string;

  aanvulling?: string;
  aanvullingOpmaak?: TekstSegment[];

  wettelijkeVerwijzing: string;
};