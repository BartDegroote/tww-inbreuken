INSERT INTO "Wetgeving" ("id", "naam")
VALUES ('rookwet-2009', 'Rookwet van 22 december 2009')
ON CONFLICT ("id") DO UPDATE SET "naam" = EXCLUDED."naam";

-- Het bestaande datamodel vereist een boek en titel. Deze technische
-- niveaus blijven voor de gebruiker verborgen: alleen Onderwerp is zichtbaar.
INSERT INTO "Boek" ("id", "wetgevingId", "naam")
VALUES ('rookwet-2009-indeling', 'rookwet-2009', 'Rookwet van 22 december 2009')
ON CONFLICT ("id") DO UPDATE SET
  "wetgevingId" = EXCLUDED."wetgevingId",
  "naam" = EXCLUDED."naam";

INSERT INTO "Titel" ("id", "boekId", "naam")
VALUES ('rookwet-2009-indeling-algemeen', 'rookwet-2009-indeling', 'Rechtstreeks onder de Rookwet')
ON CONFLICT ("id") DO UPDATE SET
  "boekId" = EXCLUDED."boekId",
  "naam" = EXCLUDED."naam";
