export type TekstSegment = {
  tekst: string;
  vet?: boolean;
  donkergrijs?: boolean;
  /** Alleen als opvallend accent in de app; nooit in Word. */
  lijstaccent?: boolean;
};

export type SpecifiekElement = {
  id: string;
  tekst: string;
  volgorde: number;
};

export type InbreukType =
  | "STANDAARD"
  | "EAO_CODES";

export type Standaardinbreuk = {
  id: string;

  geverifieerd: boolean;
  inbreukType: InbreukType;

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

  /** Interne veldinformatie; wordt nooit opgenomen in Word. */
  inspecteurInfo?: string;
  inspecteurInfoIngeschakeld: boolean;

  // 5. Aanvulling
  aanvulling?: string;
  aanvullingOpmaak?: TekstSegment[];

  // 6. Wettelijke verwijzing
  wettelijkeVerwijzing: string;
};
