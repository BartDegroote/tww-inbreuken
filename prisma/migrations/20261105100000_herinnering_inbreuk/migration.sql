ALTER TABLE "Inspectie"
ADD COLUMN "vorigeBriefDatum" TEXT;

ALTER TABLE "InspectieInbreuk"
ADD COLUMN "herinnering" BOOLEAN NOT NULL DEFAULT false;
