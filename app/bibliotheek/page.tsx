import type {
  Standaardinbreuk,
  TekstSegment,
} from "@/bibliotheek";
import { prisma } from "@/lib/prisma";

import BibliotheekClient from "@/app/bibliotheek/BibliotheekClient";

export const dynamic = "force-dynamic";

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
  waarde: unknown,
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

export default async function BibliotheekPagina() {
  const [
    databaseWetgevingen,
    databaseBoeken,
    databaseTitels,
    databaseInbreuken,
  ] = await Promise.all([
    prisma.wetgeving.findMany({
      orderBy: {
        naam: "asc",
      },
    }),

    prisma.boek.findMany({
      orderBy: {
        naam: "asc",
      },
    }),

    prisma.titel.findMany({
      orderBy: [
        {
          boekId: "asc",
        },
        {
          naam: "asc",
        },
      ],
    }),

    prisma.standaardinbreuk.findMany({
      orderBy: {
        gewijzigdOp: "desc",
      },
    }),
  ]);

  const wetgevingen = databaseWetgevingen.map(
    (wetgeving) => ({
      id: wetgeving.id,
      naam: wetgeving.naam,
    }),
  );

  const boeken = databaseBoeken.map((boek) => ({
    id: boek.id,
    naam: boek.naam,
    wetgevingId: boek.wetgevingId,
  }));

  const titels = databaseTitels.map((titel) => ({
    id: titel.id,
    naam: titel.naam,
    onderwerp: titel.onderwerp,
    boekId: titel.boekId,
  }));

  const inbreuken: Standaardinbreuk[] =
    databaseInbreuken.map((inbreuk) => ({
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
    }));

  return (
    <BibliotheekClient
      startWetgevingen={wetgevingen}
      startBoeken={boeken}
      startTitels={titels}
      startInbreuken={inbreuken}
    />
  );
}