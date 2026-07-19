-- CreateEnum
CREATE TYPE "InspectieStatus" AS ENUM ('CONCEPT', 'AFGEROND', 'VERWIJDERD');

-- CreateTable
CREATE TABLE "Gebruiker" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "wachtwoordHash" TEXT NOT NULL,
    "aangemaaktOp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gewijzigdOp" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Gebruiker_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Sessie" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "vervaltOp" TIMESTAMP(3) NOT NULL,
    "gebruikerId" TEXT NOT NULL,
    "aangemaaktOp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Sessie_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Inspectie" (
    "id" TEXT NOT NULL,
    "onderneming" TEXT NOT NULL,
    "adres" TEXT NOT NULL,
    "inspectiedatum" TEXT NOT NULL,
    "inspecteur" TEXT NOT NULL,
    "flow" TEXT NOT NULL,
    "status" "InspectieStatus" NOT NULL DEFAULT 'CONCEPT',
    "verwijderdOp" TIMESTAMP(3),
    "gebruikerId" TEXT NOT NULL,
    "aangemaaktOp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gewijzigdOp" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Inspectie_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InspectieInbreuk" (
    "id" TEXT NOT NULL,
    "inspectieId" TEXT NOT NULL,
    "standaardinbreukId" TEXT,
    "volgorde" INTEGER NOT NULL,
    "beschrijving" TEXT NOT NULL,
    "beschrijvingOpmaak" JSONB,
    "inCasu" TEXT NOT NULL,
    "toelichting" TEXT NOT NULL,
    "aanvulling" TEXT NOT NULL,
    "aanvullingOpmaak" JSONB,
    "wettelijkeVerwijzing" TEXT NOT NULL,
    "specifiekeElementen" JSONB,
    "geselecteerdeSpecifiekeElementIds" TEXT[],
    "aangemaaktOp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gewijzigdOp" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InspectieInbreuk_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InspectieFoto" (
    "id" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "inspectieInbreukId" TEXT NOT NULL,
    "aangemaaktOp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InspectieFoto_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Gebruiker_email_key" ON "Gebruiker"("email");
CREATE UNIQUE INDEX "Sessie_tokenHash_key" ON "Sessie"("tokenHash");
CREATE INDEX "Sessie_gebruikerId_idx" ON "Sessie"("gebruikerId");
CREATE INDEX "Sessie_vervaltOp_idx" ON "Sessie"("vervaltOp");
CREATE INDEX "Inspectie_gebruikerId_status_idx" ON "Inspectie"("gebruikerId", "status");
CREATE INDEX "Inspectie_gebruikerId_gewijzigdOp_idx" ON "Inspectie"("gebruikerId", "gewijzigdOp");
CREATE INDEX "InspectieInbreuk_inspectieId_volgorde_idx" ON "InspectieInbreuk"("inspectieId", "volgorde");
CREATE INDEX "InspectieFoto_inspectieInbreukId_idx" ON "InspectieFoto"("inspectieInbreukId");

ALTER TABLE "Sessie" ADD CONSTRAINT "Sessie_gebruikerId_fkey" FOREIGN KEY ("gebruikerId") REFERENCES "Gebruiker"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Inspectie" ADD CONSTRAINT "Inspectie_gebruikerId_fkey" FOREIGN KEY ("gebruikerId") REFERENCES "Gebruiker"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InspectieInbreuk" ADD CONSTRAINT "InspectieInbreuk_inspectieId_fkey" FOREIGN KEY ("inspectieId") REFERENCES "Inspectie"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InspectieFoto" ADD CONSTRAINT "InspectieFoto_inspectieInbreukId_fkey" FOREIGN KEY ("inspectieInbreukId") REFERENCES "InspectieInbreuk"("id") ON DELETE CASCADE ON UPDATE CASCADE;
