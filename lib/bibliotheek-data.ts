import "server-only";

import { Prisma } from "@/app/generated/prisma/client";
import type { Standaardinbreuk } from "@/bibliotheek";
import { vergelijkBoekIds } from "@/bibliotheek/boeken";
import { leesTekstSegmenten } from "@/bibliotheek/tekstsegmenten";
import { vergelijkTitelIds } from "@/bibliotheek/titels";
import { prisma } from "@/lib/prisma";

const standaardinbreukSelect = {
  id: true,
  geverifieerd: true,
  wetgevingId: true,
  boekId: true,
  titelId: true,
  onderwerp: true,
  kernwoorden: true,
  omschrijving: true,
  omschrijvingOpmaak: true,
  situering: true,
  specifiekeElementenIngeschakeld: true,
  specifiekeElementenAlsSituering: true,
  specifiekeElementen: {
    select: {
      id: true,
      tekst: true,
      volgorde: true,
    },
    orderBy: {
      volgorde: "asc",
    },
  },
  toelichting: true,
  inspecteurInfo: true,
  aanvulling: true,
  aanvullingOpmaak: true,
  wettelijkeVerwijzing: true,
} satisfies Prisma.StandaardinbreukSelect;

type StandaardinbreukUitDatabase =
  Prisma.StandaardinbreukGetPayload<{
    select: typeof standaardinbreukSelect;
  }>;

export function mapStandaardinbreuk(
  inbreuk: StandaardinbreukUitDatabase,
): Standaardinbreuk {
  return {
    id: inbreuk.id,
    geverifieerd: inbreuk.geverifieerd,
    wetgevingId: inbreuk.wetgevingId,
    boekId: inbreuk.boekId,
    titelId: inbreuk.titelId,
    onderwerp: inbreuk.onderwerp,
    kernwoorden: inbreuk.kernwoorden,
    omschrijving: inbreuk.omschrijving,
    omschrijvingOpmaak: leesTekstSegmenten(
      inbreuk.omschrijvingOpmaak,
    ),
    situering: inbreuk.situering ?? "",
    specifiekeElementenIngeschakeld:
      inbreuk.specifiekeElementenIngeschakeld,
    specifiekeElementenAlsSituering:
      inbreuk.specifiekeElementenAlsSituering,
    specifiekeElementen:
      inbreuk.specifiekeElementen.map(
        (element) => ({
          id: element.id,
          tekst: element.tekst,
          volgorde: element.volgorde,
        }),
      ),
    toelichting: inbreuk.toelichting ?? "",
    inspecteurInfo:
      inbreuk.inspecteurInfo ?? "",
    aanvulling: inbreuk.aanvulling ?? "",
    aanvullingOpmaak: leesTekstSegmenten(
      inbreuk.aanvullingOpmaak,
    ),
    wettelijkeVerwijzing:
      inbreuk.wettelijkeVerwijzing,
  };
}

export async function haalBibliotheekGegevensOp() {
  const [wetgevingen, boeken, titels, inbreuken] =
    await Promise.all([
      prisma.wetgeving.findMany({
        select: {
          id: true,
          naam: true,
        },
        orderBy: {
          naam: "asc",
        },
      }),
      prisma.boek.findMany({
        select: {
          id: true,
          naam: true,
          wetgevingId: true,
        },
        orderBy: {
          naam: "asc",
        },
      }),
      prisma.titel.findMany({
        select: {
          id: true,
          naam: true,
          boekId: true,
        },
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
        select: standaardinbreukSelect,
        orderBy: {
          gewijzigdOp: "desc",
        },
      }),
    ]);

  return {
    wetgevingen,
    boeken: boeken.sort((eerste, tweede) =>
      vergelijkBoekIds(eerste.id, tweede.id),
    ),
    titels: titels.sort(vergelijkTitelIds),
    inbreuken: inbreuken.map(
      mapStandaardinbreuk,
    ),
  };
}
