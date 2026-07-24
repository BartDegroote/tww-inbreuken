ALTER TABLE "Inspectie"
ADD COLUMN "werkhervattingsdatum" TEXT;

ALTER TABLE "Standaardinbreuk"
ADD COLUMN "inbreukType" TEXT NOT NULL DEFAULT 'STANDAARD',
ADD COLUMN "inspecteurInfoIngeschakeld" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Standaardinbreuk"
SET "inspecteurInfoIngeschakeld" = true
WHERE NULLIF(BTRIM("inspecteurInfo"), '') IS NOT NULL;

ALTER TABLE "InspectieInbreuk"
ADD COLUMN "inbreukType" TEXT NOT NULL DEFAULT 'STANDAARD',
ADD COLUMN "afwijkendeGebeurtenisCode" TEXT,
ADD COLUMN "betrokkenVoorwerpCode" TEXT,
ADD COLUMN "soortLetselCode" TEXT;
