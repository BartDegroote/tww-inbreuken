-- De Welzijnswet gebruikt voortaan zichtbaar alleen:
-- wetgeving -> hoofdstuk -> onderwerp.
-- Prisma vereist intern nog een titel, daarom krijgt elk hoofdstuk een
-- verborgen technische titel. Bestaande onderwerpen blijven behouden.
BEGIN;

INSERT INTO "Titel" ("id", "boekId", "naam")
SELECT
  "id" || '-algemeen',
  "id",
  'Rechtstreeks onder het hoofdstuk'
FROM "Boek"
WHERE "wetgevingId" = 'welzijnswet-1996'
ON CONFLICT ("id") DO UPDATE
SET
  "boekId" = EXCLUDED."boekId",
  "naam" = EXCLUDED."naam";

UPDATE "Standaardinbreuk"
SET
  "titelId" = "boekId" || '-algemeen',
  "gewijzigdOp" = NOW()
WHERE
  "wetgevingId" = 'welzijnswet-1996'
  AND "boekId" IS NOT NULL
  AND "titelId" IS DISTINCT FROM "boekId" || '-algemeen';

COMMIT;
