import type {
  Standaardinbreuk,
  TekstSegment,
} from "@/bibliotheek";
import { vergelijkBoekIds } from "@/bibliotheek/boeken";
import { vergelijkTitelIds } from "@/bibliotheek/titels";
import { prisma } from "@/lib/prisma";
import { vereisGebruiker } from "@/lib/auth";

import BibliotheekClient from "./BibliotheekClient";

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
      ...(segment.vet ? { vet: true } : {}),
      ...(segment.donkergrijs
        ? { donkergrijs: true }
        : {}),
    }))
    .filter((segment) => segment.tekst.length > 0);
}

export default async function BibliotheekPagina() {
  await vereisGebruiker();

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
      include: {
        specifiekeElementen: {
          orderBy: {
            volgorde: "asc",
          },
        },
      },
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

  const boeken = databaseBoeken
    .map((boek) => ({
      id: boek.id,
      naam: boek.naam,
      wetgevingId: boek.wetgevingId,
    }))
    .sort((a, b) => vergelijkBoekIds(a.id, b.id));

  const titels = databaseTitels
    .map((titel) => ({
      id: titel.id,
      naam: titel.naam,
      boekId: titel.boekId,
    }))
    .sort(vergelijkTitelIds);

  const inbreuken: Standaardinbreuk[] =
    databaseInbreuken.map((inbreuk) => ({
      id: inbreuk.id,

      geverifieerd: inbreuk.geverifieerd,

      wetgevingId: inbreuk.wetgevingId,
      boekId: inbreuk.boekId,
      titelId: inbreuk.titelId,

      onderwerp: inbreuk.onderwerp,

      kernwoorden: inbreuk.kernwoorden,

      omschrijving: inbreuk.omschrijving,
      omschrijvingOpmaak: leesOpmaak(
        inbreuk.omschrijvingOpmaak,
      ),

      situering: inbreuk.situering ?? "",

      specifiekeElementenIngeschakeld:
        inbreuk.specifiekeElementenIngeschakeld,
      specifiekeElementen:
        inbreuk.specifiekeElementen.map(
          (element) => ({
            id: element.id,
            tekst: element.tekst,
            volgorde: element.volgorde,
          }),
        ),

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
