/**
 * Centrale EAO-codecatalogus.
 *
 * De codelijsten en EAO-aanduidingen zijn overgenomen uit het door de
 * gebruiker aangeleverde werkboek "EAO op basis van codes.xlsx".
 * De omschrijvingen zijn typografisch gecontroleerd aan de hand van de
 * officiële FOD-codelijst, zodat ligaturen en afgebroken woorden uit het
 * werkboek niet in de gebruikersinterface terechtkomen.
 *
 * Let op: eaoRelevant betekent dat de code voorkomt in een toepasselijke
 * bijlage bij boek I, titel 6 van de Codex. Eén gemarkeerde code volstaat
 * op zichzelf niet om een arbeidsongeval juridisch als ernstig te bepalen.
 */

export type EaoCodeOptie = {
  code: string;
  omschrijving: string;
  eaoRelevant: boolean;
};

export const EAO_CODEBRON = {
  werkboek: "EAO op basis van codes.xlsx",
  codexOnderdeel: "Codex over het welzijn op het werk, boek I, titel 6",
  gecontroleerdOp: "2026-07-24",
} as const;

export const afwijkendeGebeurtenissen = [
  {
    "code": "00",
    "omschrijving": "Geen informatie",
    "eaoRelevant": false
  },
  {
    "code": "10",
    "omschrijving": "Afwijkende gebeurtenis als gevolg van een elektrische storing, explosie, brand – niet gespecificeerd",
    "eaoRelevant": true
  },
  {
    "code": "11",
    "omschrijving": "Elektrische storing door een defect in de installatie - met indirect contact als gevolg",
    "eaoRelevant": true
  },
  {
    "code": "12",
    "omschrijving": "Elektrische storing - met direct contact als gevolg",
    "eaoRelevant": true
  },
  {
    "code": "13",
    "omschrijving": "Explosie",
    "eaoRelevant": true
  },
  {
    "code": "14",
    "omschrijving": "Brand, vuurzee",
    "eaoRelevant": true
  },
  {
    "code": "19",
    "omschrijving": "Overige afwijkende gebeurtenissen, behorend tot groep 10, hierboven niet vermeld",
    "eaoRelevant": true
  },
  {
    "code": "20",
    "omschrijving": "Afwijkende gebeurtenis door overlopen, kantelen, lekken, leeglopen, verdampen, vrijkomen - niet gespecificeerd",
    "eaoRelevant": true
  },
  {
    "code": "21",
    "omschrijving": "In vaste toestand - overlopen, kantelen",
    "eaoRelevant": true
  },
  {
    "code": "22",
    "omschrijving": "In vloeibare toestand - lekken, sijpelen, leeglopen, spatten, sproeien",
    "eaoRelevant": true
  },
  {
    "code": "23",
    "omschrijving": "In gasvormige toestand - verdampen, aerosolvorming, gasvorming",
    "eaoRelevant": true
  },
  {
    "code": "24",
    "omschrijving": "In poedervorm - rookontwikkeling, stof, deeltjes",
    "eaoRelevant": true
  },
  {
    "code": "29",
    "omschrijving": "Overige afwijkende gebeurtenissen, behorend tot groep 20, hierboven niet vermeld",
    "eaoRelevant": true
  },
  {
    "code": "30",
    "omschrijving": "Breken, barsten, glijden, vallen, instorten van het betrokken voorwerp - niet gespecificeerd",
    "eaoRelevant": true
  },
  {
    "code": "31",
    "omschrijving": "Breken van materiaal, op de voegen of verbindingen",
    "eaoRelevant": true
  },
  {
    "code": "32",
    "omschrijving": "Breken, barsten, waarbij scherven/spanen ontstaan (hout, glas, metaal, steen, kunststof, overige)",
    "eaoRelevant": true
  },
  {
    "code": "33",
    "omschrijving": "Glijden, vallen, instorten van het betrokken voorwerp - hoger gelegen (op het slachtoffer vallend)",
    "eaoRelevant": true
  },
  {
    "code": "34",
    "omschrijving": "Glijden, vallen, instorten van het betrokken voorwerp - lager gelegen (het slachtoffer meeslepend)",
    "eaoRelevant": true
  },
  {
    "code": "35",
    "omschrijving": "Glijden, vallen, instorten van het betrokken voorwerp - op gelijke hoogte gelegen",
    "eaoRelevant": true
  },
  {
    "code": "39",
    "omschrijving": "Overige afwijkende gebeurtenissen, behorend tot groep 30, hierboven niet vermeld",
    "eaoRelevant": true
  },
  {
    "code": "40",
    "omschrijving": "Verlies van controle (geheel of gedeeltelijk) over een machine, vervoer- of transportmiddel, handgereedschap, voorwerp, dier - niet gespecificeerd",
    "eaoRelevant": true
  },
  {
    "code": "41",
    "omschrijving": "Verlies van controle (geheel of gedeeltelijk) - over een machine (inclusief onbedoeld starten) en over het met de machine bewerkte materiaal",
    "eaoRelevant": true
  },
  {
    "code": "42",
    "omschrijving": "Verlies van controle (geheel of gedeeltelijk) - over een vervoer- of transportmiddel (al dan niet gemotoriseerd)",
    "eaoRelevant": true
  },
  {
    "code": "43",
    "omschrijving": "Verlies van controle (geheel of gedeeltelijk) - over een handgereedschap (al dan niet gemotoriseerd) en over het met het gereedschap bewerkte materiaal",
    "eaoRelevant": true
  },
  {
    "code": "44",
    "omschrijving": "Verlies van controle (geheel of gedeeltelijk) - over een voorwerp (dat wordt gedragen, verplaatst, gehanteerd, enz.)",
    "eaoRelevant": true
  },
  {
    "code": "45",
    "omschrijving": "Verlies van controle (geheel of gedeeltelijk) - over een dier",
    "eaoRelevant": false
  },
  {
    "code": "49",
    "omschrijving": "Overige afwijkende gebeurtenissen, behorend tot groep 40, hierboven niet vermeld",
    "eaoRelevant": false
  },
  {
    "code": "50",
    "omschrijving": "Uitglijden of struikelen met val, vallen van personen - niet gespecificeerd",
    "eaoRelevant": false
  },
  {
    "code": "51",
    "omschrijving": "Vallen van personen - van hoogte",
    "eaoRelevant": true
  },
  {
    "code": "52",
    "omschrijving": "Uitglijden of struikelen met val, vallen van personen - op dezelfde hoogte",
    "eaoRelevant": false
  },
  {
    "code": "59",
    "omschrijving": "Overige afwijkende gebeurtenissen, behorend tot groep 50, hierboven niet vermeld",
    "eaoRelevant": false
  },
  {
    "code": "60",
    "omschrijving": "Bewegen van het lichaam zonder fysieke belasting (doorgaans leidend tot uitwendig letsel) – niet gespecificeerd",
    "eaoRelevant": false
  },
  {
    "code": "61",
    "omschrijving": "Op een snijdend voorwerp stappen",
    "eaoRelevant": false
  },
  {
    "code": "62",
    "omschrijving": "Knielen, gaan zitten, tegen iets leunen",
    "eaoRelevant": false
  },
  {
    "code": "63",
    "omschrijving": "Door een voorwerp of de vaart daarvan gegrepen of meegesleept worden",
    "eaoRelevant": true
  },
  {
    "code": "64",
    "omschrijving": "Ongecoördineerde, onbeheerste of verkeerde bewegingen",
    "eaoRelevant": false
  },
  {
    "code": "69",
    "omschrijving": "Overige afwijkende gebeurtenissen, behorend tot groep 60, hierboven niet vermeld",
    "eaoRelevant": false
  },
  {
    "code": "70",
    "omschrijving": "Bewegen van het lichaam met of zonder fysieke belasting (doorgaans leidend tot inwendig letsel) - niet gespecificeerd",
    "eaoRelevant": false
  },
  {
    "code": "71",
    "omschrijving": "Optillen, dragen, opstaan",
    "eaoRelevant": false
  },
  {
    "code": "72",
    "omschrijving": "Duwen, trekken",
    "eaoRelevant": false
  },
  {
    "code": "73",
    "omschrijving": "Neerzetten, bukken",
    "eaoRelevant": false
  },
  {
    "code": "74",
    "omschrijving": "Buigen, draaien, zich omdraaien",
    "eaoRelevant": false
  },
  {
    "code": "75",
    "omschrijving": "Zwaarbeladen lopen, misstap of uitglijden zonder vallen",
    "eaoRelevant": false
  },
  {
    "code": "79",
    "omschrijving": "Overige afwijkende gebeurtenissen, behorend tot groep 70, hierboven niet vermeld",
    "eaoRelevant": false
  },
  {
    "code": "80",
    "omschrijving": "Verrassing, schrik, geweldpleging, agressie, bedreiging, aanwezig zijn - niet gespecificeerd",
    "eaoRelevant": false
  },
  {
    "code": "81",
    "omschrijving": "Verrassing, schrik",
    "eaoRelevant": false
  },
  {
    "code": "82",
    "omschrijving": "Geweldpleging, agressie, bedreiging tussen personeelsleden van de werkgever",
    "eaoRelevant": false
  },
  {
    "code": "83",
    "omschrijving": "Geweldpleging, agressie, bedreiging door buitenstaanders jegens de slachtoffers in het kader van hun beroepsuitoefening (bankoverval, buschauffeurs, enz.)",
    "eaoRelevant": false
  },
  {
    "code": "84",
    "omschrijving": "Aangevallen, omvergelopen worden - door een dier",
    "eaoRelevant": false
  },
  {
    "code": "85",
    "omschrijving": "Aanwezig zijn van het slachtoffer of van een ander waardoor gevaar voor de persoon zelf en eventueel ook voor anderen ontstaat",
    "eaoRelevant": false
  },
  {
    "code": "89",
    "omschrijving": "Overige afwijkende gebeurtenissen, behorend tot groep 80, hierboven niet vermeld",
    "eaoRelevant": false
  },
  {
    "code": "99",
    "omschrijving": "Overige afwijkende gebeurtenissen, niet in deze lijst vermeld",
    "eaoRelevant": false
  }
] satisfies readonly EaoCodeOptie[];

export const betrokkenVoorwerpen = [
  {
    "code": "00.00",
    "omschrijving": "Geen betrokken voorwerp of geen informatie",
    "eaoRelevant": false
  },
  {
    "code": "00.01",
    "omschrijving": "Geen betrokken voorwerp",
    "eaoRelevant": false
  },
  {
    "code": "00.02",
    "omschrijving": "Geen informatie",
    "eaoRelevant": false
  },
  {
    "code": "00.99",
    "omschrijving": "Overige situaties, behorend tot groep 00, maar hierboven niet vermeld",
    "eaoRelevant": false
  },
  {
    "code": "01.00",
    "omschrijving": "Gebouwen, constructies, oppervlakken - gelijkvloers (binnen of buiten, vast of verplaatsbaar, tijdelijk of permanent) - niet gespecificeerd",
    "eaoRelevant": false
  },
  {
    "code": "01.01",
    "omschrijving": "Onderdelen van gebouwen, constructies - deuren, muren, wanden, … en obstakels die als zodanig bedoeld zijn (ramen, schuiframen, …)",
    "eaoRelevant": false
  },
  {
    "code": "01.02",
    "omschrijving": "Oppervlakken of loopruimten gelijkvloers - vloeren (binnen of buiten, landbouwgrond, sportterreinen, gladde vloeren, vloeren met obstakels, planken met spijkers, …)",
    "eaoRelevant": false
  },
  {
    "code": "01.03",
    "omschrijving": "Oppervlakken of loopruimten gelijkvloers – drijvend",
    "eaoRelevant": false
  },
  {
    "code": "01.99",
    "omschrijving": "Overige gebouwen, constructies, oppervlakken - gelijkvloers, behorend tot groep 01, maar hierboven niet vermeld",
    "eaoRelevant": false
  },
  {
    "code": "02.00",
    "omschrijving": "Gebouwen, constructies, oppervlakken – in de hoogte (binnen of buiten) - niet gespecificeerd",
    "eaoRelevant": true
  },
  {
    "code": "02.01",
    "omschrijving": "Bovengrondse delen van gebouwen – vast (daken, terrassen, openingen, trappen, kades)",
    "eaoRelevant": true
  },
  {
    "code": "02.02",
    "omschrijving": "Constructies, oppervlakken in de hoogte – vast (loopbruggen, vaste ladders, pylonen)",
    "eaoRelevant": true
  },
  {
    "code": "02.03",
    "omschrijving": "Constructies, oppervlakken in de hoogte – beweegbaar (rolsteigers, verplaatsbare ladders, werkbakken, hefplatformen)",
    "eaoRelevant": true
  },
  {
    "code": "02.04",
    "omschrijving": "Constructies, oppervlakken in de hoogte – tijdelijk (tijdelijke stellingen, harnasgordels en vanglijnen)",
    "eaoRelevant": true
  },
  {
    "code": "02.05",
    "omschrijving": "Constructies, oppervlakken in de hoogte – drijvend (boorplatformen, steigers op lichters)",
    "eaoRelevant": true
  },
  {
    "code": "02.99",
    "omschrijving": "Overige gebouwen, constructies, oppervlakken – in de hoogte, behorend tot groep 02, maar hierboven niet vermeld",
    "eaoRelevant": true
  },
  {
    "code": "03.00",
    "omschrijving": "Gebouwen, constructies, oppervlakken - ondergronds (binnen of buiten) - niet gespecificeerd",
    "eaoRelevant": false
  },
  {
    "code": "03.01",
    "omschrijving": "Graafwerkzaamheden, geulen, putten, kuilen, steile hellingen, werkkuilen",
    "eaoRelevant": true
  },
  {
    "code": "03.02",
    "omschrijving": "Onderaardse gangen, tunnels",
    "eaoRelevant": true
  },
  {
    "code": "03.03",
    "omschrijving": "Onderwateromgeving",
    "eaoRelevant": true
  },
  {
    "code": "03.99",
    "omschrijving": "Overige gebouwen, constructies, oppervlakken - ondergronds, behorend tot groep 03, maar hierboven niet vermeld",
    "eaoRelevant": false
  },
  {
    "code": "04.00",
    "omschrijving": "Distributiesystemen voor materialen, aanvoer, leidingen - niet gespecificeerd",
    "eaoRelevant": true
  },
  {
    "code": "04.01",
    "omschrijving": "Distributiesystemen voor materialen, aanvoer, leidingen - vast - voor gassen, vloeistoffen, vaste stoffen, incl. laadtrechters",
    "eaoRelevant": true
  },
  {
    "code": "04.02",
    "omschrijving": "Distributiesystemen voor materialen, aanvoer, leidingen – verplaatsbaar",
    "eaoRelevant": true
  },
  {
    "code": "04.03",
    "omschrijving": "Rioleringen, drainage",
    "eaoRelevant": true
  },
  {
    "code": "04.99",
    "omschrijving": "Overige distributiesystemen voor materialen, toevoer, leidingen, behorend tot groep 04, maar hierboven niet vermeld",
    "eaoRelevant": true
  },
  {
    "code": "05.00",
    "omschrijving": "Motoren, systemen voor transmissie en opslag van energie - niet gespecificeerd",
    "eaoRelevant": true
  },
  {
    "code": "05.01",
    "omschrijving": "Motoren, generatoren (thermische, elektrische of stralingsenergie), incl. compressors, pompen",
    "eaoRelevant": true
  },
  {
    "code": "05.02",
    "omschrijving": "Systemen voor transmissie en opslag van energie (mechanisch, pneumatisch, hydraulisch, elektrisch, incl. batterijen en accu's)",
    "eaoRelevant": true
  },
  {
    "code": "05.99",
    "omschrijving": "Overige systemen voor transmissie en opslag van energie, behorend tot groep 05, maar hierboven niet vermeld",
    "eaoRelevant": true
  },
  {
    "code": "06.00",
    "omschrijving": "Handgereedschap - niet gemotoriseerd - niet gespecificeerd",
    "eaoRelevant": false
  },
  {
    "code": "06.01",
    "omschrijving": "Handgereedschap - niet gemotoriseerd - voor zagen",
    "eaoRelevant": false
  },
  {
    "code": "06.02",
    "omschrijving": "Handgereedschap - niet gemotoriseerd - voor snijden, snoeien (incl. scharen, kniptangen, snoeischaren)",
    "eaoRelevant": false
  },
  {
    "code": "06.03",
    "omschrijving": "Handgereedschap - niet gemotoriseerd - voor slijpen, steken, beitelen, snoeien, maaien",
    "eaoRelevant": false
  },
  {
    "code": "06.04",
    "omschrijving": "Handgereedschap - niet gemotoriseerd - voor krabben, polijsten, schuren",
    "eaoRelevant": false
  },
  {
    "code": "06.05",
    "omschrijving": "Handgereedschap - niet gemotoriseerd - voor boren, draaien, schroeven",
    "eaoRelevant": false
  },
  {
    "code": "06.06",
    "omschrijving": "Handgereedschap - niet gemotoriseerd - voor spijkeren, klinken, nieten",
    "eaoRelevant": false
  },
  {
    "code": "06.07",
    "omschrijving": "Handgereedschap - niet gemotoriseerd - voor naaien, breien",
    "eaoRelevant": false
  },
  {
    "code": "06.08",
    "omschrijving": "Handgereedschap - niet gemotoriseerd - voor lassen, lijmen",
    "eaoRelevant": false
  },
  {
    "code": "06.09",
    "omschrijving": "Handgereedschap - niet gemotoriseerd - voor extractie van materialen en grondbewerking (incl. landbouwwerktuigen)",
    "eaoRelevant": false
  },
  {
    "code": "06.10",
    "omschrijving": "Handgereedschap - niet gemotoriseerd - voor poetsen, smeren, wassen, schoonmaken",
    "eaoRelevant": false
  },
  {
    "code": "06.11",
    "omschrijving": "Handgereedschap - niet gemotoriseerd - voor schilderen",
    "eaoRelevant": false
  },
  {
    "code": "06.12",
    "omschrijving": "Handgereedschap - niet gemotoriseerd - voor vasthouden, grijpen",
    "eaoRelevant": false
  },
  {
    "code": "06.13",
    "omschrijving": "Handgereedschap - niet gemotoriseerd - voor keukenwerkzaamheden (uitgezonderd messen)",
    "eaoRelevant": false
  },
  {
    "code": "06.14",
    "omschrijving": "Handgereedschap - niet gemotoriseerd - voor medische en chirurgische doeleinden - prikkend, snijdend",
    "eaoRelevant": false
  },
  {
    "code": "06.15",
    "omschrijving": "Handgereedschap - niet gemotoriseerd - voor medische en chirurgische doeleinden – overige, niet snijdend",
    "eaoRelevant": false
  },
  {
    "code": "06.99",
    "omschrijving": "Overig handgereedschap - niet gemotoriseerd – voor overige werkzaamheden, behorend tot groep 06, maar hierboven niet vermeld",
    "eaoRelevant": false
  },
  {
    "code": "07.00",
    "omschrijving": "Mechanisch gereedschap met de hand bediend - niet gespecificeerd",
    "eaoRelevant": true
  },
  {
    "code": "07.01",
    "omschrijving": "Mechanisch handgereedschap - voor zagen",
    "eaoRelevant": true
  },
  {
    "code": "07.02",
    "omschrijving": "Mechanisch handgereedschap - voor snijden, snoeien (incl. scharen, kniptangen, snoeischaren)",
    "eaoRelevant": true
  },
  {
    "code": "07.03",
    "omschrijving": "Mechanisch handgereedschap - voor slijpen, steken, beitelen (grootte hagen zie 09.02), snoeien, maaien",
    "eaoRelevant": true
  },
  {
    "code": "07.04",
    "omschrijving": "Mechanisch handgereedschap - voor krabben, polijsten, schuren (incl. doorslijpmachine)",
    "eaoRelevant": true
  },
  {
    "code": "07.05",
    "omschrijving": "Mechanisch handgereedschap - voor boren, draaien, schroeven",
    "eaoRelevant": true
  },
  {
    "code": "07.06",
    "omschrijving": "Mechanisch handgereedschap - voor spijkeren, klinken, nieten",
    "eaoRelevant": true
  },
  {
    "code": "07.07",
    "omschrijving": "Mechanisch handgereedschap - voor naaien, breien",
    "eaoRelevant": true
  },
  {
    "code": "07.08",
    "omschrijving": "Mechanisch handgereedschap - voor lassen, lijmen",
    "eaoRelevant": true
  },
  {
    "code": "07.09",
    "omschrijving": "Mechanisch handgereedschap - voor extractie van materialen en grondbewerking (incl. landbouwmachines, betonbrekers)",
    "eaoRelevant": true
  },
  {
    "code": "07.10",
    "omschrijving": "Mechanisch handgereedschap - voor poetsen, smeren, wassen, schoonmaken (incl. stofzuiger, hogedrukreiniger)",
    "eaoRelevant": true
  },
  {
    "code": "07.11",
    "omschrijving": "Mechanisch handgereedschap - voor schilderen",
    "eaoRelevant": true
  },
  {
    "code": "07.12",
    "omschrijving": "Mechanisch handgereedschap - voor vasthouden, grijpen",
    "eaoRelevant": true
  },
  {
    "code": "07.13",
    "omschrijving": "Mechanisch handgereedschap - voor keukenwerkzaamheden (uitgezonderd messen)",
    "eaoRelevant": true
  },
  {
    "code": "07.14",
    "omschrijving": "Mechanisch handgereedschap - voor verwarmen (incl. droger, verfafbrander, strijkijzer)",
    "eaoRelevant": true
  },
  {
    "code": "07.15",
    "omschrijving": "Mechanisch handgereedschap - voor medische en chirurgische doeleinden - prikkend, snijdend",
    "eaoRelevant": true
  },
  {
    "code": "07.16",
    "omschrijving": "Mechanisch handgereedschap - voor medische en chirurgische doeleinden – overige, niet snijdend",
    "eaoRelevant": true
  },
  {
    "code": "07.17",
    "omschrijving": "Pneumatische spuitwerktuigen (zonder het werktuig nauwkeurig weer te geven)",
    "eaoRelevant": true
  },
  {
    "code": "07.99",
    "omschrijving": "Met de hand bediend mechanisch gereedschap, voor overige werkzaamheden, behorend tot groep 07, maar hierboven niet vermeld",
    "eaoRelevant": true
  },
  {
    "code": "08.00",
    "omschrijving": "Handgereedschap - zonder aanduiding over aandrijving - niet gespecificeerd",
    "eaoRelevant": false
  },
  {
    "code": "08.01",
    "omschrijving": "Handgereedschap - zonder aanduiding over aandrijving - voor zagen",
    "eaoRelevant": false
  },
  {
    "code": "08.02",
    "omschrijving": "Handgereedschap - zonder aanduiding over aandrijving - voor snijden, afsnijden (incl. scharen, kniptangen, snoeischaren)",
    "eaoRelevant": false
  },
  {
    "code": "08.03",
    "omschrijving": "Handgereedschap - zonder aanduiding over aandrijving - voor slijpen, steken, beitelen, snoeien, maaien",
    "eaoRelevant": false
  },
  {
    "code": "08.04",
    "omschrijving": "Handgereedschap - zonder aanduiding over aandrijving - voor krabben, polijsten, schuren",
    "eaoRelevant": false
  },
  {
    "code": "08.05",
    "omschrijving": "Handgereedschap - zonder aanduiding over aandrijving - voor boren, draaien, schroeven",
    "eaoRelevant": false
  },
  {
    "code": "08.06",
    "omschrijving": "Handgereedschap - zonder aanduiding over aandrijving - voor spijkeren, klinken, nieten",
    "eaoRelevant": false
  },
  {
    "code": "08.07",
    "omschrijving": "Handgereedschap - zonder aanduiding over aandrijving - voor naaien, breien",
    "eaoRelevant": false
  },
  {
    "code": "08.08",
    "omschrijving": "Handgereedschap - zonder aanduiding over aandrijving - voor lassen, lijmen",
    "eaoRelevant": false
  },
  {
    "code": "08.09",
    "omschrijving": "Handgereedschap - zonder aanduiding over aandrijving - voor extractie van materialen en grondbewerking (incl. landbouwmachines)",
    "eaoRelevant": false
  },
  {
    "code": "08.10",
    "omschrijving": "Handgereedschap - zonder aanduiding over aandrijving - voor poetsen, smeren, wassen, schoonmaken",
    "eaoRelevant": false
  },
  {
    "code": "08.11",
    "omschrijving": "Handgereedschap - zonder aanduiding over aandrijving - voor schilderen",
    "eaoRelevant": false
  },
  {
    "code": "08.12",
    "omschrijving": "Handgereedschap - zonder aanduiding over aandrijving - voor vasthouden, grijpen",
    "eaoRelevant": false
  },
  {
    "code": "08.13",
    "omschrijving": "Handgereedschap - zonder aanduiding over aandrijving - voor keukenwerkzaamheden (uitgezonderd messen)",
    "eaoRelevant": false
  },
  {
    "code": "08.14",
    "omschrijving": "Handgereedschap - zonder aanduiding over aandrijving - voor medische en chirurgische doeleinden - prikkend, snijdend",
    "eaoRelevant": false
  },
  {
    "code": "08.15",
    "omschrijving": "Handgereedschap - zonder aanduiding over aandrijving - voor medische en chirurgische doeleinden – overige, niet snijdend",
    "eaoRelevant": false
  },
  {
    "code": "08.99",
    "omschrijving": "Overig handgereedschap - zonder aanduiding over aandrijving – voor overige werkzaamheden, behorend tot groep 08, maar hierboven niet vermeld",
    "eaoRelevant": false
  },
  {
    "code": "09.00",
    "omschrijving": "Machines en uitrusting - draagbaar of verplaatsbaar - niet gespecificeerd",
    "eaoRelevant": true
  },
  {
    "code": "09.01",
    "omschrijving": "Draagbare of verplaatsbare machines - voor opgravingen en grondbewerking - mijnbouw, steen/zandgroeven en machines voor de bouw, openbare werken",
    "eaoRelevant": true
  },
  {
    "code": "09.02",
    "omschrijving": "Draagbare of verplaatsbare machines – voor grondbewerking, landbouw",
    "eaoRelevant": true
  },
  {
    "code": "09.03",
    "omschrijving": "Draagbare of verplaatsbare machines (niet voor grondbewerking) - voor bouwplaatsen",
    "eaoRelevant": true
  },
  {
    "code": "09.04",
    "omschrijving": "Verplaatsbare vloerreinigingsmachines",
    "eaoRelevant": true
  },
  {
    "code": "09.99",
    "omschrijving": "Overige draagbare of verplaatsbare machines, behorend tot groep 09, maar hierboven niet vermeld",
    "eaoRelevant": true
  },
  {
    "code": "10.00",
    "omschrijving": "Machines en uitrusting - vast gemonteerd - niet gespecificeerd",
    "eaoRelevant": true
  },
  {
    "code": "10.01",
    "omschrijving": "Vast gemonteerde machines voor opgravingen en grondwerkzaamheden",
    "eaoRelevant": true
  },
  {
    "code": "10.02",
    "omschrijving": "Machines voor het voorbewerken van materialen, breken, vermalen, filteren, scheiden, mengen, kneden",
    "eaoRelevant": true
  },
  {
    "code": "10.03",
    "omschrijving": "Machines voor het verwerken van materialen - chemische procedés (reactoren, fermentoren)",
    "eaoRelevant": true
  },
  {
    "code": "10.04",
    "omschrijving": "Machines voor het verwerken van materialen - warmteprocedés (oven, drooginstallaties, droogruimtes)",
    "eaoRelevant": true
  },
  {
    "code": "10.05",
    "omschrijving": "Machines voor het verwerken van materialen - koudeprocedés (koudeopwekking)",
    "eaoRelevant": true
  },
  {
    "code": "10.06",
    "omschrijving": "Machines voor het verwerken van materialen - andere procedés",
    "eaoRelevant": true
  },
  {
    "code": "10.07",
    "omschrijving": "Machines voor vormen - persen, pletten",
    "eaoRelevant": true
  },
  {
    "code": "10.08",
    "omschrijving": "Machines voor vormen - kalanderen, lamineren, machines met rollen (incl. voor papierfabricage)",
    "eaoRelevant": true
  },
  {
    "code": "10.09",
    "omschrijving": "Machines voor vormen - door injectie, extrusie, inblazing, spinnen, afgieten, smelten",
    "eaoRelevant": true
  },
  {
    "code": "10.10",
    "omschrijving": "Bewerkingsmachines - voor schaven, frezen, vlakslijpen, slijpen, polijsten, draaien, boren",
    "eaoRelevant": true
  },
  {
    "code": "10.11",
    "omschrijving": "Bewerkingsmachines - voor zagen",
    "eaoRelevant": true
  },
  {
    "code": "10.12",
    "omschrijving": "Bewerkingsmachines - voor snijden, splijten, snoeien (incl. decoupeerpers, schaar, snijmachine, snijbrander)",
    "eaoRelevant": true
  },
  {
    "code": "10.13",
    "omschrijving": "Machines voor oppervlakbewerking - schoonmaken, wassen, drogen, schilderen, drukken",
    "eaoRelevant": true
  },
  {
    "code": "10.14",
    "omschrijving": "Machines voor oppervlakbewerking - galvaniseren, elektrolytische oppervlakbehandeling",
    "eaoRelevant": true
  },
  {
    "code": "10.15",
    "omschrijving": "Machines voor assembleren (lassen, lijmen, spijkeren, schroeven, klinken, spinnen, kabeldraaien, naaien, nieten)",
    "eaoRelevant": true
  },
  {
    "code": "10.16",
    "omschrijving": "Machines voor conditioneren, verpakken (vullen, etiketteren, sluiten, enz.)",
    "eaoRelevant": true
  },
  {
    "code": "10.17",
    "omschrijving": "Overige machines voor specifieke industriële doeleinden (machines voor controle, testen, diverse machines)",
    "eaoRelevant": true
  },
  {
    "code": "10.18",
    "omschrijving": "Speciale machines voor landbouw, veeteelt, niet behorend tot de hierboven genoemde machines",
    "eaoRelevant": true
  },
  {
    "code": "10.99",
    "omschrijving": "Overige machines en uitrusting - vast gemonteerd - behorend tot groep 10, maar hierboven niet vermeld",
    "eaoRelevant": true
  },
  {
    "code": "11.00",
    "omschrijving": "Systemen voor gesloten of open transport en opslag - niet gespecificeerd",
    "eaoRelevant": true
  },
  {
    "code": "11.01",
    "omschrijving": "Vaste transportbanden, materialen en systemen voor ononderbroken transport – loopbanden, roltrappen, kabelbanen, rolbanden, …",
    "eaoRelevant": true
  },
  {
    "code": "11.02",
    "omschrijving": "Vracht- en personenliften, hefinstallaties – goederenlift, hijsemmer, krik",
    "eaoRelevant": true
  },
  {
    "code": "11.03",
    "omschrijving": "Vaste of verplaatsbare kranen, op voertuigen gemonteerd, loopkranen, hefmaterieel voor hangende lasten",
    "eaoRelevant": true
  },
  {
    "code": "11.04",
    "omschrijving": "Verplaatsbare transportsystemen, transportwagentjes (al dan niet gemotoriseerd) – kruiwagen, palethefwagentje, enz.",
    "eaoRelevant": true
  },
  {
    "code": "11.05",
    "omschrijving": "Installaties voor heffen, vastmaken, grijpen en diverse transportmiddelen (incl. stroppen, haken, takels, enz.)",
    "eaoRelevant": true
  },
  {
    "code": "11.06",
    "omschrijving": "Systemen voor opslag, verpakking, containers, (silo's, reservoirs, tanks, bassins) – vast gemonteerd",
    "eaoRelevant": true
  },
  {
    "code": "11.07",
    "omschrijving": "Systemen voor opslag, transport, containers, laadbakken – verplaatsbaar",
    "eaoRelevant": true
  },
  {
    "code": "11.08",
    "omschrijving": "Hulpmiddelen voor opslag, stellingen, palletstellingen, palletten",
    "eaoRelevant": true
  },
  {
    "code": "11.09",
    "omschrijving": "Diverse verpakkingen, klein en middelgroot, verplaatsbaar (diverse bakken en vaten, flessen, kisten, gasflessen, brandblussers, enz.)",
    "eaoRelevant": true
  },
  {
    "code": "11.99",
    "omschrijving": "Overige systemen voor gesloten of open transport en opslag, behorend tot groep 11, maar hierboven niet vermeld",
    "eaoRelevant": true
  },
  {
    "code": "12.00",
    "omschrijving": "Voertuigen voor transport over land - niet gespecificeerd",
    "eaoRelevant": true
  },
  {
    "code": "12.01",
    "omschrijving": "Zware voertuigen - vrachtwagens (goederenvervoer), bussen en touringcars (personenvervoer)",
    "eaoRelevant": true
  },
  {
    "code": "12.02",
    "omschrijving": "Lichte voertuigen - vracht- of personenvervoer",
    "eaoRelevant": true
  },
  {
    "code": "12.03",
    "omschrijving": "Voertuigen - met twee of drie wielen, al dan niet gemotoriseerd",
    "eaoRelevant": true
  },
  {
    "code": "12.04",
    "omschrijving": "Overige vervoermiddelen over land: ski’s, rolschaatsen, …",
    "eaoRelevant": true
  },
  {
    "code": "12.99",
    "omschrijving": "Overige voertuigen voor transport over land, behorend tot groep 12, maar hierboven niet vermeld",
    "eaoRelevant": true
  },
  {
    "code": "13.00",
    "omschrijving": "Overige transportvoertuigen - niet gespecificeerd",
    "eaoRelevant": false
  },
  {
    "code": "13.01",
    "omschrijving": "Voertuigen - op rails, incl. hangende monorail: vrachtvervoer",
    "eaoRelevant": false
  },
  {
    "code": "13.02",
    "omschrijving": "Voertuigen - op rails, incl. hangende monorail: personenvervoer",
    "eaoRelevant": false
  },
  {
    "code": "13.03",
    "omschrijving": "Vaartuigen: vrachtvervoer",
    "eaoRelevant": false
  },
  {
    "code": "13.04",
    "omschrijving": "Vaartuigen: personenvervoer",
    "eaoRelevant": false
  },
  {
    "code": "13.05",
    "omschrijving": "Vaartuigen: visserij",
    "eaoRelevant": false
  },
  {
    "code": "13.06",
    "omschrijving": "Luchtvoertuigen: vrachtvervoer",
    "eaoRelevant": false
  },
  {
    "code": "13.07",
    "omschrijving": "Luchtvoertuigen: personenvervoer",
    "eaoRelevant": false
  },
  {
    "code": "13.99",
    "omschrijving": "Overige transportvoertuigen, behorend tot groep 13, maar hierboven niet vermeld",
    "eaoRelevant": false
  },
  {
    "code": "14.00",
    "omschrijving": "Materialen, voorwerpen, producten, onderdelen van machines, breukmateriaal, stof – niet gespecificeerd",
    "eaoRelevant": false
  },
  {
    "code": "14.01",
    "omschrijving": "Bouwmaterialen - groot en klein: prefab-elementen, bekistingsonderdelen, balken, bakstenen, dakpannen, enz.",
    "eaoRelevant": false
  },
  {
    "code": "14.02",
    "omschrijving": "Bouwmateriaal of onderdelen van machines, voertuigen: chassis, kettingkast, kruk, wiel, enz.",
    "eaoRelevant": false
  },
  {
    "code": "14.03",
    "omschrijving": "Bewerkte stukken of elementen, machinewerktuigen (incl. deeltjes en splinters afkomstig van deze voorwerpen)",
    "eaoRelevant": false
  },
  {
    "code": "14.04",
    "omschrijving": "Assemblage-elementen: schroeven, spijkers, bouten, enz.",
    "eaoRelevant": false
  },
  {
    "code": "14.05",
    "omschrijving": "Deeltjes, stof, scherven, stukjes, spatten, splinters en andere breukdeeltjes",
    "eaoRelevant": false
  },
  {
    "code": "14.06",
    "omschrijving": "Landbouwproducten - (incl. graankorrels, stro, overige landbouwproducties)",
    "eaoRelevant": false
  },
  {
    "code": "14.07",
    "omschrijving": "Producten - voor de landbouw, veeteelt (incl. meststoffen, veevoeder)",
    "eaoRelevant": false
  },
  {
    "code": "14.08",
    "omschrijving": "Opgeslagen producten - incl. voorwerpen en verpakkingen in opslag",
    "eaoRelevant": false
  },
  {
    "code": "14.09",
    "omschrijving": "Opgeslagen producten - in rollen, klossen",
    "eaoRelevant": false
  },
  {
    "code": "14.10",
    "omschrijving": "Lasten - d.m.v. mechanisch transportmiddel verplaatst",
    "eaoRelevant": true
  },
  {
    "code": "14.11",
    "omschrijving": "Lasten - hangend aan hefinstallaties, kraan",
    "eaoRelevant": true
  },
  {
    "code": "14.12",
    "omschrijving": "Lasten - met de hand gebruiken",
    "eaoRelevant": false
  },
  {
    "code": "14.99",
    "omschrijving": "Overige materialen, voorwerpen, producten, onderdelen van machines, behorend tot groep 14, maar hierboven niet vermeld",
    "eaoRelevant": false
  },
  {
    "code": "15.00",
    "omschrijving": "Chemische stoffen, explosieven, radioactieve stoffen, biologische stoffen - niet gespecificeerd",
    "eaoRelevant": true
  },
  {
    "code": "15.01",
    "omschrijving": "Bijtende, corrosieve stoffen (vast, vloeibaar of gasvormig)",
    "eaoRelevant": true
  },
  {
    "code": "15.02",
    "omschrijving": "Schadelijke, giftige stoffen (vast, vloeibaar of gasvormig)",
    "eaoRelevant": true
  },
  {
    "code": "15.03",
    "omschrijving": "Ontvlambare stoffen (vast, vloeibaar of gasvormig)",
    "eaoRelevant": true
  },
  {
    "code": "15.04",
    "omschrijving": "Explosieven, reactieve stoffen (vast, vloeibaar of gasvormig)",
    "eaoRelevant": true
  },
  {
    "code": "15.05",
    "omschrijving": "Gassen, dampen zonder specifieke uitwerking (biologisch inert, verstikkend)",
    "eaoRelevant": true
  },
  {
    "code": "15.06",
    "omschrijving": "Radioactieve stoffen",
    "eaoRelevant": true
  },
  {
    "code": "15.07",
    "omschrijving": "Biologische stoffen",
    "eaoRelevant": true
  },
  {
    "code": "15.08",
    "omschrijving": "Stoffen, materialen zonder specifieke risico's (water, inerte materialen, enz.)",
    "eaoRelevant": true
  },
  {
    "code": "15.99",
    "omschrijving": "Overige chemische stoffen, explosieven, radioactieve stoffen, biologische stoffen, behorend tot groep 15, maar hierboven niet vermeld",
    "eaoRelevant": true
  },
  {
    "code": "16.00",
    "omschrijving": "Veiligheidssystemen en veiligheidsuitrusting - niet gespecificeerd",
    "eaoRelevant": true
  },
  {
    "code": "16.01",
    "omschrijving": "Veiligheidssystemen - op machines",
    "eaoRelevant": true
  },
  {
    "code": "16.02",
    "omschrijving": "Persoonlijke beschermingssystemen",
    "eaoRelevant": true
  },
  {
    "code": "16.03",
    "omschrijving": "Systemen en uitrusting voor hulpverlening",
    "eaoRelevant": true
  },
  {
    "code": "16.99",
    "omschrijving": "Overige veiligheidssystemen en veiligheidsuitrusting, behorend tot groep 16, maar hierboven niet vermeld",
    "eaoRelevant": true
  },
  {
    "code": "17.00",
    "omschrijving": "Kantooruitrusting en persoonlijke uitrusting, sportuitrusting, wapens, huishoudelijke apparaten - niet gespecificeerd",
    "eaoRelevant": false
  },
  {
    "code": "17.01",
    "omschrijving": "Meubilair",
    "eaoRelevant": false
  },
  {
    "code": "17.02",
    "omschrijving": "Apparatuur – informatica, bureautica, reprografie, communicatie",
    "eaoRelevant": false
  },
  {
    "code": "17.03",
    "omschrijving": "Benodigdheden - voor onderwijs, schrijven, tekenen (schrijfmachine, frankeermachine, vergrotingsapparaat, prikklok)",
    "eaoRelevant": false
  },
  {
    "code": "17.04",
    "omschrijving": "Artikelen en uitrusting voor sport en spel",
    "eaoRelevant": false
  },
  {
    "code": "17.05",
    "omschrijving": "Wapens",
    "eaoRelevant": true
  },
  {
    "code": "17.06",
    "omschrijving": "Persoonlijke bezittingen, kleding",
    "eaoRelevant": false
  },
  {
    "code": "17.07",
    "omschrijving": "Muziekinstrumenten",
    "eaoRelevant": false
  },
  {
    "code": "17.08",
    "omschrijving": "Huishoudelijke apparaten, gebruiksartikelen, voorwerpen, linnengoed (voor professioneel gebruik)",
    "eaoRelevant": false
  },
  {
    "code": "17.99",
    "omschrijving": "Overige kantooruitrusting en persoonlijke uitrusting, sportuitrusting, wapens, behorend tot groep 17, maar hierboven niet vermeld",
    "eaoRelevant": false
  },
  {
    "code": "18.00",
    "omschrijving": "Levende organismen en mensen - niet gespecificeerd",
    "eaoRelevant": false
  },
  {
    "code": "18.01",
    "omschrijving": "Bomen, planten, kweekproducten",
    "eaoRelevant": false
  },
  {
    "code": "18.02",
    "omschrijving": "Dieren - huisdieren, vee",
    "eaoRelevant": false
  },
  {
    "code": "18.03",
    "omschrijving": "Dieren - wilde dieren, insecten, slangen",
    "eaoRelevant": true
  },
  {
    "code": "18.04",
    "omschrijving": "Micro-organismen",
    "eaoRelevant": true
  },
  {
    "code": "18.05",
    "omschrijving": "Virussen",
    "eaoRelevant": true
  },
  {
    "code": "18.06",
    "omschrijving": "Mensen",
    "eaoRelevant": false
  },
  {
    "code": "18.99",
    "omschrijving": "Overige levende organismen, behorend tot groep 18, maar hierboven niet vermeld",
    "eaoRelevant": false
  },
  {
    "code": "19.00",
    "omschrijving": "Bulkafval - niet gespecificeerd",
    "eaoRelevant": false
  },
  {
    "code": "19.01",
    "omschrijving": "Bulkafval - stoffen, producten, materialen, voorwerpen",
    "eaoRelevant": false
  },
  {
    "code": "19.02",
    "omschrijving": "Bulkafval - chemische stoffen",
    "eaoRelevant": true
  },
  {
    "code": "19.03",
    "omschrijving": "Bulkafval - biologische, plantaardige, dierlijke stoffen",
    "eaoRelevant": true
  },
  {
    "code": "19.99",
    "omschrijving": "Overig bulkafval, behorend tot groep 19, maar hierboven niet vermeld",
    "eaoRelevant": false
  },
  {
    "code": "20.00",
    "omschrijving": "Fysische verschijnselen en natuurlijke elementen - niet gespecificeerd",
    "eaoRelevant": false
  },
  {
    "code": "20.01",
    "omschrijving": "Fysische verschijnselen - lawaai, natuurlijke straling, licht, lichtboog, overdruk, onderdruk, druk",
    "eaoRelevant": false
  },
  {
    "code": "20.02",
    "omschrijving": "Natuurlijke en atmosferische elementen (incl. watervlaktes, modder, regen, hagel, sneeuw, ijzel, windstoot, enz.)",
    "eaoRelevant": false
  },
  {
    "code": "20.03",
    "omschrijving": "Natuurrampen (overstroming, vulkanisme, aardbeving, vloedgolf, vuur, brand, enz.)",
    "eaoRelevant": false
  },
  {
    "code": "20.99",
    "omschrijving": "Overige fysische verschijnselen en natuurlijke elementen, behorend tot groep 20, maar hierboven niet vermeld",
    "eaoRelevant": false
  },
  {
    "code": "99.00",
    "omschrijving": "Overige betrokken voorwerpen die niet in deze lijst vermeld worden",
    "eaoRelevant": false
  }
] satisfies readonly EaoCodeOptie[];

export const soortenLetsel = [
  {
    "code": "000",
    "omschrijving": "Onbekend letsel: Informatie ontbreekt",
    "eaoRelevant": false
  },
  {
    "code": "010",
    "omschrijving": "Wonden en oppervlakkige letsels",
    "eaoRelevant": false
  },
  {
    "code": "011",
    "omschrijving": "Oppervlakkige letsels",
    "eaoRelevant": false
  },
  {
    "code": "012",
    "omschrijving": "Open wonden",
    "eaoRelevant": false
  },
  {
    "code": "013",
    "omschrijving": "Vleeswonden met verlies van weefsel die aanleiding geven tot een meerdaagse arbeidsongeschiktheid.",
    "eaoRelevant": true
  },
  {
    "code": "019",
    "omschrijving": "Andere soorten wonden en oppervlakkige letsels",
    "eaoRelevant": false
  },
  {
    "code": "020",
    "omschrijving": "Botbreuken",
    "eaoRelevant": true
  },
  {
    "code": "021",
    "omschrijving": "Gesloten botbreuken",
    "eaoRelevant": true
  },
  {
    "code": "022",
    "omschrijving": "Open botbreuken",
    "eaoRelevant": true
  },
  {
    "code": "029",
    "omschrijving": "Andere soorten botbreuken",
    "eaoRelevant": true
  },
  {
    "code": "030",
    "omschrijving": "Ontwrichtingen, verstuikingen en verrekkingen",
    "eaoRelevant": false
  },
  {
    "code": "031",
    "omschrijving": "Ontwrichtingen",
    "eaoRelevant": false
  },
  {
    "code": "032",
    "omschrijving": "Verstuikingen en verrekkingen",
    "eaoRelevant": false
  },
  {
    "code": "039",
    "omschrijving": "Andere soorten ontwrichtingen, verstuikingen en verrekkingen",
    "eaoRelevant": false
  },
  {
    "code": "040",
    "omschrijving": "Traumatische amputaties (verlies van ledematen)",
    "eaoRelevant": true
  },
  {
    "code": "041",
    "omschrijving": "Afzettingen",
    "eaoRelevant": true
  },
  {
    "code": "050",
    "omschrijving": "Schuddingen en inwendige letsels",
    "eaoRelevant": false
  },
  {
    "code": "051",
    "omschrijving": "Schuddingen",
    "eaoRelevant": false
  },
  {
    "code": "052",
    "omschrijving": "Inwendige letsels",
    "eaoRelevant": false
  },
  {
    "code": "053",
    "omschrijving": "Schuddingen en inwendige letsels die in afwezigheid van behandeling levensbedreigend kunnen zijn",
    "eaoRelevant": true
  },
  {
    "code": "054",
    "omschrijving": "Schadelijke effecten van elektriciteit",
    "eaoRelevant": true
  },
  {
    "code": "059",
    "omschrijving": "Andere soorten schuddingen en inwendige letsels",
    "eaoRelevant": false
  },
  {
    "code": "060",
    "omschrijving": "Verbrandingen, brandplekken (door kokende vloeistof) en bevriezing",
    "eaoRelevant": true
  },
  {
    "code": "061",
    "omschrijving": "Brandplekken (thermische – door kokende vloeistof) en verbrandingen",
    "eaoRelevant": true
  },
  {
    "code": "062",
    "omschrijving": "Chemische verbrandingen (corrosie)",
    "eaoRelevant": true
  },
  {
    "code": "063",
    "omschrijving": "Bevriezing",
    "eaoRelevant": true
  },
  {
    "code": "069",
    "omschrijving": "Andere soorten verbrandingen, brandplekken door kokende vloeistof en bevriezing",
    "eaoRelevant": true
  },
  {
    "code": "070",
    "omschrijving": "Vergiftigingen en infecties",
    "eaoRelevant": false
  },
  {
    "code": "071",
    "omschrijving": "Acute vergiftigingen",
    "eaoRelevant": true
  },
  {
    "code": "072",
    "omschrijving": "Acute infecties",
    "eaoRelevant": true
  },
  {
    "code": "079",
    "omschrijving": "Andere soorten vergiftigingen en infecties",
    "eaoRelevant": true
  },
  {
    "code": "080",
    "omschrijving": "Verdrinking en verstikking",
    "eaoRelevant": false
  },
  {
    "code": "081",
    "omschrijving": "Verstikking",
    "eaoRelevant": true
  },
  {
    "code": "082",
    "omschrijving": "Verdrinking en niet dodelijke onderdompeling",
    "eaoRelevant": true
  },
  {
    "code": "089",
    "omschrijving": "Andere soorten verdrinking en verstikking",
    "eaoRelevant": true
  },
  {
    "code": "090",
    "omschrijving": "Effecten van lawaai, trillingen en druk",
    "eaoRelevant": false
  },
  {
    "code": "091",
    "omschrijving": "Acuut gehoorverlies",
    "eaoRelevant": false
  },
  {
    "code": "092",
    "omschrijving": "Effecten van druk",
    "eaoRelevant": false
  },
  {
    "code": "099",
    "omschrijving": "Andere effecten van lawaai, trillingen en druk",
    "eaoRelevant": false
  },
  {
    "code": "100",
    "omschrijving": "Effecten van extreme temperaturen, licht en straling",
    "eaoRelevant": false
  },
  {
    "code": "101",
    "omschrijving": "Hitte en zonnesteken",
    "eaoRelevant": false
  },
  {
    "code": "102",
    "omschrijving": "Effecten van straling (niet-thermische)",
    "eaoRelevant": true
  },
  {
    "code": "103",
    "omschrijving": "Effecten van temperatuurdaling",
    "eaoRelevant": false
  },
  {
    "code": "109",
    "omschrijving": "Andere effecten van extreme temperaturen, licht en straling",
    "eaoRelevant": false
  },
  {
    "code": "110",
    "omschrijving": "Shocks",
    "eaoRelevant": false
  },
  {
    "code": "111",
    "omschrijving": "Shocks na agressie en bedreigingen",
    "eaoRelevant": false
  },
  {
    "code": "112",
    "omschrijving": "Traumatische shocks",
    "eaoRelevant": false
  },
  {
    "code": "119",
    "omschrijving": "Andere soorten shocks",
    "eaoRelevant": false
  },
  {
    "code": "120",
    "omschrijving": "Multipele letsels",
    "eaoRelevant": false
  },
  {
    "code": "999",
    "omschrijving": "Andere, niet onder andere punten opgenomen gespecificeerde letsels",
    "eaoRelevant": false
  }
] satisfies readonly EaoCodeOptie[];

export const eaoCodeCatalogus = {
  afwijkendeGebeurtenissen,
  betrokkenVoorwerpen,
  soortenLetsel,
} as const;

export type EaoCodeCategorie = keyof typeof eaoCodeCatalogus;

export function zoekEaoCode(
  categorie: EaoCodeCategorie,
  code: string,
): EaoCodeOptie | undefined {
  return eaoCodeCatalogus[categorie].find(
    (optie) => optie.code === code,
  );
}

export function formatteerEaoCode(
  optie: EaoCodeOptie,
): string {
  return `${optie.code} – ${optie.omschrijving}`;
}
