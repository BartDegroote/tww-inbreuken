"use server";

import { Prisma } from "@/app/generated/prisma/client";
import { revalidatePath } from "next/cache";

import {
  zoekEaoCode,
  type EaoCodeCategorie,
  type InbreukType,
} from "@/bibliotheek";
import { vereisGebruiker } from "@/lib/auth";
import { MAX_FOTOS_PER_INBREUK } from "@/lib/inspectie-limieten";
import { prisma } from "@/lib/prisma";

export type VaststellingInput = {
  id: string;
  tekst: string;
  geselecteerdeSpecifiekeElementIds: string[];
  eigenElementen: string[];
};

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
  eigenElementenToegestaan: boolean;
  vaststellingen: VaststellingInput[];
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

export type Aanspreking =
  | "HEER"
  | "MEVROUW"
  | "";

export type OntmoetePersoonInput = {
  aanspreking: Aanspreking;
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
  vereisAanspreking = false,
): OntmoetePersoonInput[] {
  if (personen.length > 50) {
    throw new Error(
      "Je kunt maximaal 50 ontmoete personen toevoegen.",
    );
  }

  return personen
    .map((persoon) => {
      const aanspreking: Aanspreking =
        persoon.aanspreking === "HEER" ||
        persoon.aanspreking === "MEVROUW"
          ? persoon.aanspreking
          : "";

      return {
        aanspreking,
        naam: persoon.naam.trim(),
        functie: persoon.functie.trim(),
      };
    })
    .filter(
      (persoon) =>
        persoon.aanspreking.length > 0 ||
        persoon.naam.length > 0 ||
        persoon.functie.length > 0,
    )
    .map((persoon) => {
      if (
        !persoon.naam ||
        !persoon.functie ||
        (vereisAanspreking &&
          !persoon.aanspreking)
      ) {
        throw new Error(
          vereisAanspreking
            ? "Kies voor elke ontmoete persoon de aanspreking en vul de naam en functie in."
            : "Vul voor elke ontmoete persoon de naam en functie in.",
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

function normaliseerVaststellingen(
  inbreuk: OpgeslagenInbreukInput,
): VaststellingInput[] {
  if (inbreuk.inbreukType === "EAO_CODES") {
    return [];
  }

  if (inbreuk.vaststellingen.length > 50) {
    throw new Error(
      "Je kunt maximaal 50 vaststellingen aan één inbreuk toevoegen.",
    );
  }

  const beschikbareElementIds = new Set(
    inbreuk.specifiekeElementen.map(
      (element) => element.id,
    ),
  );

  const vaststellingen =
    inbreuk.vaststellingen.map(
      (vaststelling, index) => {
        const tekst =
          vaststelling.tekst.trim();
        const geselecteerdeSpecifiekeElementIds =
          Array.from(
            new Set(
              vaststelling
                .geselecteerdeSpecifiekeElementIds,
            ),
          ).filter((id) =>
            beschikbareElementIds.has(id),
          );
        const eigenElementen = Array.from(
          new Map(
            vaststelling.eigenElementen
              .map((element) => element.trim())
              .filter(Boolean)
              .map((element) => [
                element.toLocaleLowerCase(
                  "nl-BE",
                ),
                element,
              ]),
          ).values(),
        );

        if (
          eigenElementen.length > 50 ||
          eigenElementen.some(
            (element) =>
              element.length > 1_000,
          )
        ) {
          throw new Error(
            `Controleer de vrije elementen bij vaststelling ${index + 1}.`,
          );
        }

        if (
          eigenElementen.length > 0 &&
          !inbreuk.eigenElementenToegestaan
        ) {
          throw new Error(
            "Vrije elementen zijn voor deze standaardinbreuk niet ingeschakeld.",
          );
        }

        if (
          !tekst &&
          geselecteerdeSpecifiekeElementIds.length ===
            0 &&
          eigenElementen.length === 0
        ) {
          return null;
        }

        if (tekst.length > 5_000) {
          throw new Error(
            `Vaststelling ${index + 1} mag maximaal 5.000 tekens bevatten.`,
          );
        }

        return {
          id:
            vaststelling.id.trim() ||
            `vaststelling-${index + 1}`,
          tekst,
          geselecteerdeSpecifiekeElementIds,
          eigenElementen,
        };
      },
    ).filter(
      (
        vaststelling,
      ): vaststelling is VaststellingInput =>
        vaststelling !== null,
    );

  return vaststellingen;
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

export async function bewaarOntmoetePersonen(
  inspectieId: string,
  personen: OntmoetePersoonInput[],
): Promise<void> {
  const gebruiker = await vereisGebruiker();
  const ontmoetePersonen =
    normaliseerOntmoetePersonen(personen, true);
  const resultaat =
    await prisma.inspectie.updateMany({
      where: {
        id: inspectieId,
        gebruikerId: gebruiker.id,
        status: { not: "VERWIJDERD" },
      },
      data: { ontmoetePersonen },
    });

  if (resultaat.count === 0) {
    throw new Error("Inspectie niet gevonden.");
  }

  revalidatePath("/inspecties");
  revalidatePath("/inspecties/uitvoeren");
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
      !ongevalsdatum)
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
      (werkhervattingsdatum &&
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
      if (
        inbreuk.bewaardeFotoIds.length >
          MAX_FOTOS_PER_INBREUK ||
        new Set(inbreuk.bewaardeFotoIds).size !==
          inbreuk.bewaardeFotoIds.length
      ) {
        throw new Error(
          `Je kunt maximaal ${MAX_FOTOS_PER_INBREUK} foto’s aan één inbreuk koppelen.`,
        );
      }

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
      const vaststellingen =
        normaliseerVaststellingen(inbreuk);
      const eersteVaststelling =
        vaststellingen[0];

      if (
        inbreukType === "EAO_CODES" &&
        !ongevalsgegevens.ernstigArbeidsongeval
      ) {
        throw new Error(
          "Schakel Ernstig arbeidsongeval in om een EAO-code-inbreuk te gebruiken.",
        );
      }

      const data = {
        standaardinbreukId: inbreuk.standaardinbreukId || null,
        inbreukType,
        volgorde,
        beschrijving: inbreuk.beschrijving,
        beschrijvingOpmaak: inbreuk.beschrijvingOpmaak,
        inCasu:
          eersteVaststelling?.tekst ?? "",
        toelichting: inbreuk.toelichting,
        aanvulling: inbreuk.aanvulling,
        aanvullingOpmaak: inbreuk.aanvullingOpmaak,
        wettelijkeVerwijzing: inbreuk.wettelijkeVerwijzing,
        specifiekeElementen: inbreuk.specifiekeElementen,
        geselecteerdeSpecifiekeElementIds:
          eersteVaststelling
            ?.geselecteerdeSpecifiekeElementIds ??
          [],
        specifiekeElementenAlsSituering:
          inbreuk.specifiekeElementenAlsSituering,
        eigenElementenToegestaan:
          inbreuk.eigenElementenToegestaan,
        vaststellingen:
          vaststellingen as Prisma.InputJsonValue,
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
          ongevalsgegevens.slachtofferWerkHervat === true &&
          werkhervattingsdatum
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
