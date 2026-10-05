-- Een standaardinbreuk onder de Rookwet heeft uitsluitend een
-- wetgeving en vrij onderwerp. Boek en titel zijn daarom optioneel.
ALTER TABLE "Standaardinbreuk"
  ALTER COLUMN "boekId" DROP NOT NULL,
  ALTER COLUMN "titelId" DROP NOT NULL;

-- Reeds aangemaakte Rookwet-inbreuken worden losgekoppeld van de
-- tijdelijke technische indeling uit de vorige migratie.
UPDATE "Standaardinbreuk"
SET
  "boekId" = NULL,
  "titelId" = NULL
WHERE "wetgevingId" = 'rookwet-2009';

DELETE FROM "Titel"
WHERE "id" = 'rookwet-2009-indeling-algemeen';

DELETE FROM "Boek"
WHERE "id" = 'rookwet-2009-indeling';
