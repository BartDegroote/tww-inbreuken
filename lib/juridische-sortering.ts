import { vergelijkBoekIds } from "@/bibliotheek/boeken";
import { vergelijkWetgevingIds } from "@/bibliotheek/wetgevingen";

type SorteerbareInbreuk = {
  standaardinbreukId: string;
  wettelijkeVerwijzing: string;
};

type JuridischeIndeling = {
  id: string;
  wetgevingId: string;
  boekId: string;
  titelId: string;
};

type WetgevingOptie = {
  id: string;
  naam: string;
};

type ArtikelSleutel = {
  boek: number;
  titel: number;
  artikel: number;
};

const natuurlijkeVergelijker = new Intl.Collator("nl-BE", {
  numeric: true,
  sensitivity: "base",
});

function romeinsNaarGetal(waarde: string): number {
  const waarden: Record<string, number> = {
    I: 1,
    V: 5,
    X: 10,
    L: 50,
    C: 100,
    D: 500,
    M: 1000,
  };

  let totaal = 0;
  let vorige = 0;

  for (const teken of waarde.toUpperCase().split("").reverse()) {
    const huidig = waarden[teken] ?? 0;
    totaal += huidig < vorige ? -huidig : huidig;
    vorige = Math.max(vorige, huidig);
  }

  return totaal;
}

function leesArtikelSleutel(tekst: string): ArtikelSleutel | null {
  const resultaat = tekst.match(
    /(?:artikel|art\.?)?\s*\b([IVXLCDM]+)\.(\d+)-(\d+)\b/i,
  );

  if (!resultaat) return null;

  return {
    boek: romeinsNaarGetal(resultaat[1]),
    titel: Number(resultaat[2]),
    artikel: Number(resultaat[3]),
  };
}

function leesTitelNummer(titelId: string): number {
  if (titelId.endsWith("-algemeen")) {
    return 0;
  }

  return Number(
    titelId.match(
      /-(?:titel|afdeling)-(\d+)$/,
    )?.[1] ?? Number.MAX_SAFE_INTEGER,
  );
}

function vergelijkGetallen(a: number, b: number): number {
  return a === b ? 0 : a < b ? -1 : 1;
}

export function sorteerInbreukenJuridisch<T extends SorteerbareInbreuk>(
  inbreuken: T[],
  indelingen: JuridischeIndeling[],
  wetgevingen: WetgevingOptie[],
): T[] {
  const indelingPerId = new Map(
    indelingen.map((indeling) => [indeling.id, indeling]),
  );
  const wetgevingNaamPerId = new Map(
    wetgevingen.map((wetgeving) => [
      wetgeving.id,
      wetgeving.naam,
    ]),
  );

  return inbreuken
    .map((inbreuk, oorspronkelijkeVolgorde) => ({
      inbreuk,
      oorspronkelijkeVolgorde,
      indeling: indelingPerId.get(inbreuk.standaardinbreukId),
      artikel: leesArtikelSleutel(inbreuk.wettelijkeVerwijzing),
    }))
    .sort((a, b) => {
      const wetgevingA = a.indeling?.wetgevingId ?? "";
      const wetgevingB = b.indeling?.wetgevingId ?? "";
      const wetgevingVerschil = vergelijkWetgevingIds(
        wetgevingA,
        wetgevingB,
      );
      if (wetgevingVerschil !== 0) return wetgevingVerschil;

      const onbekendeWetgevingVerschil =
        natuurlijkeVergelijker.compare(
          wetgevingNaamPerId.get(wetgevingA) ?? wetgevingA,
          wetgevingNaamPerId.get(wetgevingB) ?? wetgevingB,
        );
      if (onbekendeWetgevingVerschil !== 0) {
        return onbekendeWetgevingVerschil;
      }

      const boekA = a.indeling?.boekId ?? "";
      const boekB = b.indeling?.boekId ?? "";
      const codexBoekVerschil = vergelijkBoekIds(boekA, boekB);
      if (codexBoekVerschil !== 0) return codexBoekVerschil;

      const anderBoekVerschil = natuurlijkeVergelijker.compare(boekA, boekB);
      if (anderBoekVerschil !== 0) return anderBoekVerschil;

      const titelVerschil = vergelijkGetallen(
        leesTitelNummer(a.indeling?.titelId ?? ""),
        leesTitelNummer(b.indeling?.titelId ?? ""),
      );
      if (titelVerschil !== 0) return titelVerschil;

      if (a.artikel && b.artikel) {
        const boekArtikelVerschil = vergelijkGetallen(a.artikel.boek, b.artikel.boek);
        if (boekArtikelVerschil !== 0) return boekArtikelVerschil;

        const titelArtikelVerschil = vergelijkGetallen(a.artikel.titel, b.artikel.titel);
        if (titelArtikelVerschil !== 0) return titelArtikelVerschil;

        const artikelVerschil = vergelijkGetallen(a.artikel.artikel, b.artikel.artikel);
        if (artikelVerschil !== 0) return artikelVerschil;
      } else if (a.artikel || b.artikel) {
        return a.artikel ? -1 : 1;
      }

      const verwijzingVerschil = natuurlijkeVergelijker.compare(
        a.inbreuk.wettelijkeVerwijzing,
        b.inbreuk.wettelijkeVerwijzing,
      );
      if (verwijzingVerschil !== 0) return verwijzingVerschil;

      return a.oorspronkelijkeVolgorde - b.oorspronkelijkeVolgorde;
    })
    .map(({ inbreuk }) => inbreuk);
}
