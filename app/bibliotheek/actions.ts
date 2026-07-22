"use server";

import { Prisma } from "@/app/generated/prisma/client";
import { revalidatePath } from "next/cache";

import type {
  Standaardinbreuk,
  TekstSegment,
} from "@/bibliotheek";
import { mapStandaardinbreuk } from "@/lib/bibliotheek-data";
import { prisma } from "@/lib/prisma";
import { vereisGebruiker } from "@/lib/auth";

const BIBLIOTHEEK_PAD = "/bibliotheek";

type GenormaliseerdSpecifiekElement = {
  tekst: string;
  volgorde: number;
};

/**
 * Controleert en trimt een verplicht tekstveld.
 */
function verplichtTekstveld(
  waarde: string | null | undefined,
  veldnaam: string,
): string {
  const tekst = waarde?.trim() ?? "";

  if (!tekst) {
    throw new Error(`${veldnaam} is verplicht.`);
  }

  return tekst;
}

/**
 * Zet een leeg optioneel tekstveld om naar null.
 */
function optioneelTekstveld(
  waarde: string | null | undefined,
): string | null {
  const tekst = waarde?.trim() ?? "";

  return tekst || null;
}

/**
 * Verwijdert lege en dubbele kernwoorden.
 */
function normaliseerKernwoorden(
  kernwoorden: string[] | null | undefined,
): string[] {
  const uniekeKernwoorden = new Map<string, string>();

  for (const invoer of kernwoorden ?? []) {
    const kernwoord = invoer.trim();

    if (!kernwoord) {
      continue;
    }

    const sleutel = kernwoord.toLocaleLowerCase("nl-BE");

    if (!uniekeKernwoorden.has(sleutel)) {
      uniekeKernwoorden.set(sleutel, kernwoord);
    }
  }

  return [...uniekeKernwoorden.values()];
}

/**
 * Maakt de beperkte tekstopmaak geschikt
 * voor opslag als Prisma JSON.
 */
function normaliseerTekstSegmenten(
  segmenten: TekstSegment[] | null | undefined,
): TekstSegment[] {
  const resultaat: TekstSegment[] = [];

  for (const segment of segmenten ?? []) {
    if (
      !segment ||
      typeof segment.tekst !== "string" ||
      segment.tekst.length === 0
    ) {
      continue;
    }

    resultaat.push({
      tekst: segment.tekst,
      ...(segment.vet ? { vet: true } : {}),
      ...(segment.donkergrijs
        ? { donkergrijs: true }
        : {}),
    });
  }

  return resultaat;
}

/**
 * Verwijdert lege specifieke elementen
 * en herberekent hun volgorde.
 *
 * Tijdelijke client-ID's worden niet opgeslagen.
 * Prisma maakt voor ieder element een echte ID aan.
 */
function normaliseerSpecifiekeElementen(
  elementen:
    | Standaardinbreuk["specifiekeElementen"]
    | null
    | undefined,
): GenormaliseerdSpecifiekElement[] {
  return [...(elementen ?? [])]
    .map((element) => ({
      tekst: element.tekst.trim(),
      volgorde:
        typeof element.volgorde === "number"
          ? element.volgorde
          : 0,
    }))
    .filter(
      (element) => element.tekst.length > 0,
    )
    .sort(
      (eerste, tweede) =>
        eerste.volgorde - tweede.volgorde,
    )
    .map((element, index) => ({
      tekst: element.tekst,
      volgorde: index,
    }));
}

/**
 * Controleert of Titel, Boek en Wetgeving
 * werkelijk bij elkaar horen.
 */
async function controleerJuridischeIndeling({
  wetgevingId,
  boekId,
  titelId,
}: {
  wetgevingId: string;
  boekId: string;
  titelId: string;
}): Promise<void> {
  const titel = await prisma.titel.findUnique({
    where: {
      id: titelId,
    },
    select: {
      boekId: true,
      boek: {
        select: {
          wetgevingId: true,
        },
      },
    },
  });

  if (!titel) {
    throw new Error(
      "De geselecteerde titel bestaat niet meer.",
    );
  }

  if (titel.boekId !== boekId) {
    throw new Error(
      "De geselecteerde titel behoort niet tot het geselecteerde boek.",
    );
  }

  if (titel.boek.wetgevingId !== wetgevingId) {
    throw new Error(
      "Het geselecteerde boek behoort niet tot de geselecteerde wetgeving.",
    );
  }
}

/**
 * Maakt een nieuwe standaardinbreuk aan
 * of werkt een bestaande standaardinbreuk bij.
 */
export async function bewaarStandaardinbreuk(
  invoer: Standaardinbreuk,
): Promise<Standaardinbreuk> {
  await vereisGebruiker();

  const id = invoer.id?.trim() ?? "";

  const wetgevingId = verplichtTekstveld(
    invoer.wetgevingId,
    "Wetgeving",
  );

  const boekId = verplichtTekstveld(
    invoer.boekId,
    "Boek",
  );

  const titelId = verplichtTekstveld(
    invoer.titelId,
    "Titel",
  );

  const onderwerp = verplichtTekstveld(
    invoer.onderwerp,
    "Onderwerp",
  );

  const omschrijving = verplichtTekstveld(
    invoer.omschrijving,
    "Omschrijving",
  );

  const wettelijkeVerwijzing =
    verplichtTekstveld(
      invoer.wettelijkeVerwijzing,
      "Wettelijke verwijzing",
    );

  const kernwoorden = normaliseerKernwoorden(
    invoer.kernwoorden,
  );

  const omschrijvingOpmaak =
    normaliseerTekstSegmenten(
      invoer.omschrijvingOpmaak,
    );

  const aanvullingOpmaak =
    normaliseerTekstSegmenten(
      invoer.aanvullingOpmaak,
    );

  const specifiekeElementenIngeschakeld =
    Boolean(
      invoer.specifiekeElementenIngeschakeld,
    );

  const specifiekeElementenAlsSituering =
    specifiekeElementenIngeschakeld &&
    Boolean(
      invoer.specifiekeElementenAlsSituering,
    );

  const geverifieerd = Boolean(
    invoer.geverifieerd,
  );

  const specifiekeElementen =
    specifiekeElementenIngeschakeld
      ? normaliseerSpecifiekeElementen(
          invoer.specifiekeElementen,
        )
      : [];

  if (
    specifiekeElementenIngeschakeld &&
    specifiekeElementen.length === 0
  ) {
    throw new Error(
      "Voeg minstens één ingevuld specifiek element toe of schakel specifieke elementen uit.",
    );
  }

  await controleerJuridischeIndeling({
    wetgevingId,
    boekId,
    titelId,
  });

  const opgeslagenInbreuk =
    await prisma.$transaction(
      async (transactie) => {
        if (id) {
          const bestaandeInbreuk =
            await transactie.standaardinbreuk.findUnique({
              where: {
                id,
              },
              select: {
                id: true,
              },
            });

          if (!bestaandeInbreuk) {
            throw new Error(
              "De standaardinbreuk bestaat niet meer.",
            );
          }

          /*
           * De gekoppelde specifieke elementen
           * worden volledig vervangen.
           */
          await transactie.specifiekElement.deleteMany({
            where: {
              standaardinbreukId: id,
            },
          });

          await transactie.standaardinbreuk.update({
            where: {
              id,
            },
            data: {
              geverifieerd,
              wetgevingId,
              boekId,
              titelId,
              onderwerp,
              kernwoorden,

              omschrijving,
              omschrijvingOpmaak:
                omschrijvingOpmaak as Prisma.InputJsonValue,

              situering: optioneelTekstveld(
                invoer.situering,
              ),

              specifiekeElementenIngeschakeld,
              specifiekeElementenAlsSituering,

              toelichting: optioneelTekstveld(
                invoer.toelichting,
              ),

              aanvulling: optioneelTekstveld(
                invoer.aanvulling,
              ),

              aanvullingOpmaak:
                aanvullingOpmaak as Prisma.InputJsonValue,

              wettelijkeVerwijzing,
            },
          });

          if (specifiekeElementen.length > 0) {
            await transactie.specifiekElement.createMany({
              data: specifiekeElementen.map(
                (element) => ({
                  standaardinbreukId: id,
                  tekst: element.tekst,
                  volgorde: element.volgorde,
                }),
              ),
            });
          }

          return transactie.standaardinbreuk.findUniqueOrThrow({
            where: {
              id,
            },
            include: {
              specifiekeElementen: {
                orderBy: {
                  volgorde: "asc",
                },
              },
            },
          });
        }

        return transactie.standaardinbreuk.create({
          data: {
            geverifieerd,
            wetgevingId,
            boekId,
            titelId,
            onderwerp,
            kernwoorden,

            omschrijving,
            omschrijvingOpmaak:
              omschrijvingOpmaak as Prisma.InputJsonValue,

            situering: optioneelTekstveld(
              invoer.situering,
            ),

            specifiekeElementenIngeschakeld,
            specifiekeElementenAlsSituering,

            specifiekeElementen:
              specifiekeElementen.length > 0
                ? {
                    create:
                      specifiekeElementen.map(
                        (element) => ({
                          tekst: element.tekst,
                          volgorde:
                            element.volgorde,
                        }),
                      ),
                  }
                : undefined,

            toelichting: optioneelTekstveld(
              invoer.toelichting,
            ),

            aanvulling: optioneelTekstveld(
              invoer.aanvulling,
            ),

            aanvullingOpmaak:
              aanvullingOpmaak as Prisma.InputJsonValue,

            wettelijkeVerwijzing,
          },
          include: {
            specifiekeElementen: {
              orderBy: {
                volgorde: "asc",
              },
            },
          },
        });
      },
    );

  revalidatePath(BIBLIOTHEEK_PAD);

  return mapStandaardinbreuk(
    opgeslagenInbreuk,
  );
}

/**
 * Verwijdert een standaardinbreuk.
 *
 * Door onDelete: Cascade in schema.prisma
 * worden gekoppelde specifieke elementen
 * automatisch verwijderd.
 */
export async function verwijderStandaardinbreuk(
  inbreukId: string,
): Promise<void> {
  await vereisGebruiker();

  const id = verplichtTekstveld(
    inbreukId,
    "Standaardinbreuk",
  );

  const bestaandeInbreuk =
    await prisma.standaardinbreuk.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

  if (!bestaandeInbreuk) {
    throw new Error(
      "De standaardinbreuk bestaat niet meer.",
    );
  }

  await prisma.standaardinbreuk.delete({
    where: {
      id,
    },
  });

  revalidatePath(BIBLIOTHEEK_PAD);
}
