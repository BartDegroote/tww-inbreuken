-- Onderwerp wordt een vrij tekstveld per standaardinbreuk.
-- De bestaande onderwerpen op Titel worden eerst behouden.

ALTER TABLE "Standaardinbreuk"
ADD COLUMN "onderwerp" TEXT,
ADD COLUMN "specifiekeElementenIngeschakeld" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Standaardinbreuk" AS inbreuk
SET "onderwerp" = titel."onderwerp"
FROM "Titel" AS titel
WHERE titel."id" = inbreuk."titelId";

UPDATE "Standaardinbreuk"
SET "onderwerp" = 'Algemeen'
WHERE
  "onderwerp" IS NULL
  OR BTRIM("onderwerp") = '';

ALTER TABLE "Standaardinbreuk"
ALTER COLUMN "onderwerp" SET NOT NULL;

ALTER TABLE "Titel"
DROP COLUMN "onderwerp";

CREATE TABLE "SpecifiekElement" (
  "id" TEXT NOT NULL,
  "tekst" TEXT NOT NULL,
  "volgorde" INTEGER NOT NULL DEFAULT 0,
  "standaardinbreukId" TEXT NOT NULL,
  "aangemaaktOp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "gewijzigdOp" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SpecifiekElement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Standaardinbreuk_titelId_onderwerp_idx"
ON "Standaardinbreuk"("titelId", "onderwerp");

CREATE INDEX "SpecifiekElement_standaardinbreukId_idx"
ON "SpecifiekElement"("standaardinbreukId");

CREATE INDEX "SpecifiekElement_standaardinbreukId_volgorde_idx"
ON "SpecifiekElement"("standaardinbreukId", "volgorde");

ALTER TABLE "SpecifiekElement"
ADD CONSTRAINT "SpecifiekElement_standaardinbreukId_fkey"
FOREIGN KEY ("standaardinbreukId")
REFERENCES "Standaardinbreuk"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
