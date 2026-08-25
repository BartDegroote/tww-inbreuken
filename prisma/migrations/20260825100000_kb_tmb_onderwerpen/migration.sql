INSERT INTO "Wetgeving" ("id", "naam")
VALUES ('kb-tmb', 'KB TMB')
ON CONFLICT ("id") DO UPDATE SET "naam" = EXCLUDED."naam";

-- Het bestaande datamodel vereist een boek en titel. Voor het KB
-- TMB zijn deze niveaus uitsluitend technisch; de app toont enkel
-- Wetgeving en het vrij ingevulde Onderwerp.
INSERT INTO "Boek" ("id", "wetgevingId", "naam")
VALUES ('kb-tmb-indeling', 'kb-tmb', 'KB TMB')
ON CONFLICT ("id") DO UPDATE SET
  "wetgevingId" = EXCLUDED."wetgevingId",
  "naam" = EXCLUDED."naam";

INSERT INTO "Titel" ("id", "boekId", "naam")
VALUES ('kb-tmb-indeling-algemeen', 'kb-tmb-indeling', 'Rechtstreeks onder KB TMB')
ON CONFLICT ("id") DO UPDATE SET
  "boekId" = EXCLUDED."boekId",
  "naam" = EXCLUDED."naam";
