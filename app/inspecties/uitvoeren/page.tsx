import { leesTekstSegmenten } from "@/bibliotheek/tekstsegmenten";
import { prisma } from "@/lib/prisma";
import { vereisGebruiker } from "@/lib/auth";
import { haalBibliotheekGegevensOp } from "@/lib/bibliotheek-data";
import { notFound, redirect } from "next/navigation";

import InspectieUitvoerenClient, { type Inbreuk } from "./InspectieUitvoerenClient";

export const dynamic = "force-dynamic";

type ZoekParameters = Promise<
  Record<string, string | string[] | undefined>
>;

type InspectieUitvoerenPaginaProps = {
  searchParams: ZoekParameters;
};

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

  const [inspectie, bibliotheek] = await Promise.all([
    prisma.inspectie.findFirst({
      where: {
        id: inspectieId,
        gebruikerId: gebruiker.id,
        status: { not: "VERWIJDERD" },
      },
      select: {
        id: true,
        onderneming: true,
        adres: true,
        inspectiedatum: true,
        inspecteur: true,
        flow: true,
        inbreuken: {
          orderBy: { volgorde: "asc" },
          select: {
            id: true,
            standaardinbreukId: true,
            beschrijving: true,
            beschrijvingOpmaak: true,
            inCasu: true,
            toelichting: true,
            aanvulling: true,
            aanvullingOpmaak: true,
            wettelijkeVerwijzing: true,
            specifiekeElementen: true,
            geselecteerdeSpecifiekeElementIds: true,
            fotos: {
              orderBy: { aangemaaktOp: "asc" },
              select: { id: true, naam: true },
            },
          },
        },
      },
    }),
    haalBibliotheekGegevensOp(),
  ]);

  if (!inspectie) notFound();

  const {
    wetgevingen,
    boeken,
    titels,
    inbreuken: standaardinbreuken,
  } = bibliotheek;

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
      beschrijvingOpmaak: leesTekstSegmenten(inbreuk.beschrijvingOpmaak),
      inCasu: inbreuk.inCasu,
      toelichting: inbreuk.toelichting,
      aanvulling: inbreuk.aanvulling,
      aanvullingOpmaak: leesTekstSegmenten(inbreuk.aanvullingOpmaak),
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
