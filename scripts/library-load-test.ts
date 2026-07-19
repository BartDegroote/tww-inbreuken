import "dotenv/config";

import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../app/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL ontbreekt.");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});
const suffix = randomUUID();
const wetgevingId = `[LOADTEST]-wet-${suffix}`;
const boekId = `[LOADTEST]-boek-${suffix}`;
const titelId = `[LOADTEST]-titel-${suffix}`;

function tijd(begin: number) {
  return Math.round((performance.now() - begin) * 10) / 10;
}

try {
  await prisma.wetgeving.create({ data: { id: wetgevingId, naam: "[LOADTEST]" } });
  await prisma.boek.create({ data: { id: boekId, naam: "[LOADTEST]", wetgevingId } });
  await prisma.titel.create({ data: { id: titelId, naam: "[LOADTEST]", boekId } });

  const beginAanmaken = performance.now();
  await prisma.standaardinbreuk.createMany({
    data: Array.from({ length: 500 }, (_, index) => ({
      wetgevingId,
      boekId,
      titelId,
      onderwerp: `Synthetisch onderwerp ${index + 1}`,
      omschrijving: `Synthetische standaardinbreuk ${index + 1} zonder persoonsgegevens.`,
      situering: "Synthetische situering.",
      toelichting: "Synthetische toelichting.",
      aanvulling: "Synthetische aanvulling.",
      wettelijkeVerwijzing: "Synthetische verwijzing.",
      kernwoorden: ["loadtest", `nummer-${index + 1}`],
    })),
  });
  const aanmakenMs = tijd(beginAanmaken);

  const beginLezen = performance.now();
  const resultaten = await prisma.standaardinbreuk.findMany({
    where: { titelId },
    include: { specifiekeElementen: true },
    orderBy: { gewijzigdOp: "desc" },
  });
  const lezenMs = tijd(beginLezen);
  const payloadMb =
    Math.round((Buffer.byteLength(JSON.stringify(resultaten)) / 1_000_000) * 100) / 100;

  console.table([{ records: resultaten.length, aanmakenMs, lezenMs, payloadMb }]);
} finally {
  await prisma.standaardinbreuk.deleteMany({ where: { titelId } });
  await prisma.titel.deleteMany({ where: { id: titelId } });
  await prisma.boek.deleteMany({ where: { id: boekId } });
  await prisma.wetgeving.deleteMany({ where: { id: wetgevingId } });
  await prisma.$disconnect();
}

console.log("Alle 500 synthetische bibliotheekrecords zijn verwijderd.");
