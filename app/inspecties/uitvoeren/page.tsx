import type {
  Standaardinbreuk,
  TekstSegment,
} from "@/bibliotheek";
import { vergelijkBoekIds } from "@/bibliotheek/boeken";
import { vergelijkTitelIds } from "@/bibliotheek/titels";
import { prisma } from "@/lib/prisma";
import { vereisGebruiker } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";

import InspectieUitvoerenClient, { type Inbreuk } from "./InspectieUitvoerenClient";

export const dynamic = "force-dynamic";

type ZoekParameters = Promise<
  Record<string, string | string[] | undefined>
>;

type InspectieUitvoerenPaginaProps = {
  searchParams: ZoekParameters;
};

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

function leesZoekParameter(
  waarde: string | string[] | undefined,
): string {
  if (Array.isArray(waarde)) {
    return waarde[0] ?? "";
  }

  return waarde ?? "";
}

export default async function InspectieUitvoerenPagina({
  searchParams,
}: InspectieUitvoerenPaginaProps) {
  const parameters = await searchParams;
  const gebruiker = await vereisGebruiker();
  const inspectieId = leesZoekParameter(parameters.id);

  if (!inspectieId) {
    redirect("/inspecties/nieuw");
  }

  const inspectie = await prisma.inspectie.findFirst({
    where: { id: inspectieId, gebruikerId: gebruiker.id, status: { not: "VERWIJDERD" } },
    include: {
      inbreuken: {
        orderBy: { volgorde: "asc" },
        include: {
          fotos: {
            orderBy: { aangemaaktOp: "asc" },
            select: { id: true, naam: true },
          },
        },
      },
    },
  });

  if (!inspectie) notFound();

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

  const standaardinbreuken: Standaardinbreuk[] =
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

  const initialInbreuken: Inbreuk[] = inspectie.inbreuken.map((inbreuk) => {
    const specifiekeElementen = Array.isArray(inbreuk.specifiekeElementen)
      ? inbreuk.specifiekeElementen.filter(
          (element): element is { id: string; tekst: string } =>
            typeof element === "object" &&
            element !== null &&
            !Array.isArray(element) &&
            typeof (element as { id?: unknown }).id === "string" &&
            typeof (element as { tekst?: unknown }).tekst === "string",
        )
      : [];

    return {
      id: inbreuk.id,
      standaardinbreukId: inbreuk.standaardinbreukId ?? "",
      beschrijving: inbreuk.beschrijving,
      beschrijvingOpmaak: leesOpmaak(inbreuk.beschrijvingOpmaak),
      inCasu: inbreuk.inCasu,
      toelichting: inbreuk.toelichting,
      aanvulling: inbreuk.aanvulling,
      aanvullingOpmaak: leesOpmaak(inbreuk.aanvullingOpmaak),
      wettelijkeVerwijzing: inbreuk.wettelijkeVerwijzing,
      specifiekeElementen,
      geselecteerdeSpecifiekeElementIds:
        inbreuk.geselecteerdeSpecifiekeElementIds,
      fotos: inbreuk.fotos.map((foto) => ({
        id: foto.id,
        naam: foto.naam,
        url: `/api/fotos/${foto.id}`,
      })),
    };
  });

  return (
    <InspectieUitvoerenClient
      inspectieId={inspectie.id}
      onderneming={inspectie.onderneming}
      adres={inspectie.adres}
      inspectiedatum={inspectie.inspectiedatum}
      inspecteur={inspectie.inspecteur}
      flow={inspectie.flow}
      wetgevingen={wetgevingen}
      boeken={boeken}
      titels={titels}
      standaardinbreuken={standaardinbreuken}
      initialInbreuken={initialInbreuken}
    />
  );
}
