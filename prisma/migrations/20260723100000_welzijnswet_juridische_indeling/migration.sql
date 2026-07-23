INSERT INTO "Wetgeving" ("id", "naam")
VALUES ('welzijnswet-1996', 'Welzijnswet van 4 augustus 1996')
ON CONFLICT ("id") DO UPDATE SET "naam" = EXCLUDED."naam";

INSERT INTO "Boek" ("id", "wetgevingId", "naam") VALUES
  ('welzijnswet-hoofdstuk-i', 'welzijnswet-1996', 'I - Toepassingsgebied en definities'),
  ('welzijnswet-hoofdstuk-ii', 'welzijnswet-1996', 'II - Algemene beginselen'),
  ('welzijnswet-hoofdstuk-iii', 'welzijnswet-1996', 'III - Tewerkstelling op eenzelfde, aanpalende of naburige arbeidsplaats'),
  ('welzijnswet-hoofdstuk-iv', 'welzijnswet-1996', 'IV - Ondernemingen van buitenaf en uitzendkrachten'),
  ('welzijnswet-hoofdstuk-v', 'welzijnswet-1996', 'V - Tijdelijke of mobiele bouwplaatsen'),
  ('welzijnswet-hoofdstuk-vbis', 'welzijnswet-1996', 'Vbis - Preventie van psychosociale risico’s op het werk'),
  ('welzijnswet-hoofdstuk-vi', 'welzijnswet-1996', 'VI - Preventie- en beschermingsdiensten'),
  ('welzijnswet-hoofdstuk-vii', 'welzijnswet-1996', 'VII - Hoge Raad voor Preventie en Bescherming op het werk'),
  ('welzijnswet-hoofdstuk-viii', 'welzijnswet-1996', 'VIII - Comité voor Preventie en Bescherming op het werk'),
  ('welzijnswet-hoofdstuk-ix', 'welzijnswet-1996', 'IX - Gemeenschappelijke bepalingen voor de organen'),
  ('welzijnswet-hoofdstuk-x', 'welzijnswet-1996', 'X - Beroep bij de arbeidsrechtbanken'),
  ('welzijnswet-hoofdstuk-xi', 'welzijnswet-1996', 'XI - Toezicht en strafbepalingen'),
  ('welzijnswet-hoofdstuk-xibis', 'welzijnswet-1996', 'XIbis - Herhaling van ernstige arbeidsongevallen voorkomen'),
  ('welzijnswet-hoofdstuk-xii', 'welzijnswet-1996', 'XII - Slotbepalingen')
ON CONFLICT ("id") DO UPDATE SET
  "wetgevingId" = EXCLUDED."wetgevingId",
  "naam" = EXCLUDED."naam";

INSERT INTO "Titel" ("id", "boekId", "naam") VALUES
  ('welzijnswet-hoofdstuk-i-algemeen', 'welzijnswet-hoofdstuk-i', 'Rechtstreeks onder het hoofdstuk'),
  ('welzijnswet-hoofdstuk-ii-algemeen', 'welzijnswet-hoofdstuk-ii', 'Rechtstreeks onder het hoofdstuk'),
  ('welzijnswet-hoofdstuk-iii-algemeen', 'welzijnswet-hoofdstuk-iii', 'Rechtstreeks onder het hoofdstuk'),
  ('welzijnswet-hoofdstuk-vii-algemeen', 'welzijnswet-hoofdstuk-vii', 'Rechtstreeks onder het hoofdstuk'),
  ('welzijnswet-hoofdstuk-ix-algemeen', 'welzijnswet-hoofdstuk-ix', 'Rechtstreeks onder het hoofdstuk'),
  ('welzijnswet-hoofdstuk-x-algemeen', 'welzijnswet-hoofdstuk-x', 'Rechtstreeks onder het hoofdstuk'),
  ('welzijnswet-hoofdstuk-xi-algemeen', 'welzijnswet-hoofdstuk-xi', 'Rechtstreeks onder het hoofdstuk'),
  ('welzijnswet-hoofdstuk-xii-algemeen', 'welzijnswet-hoofdstuk-xii', 'Rechtstreeks onder het hoofdstuk'),
  ('welzijnswet-hoofdstuk-iv-afdeling-1', 'welzijnswet-hoofdstuk-iv', '1 - Werkzaamheden van werkgevers of zelfstandigen van buitenaf'),
  ('welzijnswet-hoofdstuk-iv-afdeling-2', 'welzijnswet-hoofdstuk-iv', '2 - Werkzaamheden van uitzendkrachten bij gebruikers'),
  ('welzijnswet-hoofdstuk-v-afdeling-1', 'welzijnswet-hoofdstuk-v', '1 - Inleidende bepalingen'),
  ('welzijnswet-hoofdstuk-v-afdeling-2', 'welzijnswet-hoofdstuk-v', '2 - Ontwerp van het bouwwerk'),
  ('welzijnswet-hoofdstuk-v-afdeling-3', 'welzijnswet-hoofdstuk-v', '3 - Verwezenlijking van het bouwwerk'),
  ('welzijnswet-hoofdstuk-v-afdeling-4', 'welzijnswet-hoofdstuk-v', '4 - Aanwezigheidsregistratiesysteem'),
  ('welzijnswet-hoofdstuk-v-afdeling-5', 'welzijnswet-hoofdstuk-v', '5 - Coördinatiestructuur'),
  ('welzijnswet-hoofdstuk-vbis-afdeling-1', 'welzijnswet-hoofdstuk-vbis', '1 - Algemeenheden'),
  ('welzijnswet-hoofdstuk-vbis-afdeling-2', 'welzijnswet-hoofdstuk-vbis', '2 - Geweld, pesterijen en ongewenst seksueel gedrag op het werk'),
  ('welzijnswet-hoofdstuk-vi-afdeling-1', 'welzijnswet-hoofdstuk-vi', '1 - Algemene bepalingen'),
  ('welzijnswet-hoofdstuk-vi-afdeling-2', 'welzijnswet-hoofdstuk-vi', '2 - Interne Dienst voor Preventie en Bescherming op het werk'),
  ('welzijnswet-hoofdstuk-vi-afdeling-3', 'welzijnswet-hoofdstuk-vi', '3 - Externe preventiediensten, medisch toezicht en technische controles'),
  ('welzijnswet-hoofdstuk-vi-afdeling-4', 'welzijnswet-hoofdstuk-vi', '4 - Coördinatie van de Diensten voor Preventie en Bescherming'),
  ('welzijnswet-hoofdstuk-vi-afdeling-5', 'welzijnswet-hoofdstuk-vi', '5 - Gemeenschappelijke bepalingen'),
  ('welzijnswet-hoofdstuk-viii-afdeling-1', 'welzijnswet-hoofdstuk-viii', '1 - Toepassingsgebied'),
  ('welzijnswet-hoofdstuk-viii-afdeling-2', 'welzijnswet-hoofdstuk-viii', '2 - Oprichting'),
  ('welzijnswet-hoofdstuk-viii-afdeling-3', 'welzijnswet-hoofdstuk-viii', '3 - Samenstelling'),
  ('welzijnswet-hoofdstuk-viii-afdeling-4', 'welzijnswet-hoofdstuk-viii', '4 - Bevoegdheden'),
  ('welzijnswet-hoofdstuk-viii-afdeling-5', 'welzijnswet-hoofdstuk-viii', '5 - Werking'),
  ('welzijnswet-hoofdstuk-viii-afdeling-6', 'welzijnswet-hoofdstuk-viii', '6 - Overgang van onderneming en overname van activa'),
  ('welzijnswet-hoofdstuk-viii-afdeling-7', 'welzijnswet-hoofdstuk-viii', '7 - Overdracht onder gerechtelijk gezag'),
  ('welzijnswet-hoofdstuk-xibis-afdeling-1', 'welzijnswet-hoofdstuk-xibis', '1 - Definitie'),
  ('welzijnswet-hoofdstuk-xibis-afdeling-2', 'welzijnswet-hoofdstuk-xibis', '2 - Onderzoek en verslaggeving van ernstige arbeidsongevallen'),
  ('welzijnswet-hoofdstuk-xibis-afdeling-3', 'welzijnswet-hoofdstuk-xibis', '3 - De deskundige'),
  ('welzijnswet-hoofdstuk-xibis-afdeling-4', 'welzijnswet-hoofdstuk-xibis', '4 - Honorarium van de deskundige'),
  ('welzijnswet-hoofdstuk-xibis-afdeling-5', 'welzijnswet-hoofdstuk-xibis', '5 - Terugvordering van het honorarium van de deskundige'),
  ('welzijnswet-hoofdstuk-xibis-afdeling-6', 'welzijnswet-hoofdstuk-xibis', '6 - Algemeenheden'),
  ('welzijnswet-hoofdstuk-xibis-afdeling-7', 'welzijnswet-hoofdstuk-xibis', '7 - Aangifte van ernstige arbeidsongevallen')
ON CONFLICT ("id") DO UPDATE SET
  "boekId" = EXCLUDED."boekId",
  "naam" = EXCLUDED."naam";
