import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

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

  const boeken = [
    { id: "boek-i", naam: "Boek I" },
    { id: "boek-ii", naam: "Boek II" },
    { id: "boek-iii", naam: "Boek III" },
    { id: "boek-iv", naam: "Boek IV" },
    { id: "boek-v", naam: "Boek V" },
    { id: "boek-vi", naam: "Boek VI" },
    { id: "boek-vii", naam: "Boek VII" },
    { id: "boek-viii", naam: "Boek VIII" },
    { id: "boek-ix", naam: "Boek IX" },
    { id: "boek-x", naam: "Boek X" },
  ];

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

  const titel = await prisma.titel.upsert({
    where: {
      id: "boek-iii-titel-1",
    },
    update: {
      naam: "Titel 1",
      boekId: "boek-iii",
    },
    create: {
      id: "boek-iii-titel-1",
      naam: "Titel 1",
      boekId: "boek-iii",
    },
  });

  await prisma.standaardinbreuk.upsert({
    where: {
      id: "codex-boek-iii-titel-1-001",
    },

    update: {
      wetgevingId: wetgeving.id,
      boekId: "boek-iii",
      titelId: titel.id,

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
      titelId: titel.id,

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
