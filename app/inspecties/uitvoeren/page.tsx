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
        ontmoetePersonen: true,
        ernstigArbeidsongeval: true,
        slachtofferVoornaam: true,
        slachtofferNaam: true,
        ongevalsdatum: true,
        slachtofferWerkHervat: true,
        werkhervattingsdatum: true,
        werkpostBezocht: true,
        inbreuken: {
          orderBy: { volgorde: "asc" },
          select: {
            id: true,
            standaardinbreukId: true,
            inbreukType: true,
            beschrijving: true,
            beschrijvingOpmaak: true,
            inCasu: true,
            toelichting: true,
            aanvulling: true,
            aanvullingOpmaak: true,
            wettelijkeVerwijzing: true,
            specifiekeElementen: true,
            geselecteerdeSpecifiekeElementIds: true,
            specifiekeElementenAlsSituering: true,
            eigenElementenToegestaan: true,
            vaststellingen: true,
            afwijkendeGebeurtenisCode: true,
            betrokkenVoorwerpCode: true,
            soortLetselCode: true,
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
    const standaardinbreuk =
      standaardinbreuken.find(
        (standaard) =>
          standaard.id ===
          inbreuk.standaardinbreukId,
      );
    const opgeslagenVaststellingen =
      Array.isArray(inbreuk.vaststellingen)
        ? inbreuk.vaststellingen
            .filter(
              (
                vaststelling,
              ): vaststelling is {
                id: string;
                tekst: string;
                geselecteerdeSpecifiekeElementIds: string[];
                eigenElementen: string[];
              } =>
                typeof vaststelling ===
                  "object" &&
                vaststelling !== null &&
                !Array.isArray(vaststelling) &&
                typeof (
                  vaststelling as {
                    id?: unknown;
                  }
                ).id === "string" &&
                typeof (
                  vaststelling as {
                    tekst?: unknown;
                  }
                ).tekst === "string" &&
                Array.isArray(
                  (
                    vaststelling as {
                      geselecteerdeSpecifiekeElementIds?: unknown;
                    }
                  )
                    .geselecteerdeSpecifiekeElementIds,
                ) &&
                Array.isArray(
                  (
                    vaststelling as {
                      eigenElementen?: unknown;
                    }
                  ).eigenElementen,
                ),
            )
            .map((vaststelling) => ({
              id: vaststelling.id,
              tekst: vaststelling.tekst,
              geselecteerdeSpecifiekeElementIds:
                vaststelling
                  .geselecteerdeSpecifiekeElementIds
                  .filter(
                    (id): id is string =>
                      typeof id === "string",
                  ),
              eigenElementen:
                vaststelling.eigenElementen.filter(
                  (
                    element,
                  ): element is string =>
                    typeof element === "string",
                ),
            }))
        : [];
    const vaststellingen =
      opgeslagenVaststellingen.length > 0
        ? opgeslagenVaststellingen
        : [
            {
              id: `${inbreuk.id}-vaststelling-1`,
              tekst: inbreuk.inCasu,
              geselecteerdeSpecifiekeElementIds:
                inbreuk
                  .geselecteerdeSpecifiekeElementIds,
              eigenElementen: [],
            },
          ];

    return {
      id: inbreuk.id,
      standaardinbreukId: inbreuk.standaardinbreukId ?? "",
      inbreukType:
        inbreuk.inbreukType === "EAO_CODES"
          ? "EAO_CODES"
          : "STANDAARD",
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
      specifiekeElementenAlsSituering:
        inbreuk.specifiekeElementenAlsSituering,
      eigenElementenToegestaan:
        inbreuk.eigenElementenToegestaan ||
        standaardinbreuk
          ?.eigenElementenToegestaan ||
        false,
      vaststellingen,
      afwijkendeGebeurtenisCode:
        inbreuk.afwijkendeGebeurtenisCode ?? "",
      betrokkenVoorwerpCode:
        inbreuk.betrokkenVoorwerpCode ?? "",
      soortLetselCode:
        inbreuk.soortLetselCode ?? "",
      fotos: inbreuk.fotos.map((foto) => ({
        id: foto.id,
        naam: foto.naam,
        url: `/api/fotos/${foto.id}`,
      })),
    };
  });

  const initialOntmoetePersonen = Array.isArray(
    inspectie.ontmoetePersonen,
  )
    ? inspectie.ontmoetePersonen.flatMap(
        (persoon) => {
          if (
            typeof persoon !== "object" ||
            persoon === null ||
            Array.isArray(persoon)
          ) {
            return [];
          }

          const naam = persoon.naam;
          const functie = persoon.functie;

          if (
            typeof naam !== "string" ||
            typeof functie !== "string"
          ) {
            return [];
          }

          const aanspreking:
            | "HEER"
            | "MEVROUW"
            | "" =
            persoon.aanspreking === "HEER"
              ? "HEER"
              : persoon.aanspreking === "MEVROUW"
                ? "MEVROUW"
                : "";

          return [{ aanspreking, naam, functie }];
        },
      )
    : [];

  return (
    <InspectieUitvoerenClient
      inspectieId={inspectie.id}
      onderneming={inspectie.onderneming}
      adres={inspectie.adres}
      inspectiedatum={inspectie.inspectiedatum}
      inspecteur={inspectie.inspecteur}
      flow={inspectie.flow}
      initialOntmoetePersonen={
        initialOntmoetePersonen
      }
      initialOngevalsgegevens={{
        ernstigArbeidsongeval:
          inspectie.ernstigArbeidsongeval,
        slachtofferVoornaam:
          inspectie.slachtofferVoornaam ?? "",
        slachtofferNaam:
          inspectie.slachtofferNaam ?? "",
        ongevalsdatum:
          inspectie.ongevalsdatum ?? "",
        slachtofferWerkHervat:
          inspectie.slachtofferWerkHervat,
        werkhervattingsdatum:
          inspectie.werkhervattingsdatum ?? "",
        werkpostBezocht:
          inspectie.werkpostBezocht,
      }}
      wetgevingen={wetgevingen}
      boeken={boeken}
      titels={titels}
      standaardinbreuken={standaardinbreuken}
      initialInbreuken={initialInbreuken}
    />
  );
}
