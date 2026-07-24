"use server";

import { revalidatePath } from "next/cache";

import {
  zoekEaoCode,
  type EaoCodeCategorie,
  type InbreukType,
} from "@/bibliotheek";
import { vereisGebruiker } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type OpgeslagenInbreukInput = {
  id: string;
  standaardinbreukId: string;
  inbreukType: InbreukType;
  beschrijving: string;
  beschrijvingOpmaak: Array<{
    tekst: string;
    vet?: boolean;
    donkergrijs?: boolean;
    lijstaccent?: boolean;
  }>;
  inCasu: string;
  toelichting: string;
  aanvulling: string;
  aanvullingOpmaak: Array<{
    tekst: string;
    vet?: boolean;
    donkergrijs?: boolean;
    lijstaccent?: boolean;
  }>;
  wettelijkeVerwijzing: string;
  specifiekeElementen: Array<{ id: string; tekst: string }>;
  geselecteerdeSpecifiekeElementIds: string[];
  specifiekeElementenAlsSituering: boolean;
  afwijkendeGebeurtenisCode: string;
  betrokkenVoorwerpCode: string;
  soortLetselCode: string;
  bewaardeFotoIds: string[];
};

export type OngevalsgegevensInput = {
  ernstigArbeidsongeval: boolean;
  slachtofferVoornaam: string;
  slachtofferNaam: string;
  ongevalsdatum: string;
  slachtofferWerkHervat: boolean | null;
  werkhervattingsdatum: string;
  werkpostBezocht: boolean | null;
};

export type OntmoetePersoonInput = {
  naam: string;
  functie: string;
};

function controleerEaoCode(
  categorie: EaoCodeCategorie,
  code: string,
  veldnaam: string,
): string {
  const opgeschoondeCode = code.trim();

  if (
    !opgeschoondeCode ||
    !zoekEaoCode(categorie, opgeschoondeCode)
  ) {
    throw new Error(
      `Kies een geldige code voor ${veldnaam}.`,
    );
  }

  return opgeschoondeCode;
}

function normaliseerOntmoetePersonen(
  personen: OntmoetePersoonInput[],
): OntmoetePersoonInput[] {
  if (personen.length > 50) {
    throw new Error(
      "Je kunt maximaal 50 ontmoete personen toevoegen.",
    );
  }

  return personen
    .map((persoon) => ({
      naam: persoon.naam.trim(),
      functie: persoon.functie.trim(),
    }))
    .filter(
      (persoon) =>
        persoon.naam.length > 0 ||
        persoon.functie.length > 0,
    )
    .map((persoon) => {
      if (!persoon.naam || !persoon.functie) {
        throw new Error(
          "Vul voor elke ontmoete persoon zowel de naam als de functie in.",
        );
      }

      if (
        persoon.naam.length > 150 ||
        persoon.functie.length > 150
      ) {
        throw new Error(
          "De naam en functie van een ontmoete persoon mogen maximaal 150 tekens bevatten.",
        );
      }

      return persoon;
    });
}

export async function maakInspectie(input: {
  onderneming: string;
  adres: string;
  inspectiedatum: string;
  inspecteur: string;
  flow: string;
}): Promise<string> {
  const gebruiker = await vereisGebruiker();
  const onderneming = input.onderneming.trim();
  const inspectiedatum = input.inspectiedatum.trim();
  const inspecteur = input.inspecteur.trim();
  const flow = input.flow.trim();

  if (!onderneming || !inspectiedatum || !inspecteur || !flow) {
    throw new Error("Vul alle verplichte inspectiegegevens in.");
  }

  const inspectie = await prisma.inspectie.create({
    data: {
      onderneming,
      adres: input.adres.trim(),
      inspectiedatum,
      inspecteur,
      flow,
      gebruikerId: gebruiker.id,
    },
    select: {
      id: true,
    },
  });

  revalidatePath("/inspecties");
  return inspectie.id;
}

export async function bewaarInspectie(
  inspectieId: string,
  inbreuken: OpgeslagenInbreukInput[],
  ongevalsgegevens: OngevalsgegevensInput,
  ontmoetePersonen: OntmoetePersoonInput[],
) {
  const gebruiker = await vereisGebruiker();
  const inspectie = await prisma.inspectie.findFirst({
    where: { id: inspectieId, gebruikerId: gebruiker.id },
    select: { id: true },
  });

  if (!inspectie) {
    throw new Error("Inspectie niet gevonden.");
  }

  const slachtofferVoornaam =
    ongevalsgegevens.slachtofferVoornaam.trim();
  const slachtofferNaam =
    ongevalsgegevens.slachtofferNaam.trim();
  const ongevalsdatum =
    ongevalsgegevens.ongevalsdatum.trim();
  const werkhervattingsdatum =
    ongevalsgegevens.werkhervattingsdatum.trim();
  const genormaliseerdeOntmoetePersonen =
    normaliseerOntmoetePersonen(ontmoetePersonen);

  if (
    ongevalsgegevens.ernstigArbeidsongeval &&
    (!slachtofferVoornaam ||
      !slachtofferNaam ||
      !ongevalsdatum ||
      ongevalsgegevens.slachtofferWerkHervat === null ||
      (ongevalsgegevens.slachtofferWerkHervat &&
        !werkhervattingsdatum) ||
      ongevalsgegevens.werkpostBezocht === null)
  ) {
    throw new Error(
      "Vul alle gegevens over het ernstig arbeidsongeval in.",
    );
  }

  if (
    ongevalsgegevens.ernstigArbeidsongeval &&
    (slachtofferVoornaam.length > 100 ||
      slachtofferNaam.length > 100 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(
        ongevalsdatum,
      ) ||
      (ongevalsgegevens.slachtofferWerkHervat &&
        !/^\d{4}-\d{2}-\d{2}$/.test(
          werkhervattingsdatum,
        )))
  ) {
    throw new Error(
      "Controleer de naam en datum van het ernstig arbeidsongeval.",
    );
  }

  await prisma.$transaction(async (transactie) => {
    const ids = inbreuken.map((inbreuk) => inbreuk.id);

    if (new Set(ids).size !== ids.length) {
      throw new Error("De inspectie bevat dubbele inbreuk-ID’s.");
    }

    if (ids.length > 0) {
      const vreemdeInbreuken = await transactie.inspectieInbreuk.count({
        where: {
          id: { in: ids },
          inspectieId: { not: inspectieId },
        },
      });

      if (vreemdeInbreuken > 0) {
        throw new Error("Een inbreuk behoort niet tot deze inspectie.");
      }
    }

    await transactie.inspectieInbreuk.deleteMany({
      where: {
        inspectieId,
        ...(ids.length > 0 ? { id: { notIn: ids } } : {}),
      },
    });

    for (const [volgorde, inbreuk] of inbreuken.entries()) {
      const inbreukType: InbreukType =
        inbreuk.inbreukType === "EAO_CODES"
          ? "EAO_CODES"
          : "STANDAARD";
      const afwijkendeGebeurtenisCode =
        inbreukType === "EAO_CODES"
          ? controleerEaoCode(
              "afwijkendeGebeurtenissen",
              inbreuk.afwijkendeGebeurtenisCode,
              "afwijkende gebeurtenis",
            )
          : null;
      const betrokkenVoorwerpCode =
        inbreukType === "EAO_CODES"
          ? controleerEaoCode(
              "betrokkenVoorwerpen",
              inbreuk.betrokkenVoorwerpCode,
              "betrokken voorwerp",
            )
          : null;
      const soortLetselCode =
        inbreukType === "EAO_CODES"
          ? controleerEaoCode(
              "soortenLetsel",
              inbreuk.soortLetselCode,
              "soort letsel",
            )
          : null;

      if (
        inbreukType === "EAO_CODES" &&
        !ongevalsgegevens.ernstigArbeidsongeval
      ) {
        throw new Error(
          "Schakel Ernstig arbeidsongeval in om een EAO-code-inbreuk te gebruiken.",
        );
      }

      if (
        inbreukType === "STANDAARD" &&
        inbreuk.specifiekeElementenAlsSituering &&
        inbreuk.geselecteerdeSpecifiekeElementIds.length === 0
      ) {
        throw new Error(
          "Selecteer minstens één specifiek element dat als situering wordt gebruikt.",
        );
      }

      const data = {
        standaardinbreukId: inbreuk.standaardinbreukId || null,
        inbreukType,
        volgorde,
        beschrijving: inbreuk.beschrijving,
        beschrijvingOpmaak: inbreuk.beschrijvingOpmaak,
        inCasu: inbreuk.inCasu,
        toelichting: inbreuk.toelichting,
        aanvulling: inbreuk.aanvulling,
        aanvullingOpmaak: inbreuk.aanvullingOpmaak,
        wettelijkeVerwijzing: inbreuk.wettelijkeVerwijzing,
        specifiekeElementen: inbreuk.specifiekeElementen,
        geselecteerdeSpecifiekeElementIds:
          inbreuk.geselecteerdeSpecifiekeElementIds,
        specifiekeElementenAlsSituering:
          inbreuk.specifiekeElementenAlsSituering,
        afwijkendeGebeurtenisCode,
        betrokkenVoorwerpCode,
        soortLetselCode,
      };

      await transactie.inspectieInbreuk.upsert({
        where: { id: inbreuk.id },
        create: { id: inbreuk.id, inspectieId, ...data },
        update: data,
      });
    }

    if (inbreuken.length > 0) {
      await transactie.inspectieFoto.deleteMany({
        where: {
          OR: inbreuken.map((inbreuk) => ({
            inspectieInbreukId: inbreuk.id,
            ...(inbreuk.bewaardeFotoIds.length > 0
              ? {
                  id: {
                    notIn: inbreuk.bewaardeFotoIds,
                  },
                }
              : {}),
          })),
        },
      });
    }

    await transactie.inspectie.update({
      where: { id: inspectieId },
      data: {
        ontmoetePersonen:
          genormaliseerdeOntmoetePersonen,
        ernstigArbeidsongeval:
          ongevalsgegevens.ernstigArbeidsongeval,
        slachtofferVoornaam:
          ongevalsgegevens.ernstigArbeidsongeval
            ? slachtofferVoornaam
            : null,
        slachtofferNaam:
          ongevalsgegevens.ernstigArbeidsongeval
            ? slachtofferNaam
            : null,
        ongevalsdatum:
          ongevalsgegevens.ernstigArbeidsongeval
            ? ongevalsdatum
            : null,
        slachtofferWerkHervat:
          ongevalsgegevens.ernstigArbeidsongeval
            ? ongevalsgegevens.slachtofferWerkHervat
            : null,
        werkhervattingsdatum:
          ongevalsgegevens.ernstigArbeidsongeval &&
          ongevalsgegevens.slachtofferWerkHervat
            ? werkhervattingsdatum
            : null,
        werkpostBezocht:
          ongevalsgegevens.ernstigArbeidsongeval
            ? ongevalsgegevens.werkpostBezocht
            : null,
        gewijzigdOp: new Date(),
      },
    });
  }, { timeout: 60_000 });

  revalidatePath("/inspecties");
  revalidatePath("/inspecties/uitvoeren");
  return { opgeslagenOp: new Date().toISOString() };
}

export async function verplaatsNaarPrullenmand(inspectieId: string) {
  const gebruiker = await vereisGebruiker();
  await prisma.inspectie.updateMany({
    where: { id: inspectieId, gebruikerId: gebruiker.id },
    data: { status: "VERWIJDERD", verwijderdOp: new Date() },
  });
  revalidatePath("/inspecties");
}

export async function herstelInspectie(inspectieId: string) {
  const gebruiker = await vereisGebruiker();
  await prisma.inspectie.updateMany({
    where: { id: inspectieId, gebruikerId: gebruiker.id },
    data: { status: "CONCEPT", verwijderdOp: null },
  });
  revalidatePath("/inspecties");
}

export async function verwijderInspectieDefinitief(inspectieId: string) {
  const gebruiker = await vereisGebruiker();
  await prisma.inspectie.deleteMany({
    where: {
      id: inspectieId,
      gebruikerId: gebruiker.id,
      status: "VERWIJDERD",
    },
  });
  revalidatePath("/inspecties");
}
