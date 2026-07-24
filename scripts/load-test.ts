import "dotenv/config";

import { randomBytes, randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";

import { PrismaPg } from "@prisma/adapter-pg";
import { Packer } from "docx";

import { PrismaClient } from "../app/generated/prisma/client";
import {
  maakWordDocument,
  type WordInbreuk,
  type WordInspectie,
} from "../lib/word-export";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL ontbreekt.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

type Scenario = {
  inbreuken: number;
  fotosPerInbreuk: number;
  fotoBytes: number;
};

const scenarios: Scenario[] = [
  { inbreuken: 18, fotosPerInbreuk: 0, fotoBytes: 0 },
  { inbreuken: 18, fotosPerInbreuk: 2, fotoBytes: 250_000 },
  { inbreuken: 50, fotosPerInbreuk: 1, fotoBytes: 250_000 },
  { inbreuken: 100, fotosPerInbreuk: 0, fotoBytes: 0 },
];

function ms(begin: number) {
  return Math.round((performance.now() - begin) * 10) / 10;
}

function tekst(index: number) {
  return `Synthetische belastingstest ${index}: een representatieve omschrijving van de vastgestelde inbreuk zonder persoonsgegevens.`;
}

function maakWordInbreuken(scenario: Scenario): WordInbreuk[] {
  const pngKop = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  );

  return Array.from({ length: scenario.inbreuken }, (_, index) => ({
    inbreukType: "STANDAARD",
    beschrijving: tekst(index + 1),
    inCasu: "Het betreft een synthetische vaststelling voor prestatietesten.",
    specifiekeElementen: ["Testelement één", "Testelement twee"],
    toelichting: "Synthetische toelichting.",
    aanvulling: "Deze gegevens hebben geen betrekking op een echte persoon of onderneming.",
    wettelijkeVerwijzing: "Synthetische wettelijke verwijzing.",
    fotos: Array.from({ length: scenario.fotosPerInbreuk }, (_, fotoIndex) => ({
      naam: `test-${index}-${fotoIndex}.png`,
      data: new Uint8Array(
        Buffer.concat([
          pngKop,
          randomBytes(Math.max(0, scenario.fotoBytes - pngKop.length)),
        ]),
      ),
      breedte: 1200,
      hoogte: 900,
    })),
  }));
}

async function wordTest(scenario: Scenario) {
  const inspectie: WordInspectie = {
    onderneming: "SYNTHETISCHE BELASTINGSTEST",
    adres: "Geen echt adres",
    inspectiedatum: "2026-07-19",
    inspecteur: "Load test",
    flow: `LOAD/${scenario.inbreuken}`,
    inbreuken: maakWordInbreuken(scenario),
  };
  const geheugenVoor = process.memoryUsage().heapUsed;
  const begin = performance.now();
  const buffer = await Packer.toBuffer(maakWordDocument(inspectie));

  return {
    wordMs: ms(begin),
    docxMb: Math.round((buffer.byteLength / 1_000_000) * 100) / 100,
    heapDeltaMb:
      Math.round(((process.memoryUsage().heapUsed - geheugenVoor) / 1_000_000) * 100) /
      100,
  };
}

async function databaseTest(gebruikerId: string, scenario: Scenario) {
  const inspectie = await prisma.inspectie.create({
    data: {
      onderneming: `[LOADTEST] ${scenario.inbreuken}`,
      adres: "Synthetisch",
      inspectiedatum: "2026-07-19",
      inspecteur: "Load test",
      flow: `LOAD/${randomUUID()}`,
      gebruikerId,
    },
  });

  try {
    const ids = Array.from({ length: scenario.inbreuken }, () => randomUUID());
    const beginOpslaan = performance.now();

    await prisma.$transaction(async (tx) => {
      for (const [volgorde, id] of ids.entries()) {
        await tx.inspectieInbreuk.create({
          data: {
            id,
            inspectieId: inspectie.id,
            volgorde,
            beschrijving: tekst(volgorde + 1),
            beschrijvingOpmaak: [],
            inCasu: "Synthetische vaststelling.",
            toelichting: "Synthetische toelichting.",
            aanvulling: "Geen persoonsgegevens.",
            aanvullingOpmaak: [],
            wettelijkeVerwijzing: "Synthetisch.",
            specifiekeElementen: [],
            geselecteerdeSpecifiekeElementIds: [],
          },
        });
      }
    }, { timeout: 60_000 });
    const opslaanMs = ms(beginOpslaan);

    const fotoData = scenario.fotoBytes ? randomBytes(scenario.fotoBytes) : null;
    const fotoTaken: Promise<unknown>[] = [];
    const beginFotos = performance.now();

    if (fotoData) {
      for (const id of ids) {
        for (let index = 0; index < scenario.fotosPerInbreuk; index += 1) {
          fotoTaken.push(
            prisma.inspectieFoto.create({
              data: {
                naam: `synthetisch-${index}.jpg`,
                mimeType: "image/jpeg",
                data: fotoData,
                inspectieInbreukId: id,
              },
            }),
          );

          if (fotoTaken.length >= 8) {
            await Promise.all(fotoTaken.splice(0));
          }
        }
      }
      await Promise.all(fotoTaken);
    }
    const fotosMs = ms(beginFotos);

    const beginLezen = performance.now();
    await prisma.inspectie.findUniqueOrThrow({
      where: { id: inspectie.id },
      include: {
        inbreuken: {
          orderBy: { volgorde: "asc" },
          include: { fotos: { select: { id: true, naam: true } } },
        },
      },
    });

    return { opslaanMs, fotosMs, lezenMs: ms(beginLezen) };
  } finally {
    await prisma.inspectie.delete({ where: { id: inspectie.id } });
  }
}

async function main() {
  const testGebruiker = await prisma.gebruiker.create({
    data: {
      gebruikersnaam: `[LOADTEST]-${randomUUID()}`,
      naam: "Synthetische load test",
      wachtwoordHash: "niet-bruikbaar-testaccount",
    },
  });

  const resultaten = [];

  try {
    for (const scenario of scenarios) {
      const database = await databaseTest(testGebruiker.id, scenario);
      const word = await wordTest(scenario);
      resultaten.push({
        scenario: `${scenario.inbreuken} inbreuken / ${scenario.fotosPerInbreuk} foto('s) per inbreuk`,
        ...database,
        ...word,
      });
    }
  } finally {
    await prisma.gebruiker.delete({ where: { id: testGebruiker.id } });
    await prisma.$disconnect();
  }

  console.table(resultaten);
  console.log("Alle synthetische testgegevens zijn verwijderd.");
}

await main();
