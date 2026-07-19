import "server-only";

import { prisma } from "@/lib/prisma";

export async function ruimVervallenPrullenmandOp(gebruikerId: string) {
  await prisma.$executeRaw`
    DELETE FROM "Inspectie"
    WHERE "gebruikerId" = ${gebruikerId}
      AND "status" = 'VERWIJDERD'::"InspectieStatus"
      AND "verwijderdOp" < NOW() - INTERVAL '30 days'
  `;
}
