import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { boeken } from "../bibliotheek/boeken";
import { titels } from "../bibliotheek/titels";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL ontbreekt. Controleer het .env-bestand.",
  );
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const wetgeving = await prisma.wetgeving.upsert({
    where: {
      id: "codex-welzijn",
    },
    update: {
      naam: "Codex over het welzijn op het werk",
    },
    create: {
      id: "codex-welzijn",
      naam: "Codex over het welzijn op het werk",
    },
  });

  for (const boek of boeken) {
    await prisma.boek.upsert({
      where: {
        id: boek.id,
      },
      update: {
        naam: boek.naam,
        wetgevingId: wetgeving.id,
      },
      create: {
        id: boek.id,
        naam: boek.naam,
        wetgevingId: wetgeving.id,
      },
    });
  }

  for (const titel of titels) {
    await prisma.titel.upsert({
      where: { id: titel.id },
      update: {
        naam: titel.naam,
        boekId: titel.boekId,
      },
      create: titel,
    });
  }

  const basiseisenTitel = await prisma.titel.findUniqueOrThrow({
    where: { id: "boek-iii-titel-1" },
  });

  await prisma.standaardinbreuk.upsert({
    where: {
      id: "codex-boek-iii-titel-1-001",
    },

    update: {
      wetgevingId: wetgeving.id,
      boekId: "boek-iii",
      titelId: basiseisenTitel.id,

      onderwerp:
        "Basiseisen betreffende arbeidsplaatsen",

      kernwoorden: [
        "arbeidsplaats",
        "veiligheid",
        "gezondheid",
      ],

      omschrijving:
        "De arbeidsplaats voldeed niet aan de toepasselijke basiseisen inzake veiligheid en gezondheid.",

      omschrijvingOpmaak: [],

      situering: null,

      toelichting:
        "Controleer steeds of de concrete situatie onder een meer specifieke bepaling valt.",

      aanvulling: null,

      aanvullingOpmaak: [],

      wettelijkeVerwijzing:
        "Dit is een overtreding op de bepalingen van Boek III, Titel 1 van de codex over het welzijn op het werk.",
    },

    create: {
      id: "codex-boek-iii-titel-1-001",

      wetgevingId: wetgeving.id,
      boekId: "boek-iii",
      titelId: basiseisenTitel.id,

      onderwerp:
        "Basiseisen betreffende arbeidsplaatsen",

      kernwoorden: [
        "arbeidsplaats",
        "veiligheid",
        "gezondheid",
      ],

      omschrijving:
        "De arbeidsplaats voldeed niet aan de toepasselijke basiseisen inzake veiligheid en gezondheid.",

      omschrijvingOpmaak: [],

      situering: null,

      toelichting:
        "Controleer steeds of de concrete situatie onder een meer specifieke bepaling valt.",

      aanvulling: null,

      aanvullingOpmaak: [],

      wettelijkeVerwijzing:
        "Dit is een overtreding op de bepalingen van Boek III, Titel 1 van de codex over het welzijn op het werk.",
    },
  });

  console.log(
    "De Supabase-database is succesvol gevuld.",
  );
}

main()
  .catch((fout: unknown) => {
    console.error(
      "Het vullen van de database is mislukt.",
    );
    console.error(fout);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
