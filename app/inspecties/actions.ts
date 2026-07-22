"use server";

import { revalidatePath } from "next/cache";

import { vereisGebruiker } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type OpgeslagenInbreukInput = {
  id: string;
  standaardinbreukId: string;
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
  bewaardeFotoIds: string[];
};

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
) {
  const gebruiker = await vereisGebruiker();
  const inspectie = await prisma.inspectie.findFirst({
    where: { id: inspectieId, gebruikerId: gebruiker.id },
    select: { id: true },
  });

  if (!inspectie) {
    throw new Error("Inspectie niet gevonden.");
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
        inbreuk.specifiekeElementenAlsSituering &&
        inbreuk.geselecteerdeSpecifiekeElementIds.length === 0
      ) {
        throw new Error(
          "Selecteer minstens één specifiek element dat als situering wordt gebruikt.",
        );
      }

      const data = {
        standaardinbreukId: inbreuk.standaardinbreukId || null,
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
      data: { gewijzigdOp: new Date() },
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
