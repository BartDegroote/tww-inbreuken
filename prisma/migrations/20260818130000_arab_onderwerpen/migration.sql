INSERT INTO "Wetgeving" ("id", "naam")
VALUES ('arab', 'ARAB')
ON CONFLICT ("id") DO UPDATE SET "naam" = EXCLUDED."naam";

-- Het bestaande datamodel vereist een boek en titel. Voor ARAB zijn
-- deze niveaus uitsluitend technisch; de app toont enkel Wetgeving
-- en het vrij ingevulde Onderwerp.
INSERT INTO "Boek" ("id", "wetgevingId", "naam")
VALUES ('arab-indeling', 'arab', 'ARAB')
ON CONFLICT ("id") DO UPDATE SET
  "wetgevingId" = EXCLUDED."wetgevingId",
  "naam" = EXCLUDED."naam";

INSERT INTO "Titel" ("id", "boekId", "naam")
VALUES ('arab-indeling-algemeen', 'arab-indeling', 'Rechtstreeks onder ARAB')
ON CONFLICT ("id") DO UPDATE SET
  "boekId" = EXCLUDED."boekId",
  "naam" = EXCLUDED."naam";
