"use server";

import { revalidatePath } from "next/cache";

import { Prisma } from "@/app/generated/prisma/client";
import type { Standaardinbreuk } from "@/bibliotheek";
import { prisma } from "@/lib/prisma";

type TekstSegment = NonNullable<
  Standaardinbreuk["omschrijvingOpmaak"]
>[number];

type DatabaseInbreuk = {
  id: string;
  wetgevingId: string;
  boekId: string;
  titelId: string;

  omschrijving: string;
  omschrijvingOpmaak: Prisma.JsonValue | null;

  situering: string | null;
  toelichting: string | null;

  aanvulling: string | null;
  aanvullingOpmaak: Prisma.JsonValue | null;

  wettelijkeVerwijzing: string;
  kernwoorden: string[];
};

function valideerInbreuk(
  inbreuk: Standaardinbreuk,
): void {
  if (!inbreuk.wetgevingId.trim()) {
    throw new Error("Selecteer een wetgeving.");
  }

  if (!inbreuk.boekId.trim()) {
    throw new Error("Selecteer een boek.");
  }

  if (!inbreuk.titelId.trim()) {
    throw new Error("Selecteer een titel.");
  }

  if (!inbreuk.omschrijving.trim()) {
    throw new Error(
      "Vul een omschrijving van de inbreuk in.",
    );
  }

  if (!inbreuk.wettelijkeVerwijzing.trim()) {
    throw new Error(
      "Vul een wettelijke verwijzing in.",
    );
  }
}

function isTekstSegment(
  waarde: unknown,
): waarde is TekstSegment {
  if (
    typeof waarde !== "object" ||
    waarde === null ||
    Array.isArray(waarde)
  ) {
    return false;
  }

  const segment = waarde as Record<string, unknown>;

  return (
    typeof segment.tekst === "string" &&
    (segment.vet === undefined ||
      typeof segment.vet === "boolean") &&
    (segment.donkergrijs === undefined ||
      typeof segment.donkergrijs === "boolean")
  );
}

function leesOpmaak(
  waarde: Prisma.JsonValue | null,
): TekstSegment[] {
  if (!Array.isArray(waarde)) {
    return [];
  }

  return waarde
    .filter(isTekstSegment)
    .map((segment) => ({
      tekst: segment.tekst,
      ...(segment.vet
        ? {
            vet: true,
          }
        : {}),
      ...(segment.donkergrijs
        ? {
            donkergrijs: true,
          }
        : {}),
    }))
    .filter((segment) => segment.tekst.length > 0);
}

function normaliseerOpmaak(
  opmaak:
    | Standaardinbreuk["omschrijvingOpmaak"]
    | Standaardinbreuk["aanvullingOpmaak"],
) {
  const segmenten = (opmaak ?? [])
    .map((segment) => ({
      tekst: segment.tekst,
      ...(segment.vet
        ? {
            vet: true,
          }
        : {}),
      ...(segment.donkergrijs
        ? {
            donkergrijs: true,
          }
        : {}),
    }))
    .filter((segment) => segment.tekst.length > 0);

  if (segmenten.length === 0) {
    return Prisma.DbNull;
  }

  return segmenten;
}

function normaliseerOptioneleTekst(
  waarde: string | undefined,
): string | null {
  const tekst = waarde?.trim();

  return tekst ? tekst : null;
}

function normaliseerKernwoorden(
  kernwoorden: string[],
): string[] {
  const uniekeKernwoorden = new Map<string, string>();

  for (const kernwoord of kernwoorden) {
    const opgeschoondKernwoord = kernwoord.trim();

    if (!opgeschoondKernwoord) {
      continue;
    }

    const sleutel =
      opgeschoondKernwoord.toLocaleLowerCase("nl-BE");

    if (!uniekeKernwoorden.has(sleutel)) {
      uniekeKernwoorden.set(
        sleutel,
        opgeschoondKernwoord,
      );
    }
  }

  return [...uniekeKernwoorden.values()];
}

function zetOmNaarClientInbreuk(
  inbreuk: DatabaseInbreuk,
): Standaardinbreuk {
  return {
    id: inbreuk.id,

    wetgevingId: inbreuk.wetgevingId,
    boekId: inbreuk.boekId,
    titelId: inbreuk.titelId,

    kernwoorden: inbreuk.kernwoorden,

    omschrijving: inbreuk.omschrijving,
    omschrijvingOpmaak: leesOpmaak(
      inbreuk.omschrijvingOpmaak,
    ),

    situering: inbreuk.situering ?? "",

    toelichting: inbreuk.toelichting ?? "",

    aanvulling: inbreuk.aanvulling ?? "",
    aanvullingOpmaak: leesOpmaak(
      inbreuk.aanvullingOpmaak,
    ),

    wettelijkeVerwijzing:
      inbreuk.wettelijkeVerwijzing,
  };
}

export async function bewaarStandaardinbreuk(
  inbreuk: Standaardinbreuk,
): Promise<Standaardinbreuk> {
  valideerInbreuk(inbreuk);

  const [wetgeving, boek, titel] = await Promise.all([
    prisma.wetgeving.findUnique({
      where: {
        id: inbreuk.wetgevingId,
      },
    }),

    prisma.boek.findUnique({
      where: {
        id: inbreuk.boekId,
      },
    }),

    prisma.titel.findUnique({
      where: {
        id: inbreuk.titelId,
      },
    }),
  ]);

  if (!wetgeving) {
    throw new Error(
      "De geselecteerde wetgeving bestaat niet.",
    );
  }

  if (!boek) {
    throw new Error(
      "Het geselecteerde boek bestaat niet.",
    );
  }

  if (!titel) {
    throw new Error(
      "De geselecteerde titel bestaat niet.",
    );
  }

  if (boek.wetgevingId !== wetgeving.id) {
    throw new Error(
      "Het geselecteerde boek hoort niet bij deze wetgeving.",
    );
  }

  if (titel.boekId !== boek.id) {
    throw new Error(
      "De geselecteerde titel hoort niet bij dit boek.",
    );
  }

  const gegevens = {
    wetgevingId: wetgeving.id,
    boekId: boek.id,
    titelId: titel.id,

    omschrijving: inbreuk.omschrijving.trim(),
    omschrijvingOpmaak: normaliseerOpmaak(
      inbreuk.omschrijvingOpmaak,
    ),

    situering: normaliseerOptioneleTekst(
      inbreuk.situering,
    ),

    toelichting: normaliseerOptioneleTekst(
      inbreuk.toelichting,
    ),

    aanvulling: normaliseerOptioneleTekst(
      inbreuk.aanvulling,
    ),
    aanvullingOpmaak: normaliseerOpmaak(
      inbreuk.aanvullingOpmaak,
    ),

    wettelijkeVerwijzing:
      inbreuk.wettelijkeVerwijzing.trim(),

    kernwoorden: normaliseerKernwoorden(
      inbreuk.kernwoorden,
    ),
  };

  const opgeslagenInbreuk = inbreuk.id.trim()
    ? await prisma.standaardinbreuk.update({
        where: {
          id: inbreuk.id,
        },
        data: gegevens,
      })
    : await prisma.standaardinbreuk.create({
        data: gegevens,
      });

  revalidatePath("/bibliotheek");

  return zetOmNaarClientInbreuk(
    opgeslagenInbreuk,
  );
}

export async function verwijderStandaardinbreuk(
  inbreukId: string,
): Promise<void> {
  const opgeschoondId = inbreukId.trim();

  if (!opgeschoondId) {
    throw new Error(
      "Deze inbreuk is nog niet opgeslagen.",
    );
  }

  await prisma.standaardinbreuk.delete({
    where: {
      id: opgeschoondId,
    },
  });

  revalidatePath("/bibliotheek");
}