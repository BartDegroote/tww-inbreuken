# UX-evaluatie WebApp TWW — 22 juli 2026

## Scope

Code- en lay-outaudit van het beginscherm, aanmelden, nieuwe inspectie, opgeslagen inspecties, inspectie uitvoeren, bibliotheek, instellingen en privacy. Beoordeeld op aanraakdoelen, responsieve breekpunten, lange lijsten, scrollcontainers, formulierhiërarchie, foutmeldingen en bereikbaarheid van hoofdacties.

## Sterke punten

- Consistente kaartstijl, kleuren en duidelijke primaire knoppen.
- Formuliervelden hebben leesbare labels en voldoende grote aanraakvlakken.
- Desktop, tablet en gsm gebruiken dezelfde gegevens en functies zonder aparte versies.
- Inspectie-inbreuken zijn op gsm horizontaal doorloopbaar, waardoor de pagina niet eerst door een lange verticale lijst wordt geblokkeerd.
- Bibliotheekfilters en juridische informatie zijn logisch gegroepeerd.

## Verbeteringen in deze wijziging

### Inspectie uitvoeren

- Duidelijke, visueel afwijkende knop voor een ernstig arbeidsongeval bovenaan.
- Compact responsief ongevalsformulier met voornaam, naam, datum en twee expliciete ja/nee-keuzes.
- Automatisch scrollen naar het bewerkingsformulier wanneer op gsm of tablet een inbreuk wordt gekozen.
- De lijst met gekozen inbreuken scrollt op brede tablet- en desktopschermen onafhankelijk.
- Opslaan en Word-export blijven op een gsm onderaan het scherm bereikbaar via een compacte actiebalk.

### Bibliotheek

- Vanaf tablet-landschap worden lijst en formulier als twee onafhankelijk scrollende kolommen getoond.
- Op kleinere schermen scrollt de app na selectie of “Nieuwe standaardinbreuk” automatisch naar het formulier.
- Het Word-voorbeeld volgt de nieuwe inspringing van de echte Word-nummering.

### Nieuwe inspectie

- Minder overtollige zijmarge en kaartpadding op smalle telefoons.

## Resterende aandachtspunten

- De app werkt niet offline. Bij inspecties met onstabiele verbinding blijft dit het belangrijkste gebruiksrisico.
- Opslaan blijft een bewuste gebruikersactie; er is geen automatische conceptopslag na iedere wijziging.
- Een bibliotheek van ongeveer 500 inbreuken blijft technisch haalbaar, maar gerichte filters zijn noodzakelijk om lange zoekresultaten op een telefoon bruikbaar te houden.
- Het selecteren en opmaken van losse woorden in een contenteditable tekstveld is op iOS minder precies dan op desktop.
- Voor een volledige toegankelijkheidsaudit zijn nog toetsenbord-, schermlezer- en contrasttests op echte toestellen nodig.

## Conclusie

De bestaande visuele taal en gegevensweergave kunnen behouden blijven. De grootste praktische winst komt van beter scrollbeheer, directe navigatie naar het actieve formulier en permanent bereikbare hoofdacties tijdens een inspectie. Die punten zijn in deze wijziging aangepakt.
