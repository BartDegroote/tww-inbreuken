INSERT INTO "Wetgeving" ("id", "naam")
VALUES ('kb-beveiliging-liften', 'KB beveiliging liften')
ON CONFLICT ("id") DO UPDATE SET "naam" = EXCLUDED."naam";

INSERT INTO "Boek" ("id", "wetgevingId", "naam") VALUES
  ('kb-liften-hoofdstuk-i', 'kb-beveiliging-liften', 'I - Definities'),
  ('kb-liften-hoofdstuk-ii', 'kb-beveiliging-liften', 'II - Toepassingsgebied'),
  ('kb-liften-hoofdstuk-iii', 'kb-beveiliging-liften', 'III - Algemene veiligheidsvoorwaarden'),
  ('kb-liften-hoofdstuk-iv', 'kb-beveiliging-liften', 'IV - Modernisatieprogramma'),
  ('kb-liften-hoofdstuk-v', 'kb-beveiliging-liften', 'V - Uitbating'),
  ('kb-liften-hoofdstuk-vi', 'kb-beveiliging-liften', 'VI - Waarschuwingen en opschriften'),
  ('kb-liften-hoofdstuk-vii', 'kb-beveiliging-liften', 'VII - Toezicht'),
  ('kb-liften-hoofdstuk-viii', 'kb-beveiliging-liften', 'VIII - Overgangsmaatregelen'),
  ('kb-liften-hoofdstuk-ix', 'kb-beveiliging-liften', 'IX - Opheffings- en eindbepalingen')
ON CONFLICT ("id") DO UPDATE SET
  "wetgevingId" = EXCLUDED."wetgevingId",
  "naam" = EXCLUDED."naam";

INSERT INTO "Titel" ("id", "boekId", "naam") VALUES
  ('kb-liften-hoofdstuk-i-algemeen', 'kb-liften-hoofdstuk-i', 'Rechtstreeks onder het hoofdstuk'),
  ('kb-liften-hoofdstuk-ii-algemeen', 'kb-liften-hoofdstuk-ii', 'Rechtstreeks onder het hoofdstuk'),
  ('kb-liften-hoofdstuk-iii-algemeen', 'kb-liften-hoofdstuk-iii', 'Rechtstreeks onder het hoofdstuk'),
  ('kb-liften-hoofdstuk-iv-algemeen', 'kb-liften-hoofdstuk-iv', 'Rechtstreeks onder het hoofdstuk'),
  ('kb-liften-hoofdstuk-v-algemeen', 'kb-liften-hoofdstuk-v', 'Rechtstreeks onder het hoofdstuk'),
  ('kb-liften-hoofdstuk-vi-algemeen', 'kb-liften-hoofdstuk-vi', 'Rechtstreeks onder het hoofdstuk'),
  ('kb-liften-hoofdstuk-vii-algemeen', 'kb-liften-hoofdstuk-vii', 'Rechtstreeks onder het hoofdstuk'),
  ('kb-liften-hoofdstuk-viii-algemeen', 'kb-liften-hoofdstuk-viii', 'Rechtstreeks onder het hoofdstuk'),
  ('kb-liften-hoofdstuk-ix-algemeen', 'kb-liften-hoofdstuk-ix', 'Rechtstreeks onder het hoofdstuk')
ON CONFLICT ("id") DO UPDATE SET
  "boekId" = EXCLUDED."boekId",
  "naam" = EXCLUDED."naam";
