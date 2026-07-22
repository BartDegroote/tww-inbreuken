export type TekstSegment = {
  tekst: string;
  vet?: boolean;
  donkergrijs?: boolean;
};

export type SpecifiekElement = {
  id: string;
  tekst: string;
  volgorde: number;
};

export type Standaardinbreuk = {
  id: string;

  geverifieerd: boolean;

  wetgevingId: string;
  boekId: string;
  titelId: string;

  /**
   * Vrij onderwerp.
   * Bij het invullen worden bestaande onderwerpen
   * binnen dezelfde titel als suggesties getoond.
   */
  onderwerp: string;

  kernwoorden: string[];

  // 1. Omschrijving
  omschrijving: string;
  omschrijvingOpmaak?: TekstSegment[];

  // 2. Situering
  situering?: string;

  // 3. Specifieke elementen
  specifiekeElementenIngeschakeld: boolean;
  specifiekeElementenAlsSituering: boolean;
  specifiekeElementen: SpecifiekElement[];

  // 4. Toelichting
  toelichting?: string;

  // 5. Aanvulling
  aanvulling?: string;
  aanvullingOpmaak?: TekstSegment[];

  // 6. Wettelijke verwijzing
  wettelijkeVerwijzing: string;
};
