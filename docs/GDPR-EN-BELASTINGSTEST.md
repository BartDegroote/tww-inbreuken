# WebApp TWW — GDPR- en belastingstest

Datum technische beoordeling: 19 juli 2026

## Verwerkte gegevens

De app verwerkt account- en sessiegegevens, inspecteurgegevens, bedrijfs- en adresgegevens, vaststellingen, wettelijke verwijzingen en foto’s. Vrije tekst en foto’s kunnen persoonsgegevens of gevoelige context bevatten. Voeg daarom uitsluitend informatie toe die noodzakelijk is voor inspectie en verslaggeving.

## Technische maatregelen in de app

- wachtwoorden worden met `scrypt` en een uniek zout gehasht;
- het tijdelijke standaardwachtwoord moet na aanmelding worden vervangen door minimaal 12 tekens;
- accounts worden na vijf mislukte pogingen gedurende vijftien minuten geblokkeerd;
- sessies gebruiken een `HttpOnly`, `SameSite=Lax` cookie en vervallen na twaalf uur;
- iedere databasebewerking controleert de eigenaar van het dossier;
- foto’s worden vóór upload verkleind, opnieuw gecodeerd en daardoor van oorspronkelijke EXIF-metadata ontdaan;
- foto’s zijn alleen na authenticatie bereikbaar en krijgen `no-store` cacheheaders;
- uploadverzoeken controleren de aanvraagbron en bestandstype en beperken de grootte;
- verwijderde inspecties worden na dertig dagen definitief verwijderd;
- beveiligingsheaders blokkeren framing, MIME-sniffing, onnodige browsermachtigingen en externe inhoud;
- Vercel Functions zijn ingesteld op Dublin (`dub1`), dicht bij de Supabase-regio `eu-west-1`;
- `.env`-bestanden, sleutels en Vercel-configuratiegegevens worden door Git genegeerd.

## Leveranciers

### Supabase

Supabase is verwerker voor database- en fotogegevens. Het project staat in `eu-west-1`. Volgens Supabase blijven projectgegevens in de gekozen regio; de klant blijft verantwoordelijk voor regiokeuze en applicatiebeveiliging. Supabase biedt een DPA, SCC’s/TIA en een subverwerkerslijst en is SOC 2 Type 2 geaudit.

Te regelen: actuele DPA accepteren/bewaren, subverwerkers opvolgen, MFA activeren voor het Supabase-beheeraccount en het back-upregime controleren. Op Free-projecten adviseert Supabase zelf periodieke externe database-exports; dagelijkse platformback-ups zijn plan-afhankelijk.

### Vercel

Vercel verwerkt webverzoeken, technische loggegevens en tijdelijk de inhoud die via serverfuncties loopt. Zonder configuratie draaien nieuwe Functions standaard in de VS; dit project forceert daarom Dublin. De actuele Vercel-DPA vermeldt dekking voor Pro en Enterprise, SCC’s, encryptie onderweg en in rust en een subverwerkersregeling.

Te regelen: bevestigen welk Vercel-plan wordt gebruikt. Voor productie met persoonsgegevens is Pro/Enterprise met toepasselijke DPA de veilige contractuele keuze. Abonneer op wijzigingen in subverwerkers en beperk toegang tot het Vercel-team met MFA.

### GitHub

GitHub hoort uitsluitend broncode te bevatten. De huidige `.gitignore` sluit `.env*`, gegenereerde builds en Vercel-lokale configuratie uit. Inspectiegegevens en database-exports mogen nooit in de repository worden geplaatst.

Te regelen: private repository gebruiken, MFA verplichten, secret scanning activeren en toegang periodiek controleren. GitHub wordt pas een relevante verwerker van inspectiegegevens wanneer zulke gegevens per ongeluk in issues, logs of commits terechtkomen.

## Formele belastingstest

De test gebruikt uitsluitend synthetische data en verwijdert ieder testdossier en testaccount in een `finally`-opruimstap.

| Scenario | Opslaan DB | Foto-upload DB | Lezen | Word | Word-grootte |
|---|---:|---:|---:|---:|---:|
| 18 inbreuken, geen foto’s | 1,02 s | 0 s | 0,17 s | 0,04 s | 0,01 MB |
| 18 inbreuken, 36 foto’s van 250 KB | 1,01 s | 8,08 s | 0,16 s | 0,38 s | 9,02 MB |
| 50 inbreuken, 50 foto’s van 250 KB | 2,62 s | 13,04 s | 0,15 s | 0,50 s | 12,53 MB |
| 100 inbreuken, geen foto’s | 5,14 s | 0 s | 0,21 s | 0,06 s | 0,01 MB |

De oorspronkelijke transactielimiet van vijf seconden werd bij de eerste run bereikt en is na die bevinding verhoogd naar zestig seconden. Foto-upload is de voornaamste bottleneck.

Een afzonderlijke bibliotheektest met 500 synthetische standaardinbreuken gaf: 0,62 s voor bulk-aanmaak, 0,37 s voor volledig ophalen en een payload van 0,38 MB. De database vormt daarbij geen probleem. Server-side paginering wordt pas belangrijk wanneer de browserweergave op tragere toestellen merkbaar vertraagt of wanneer de bibliotheek verder groeit.

## Nog organisatorisch of juridisch te regelen

Techniek alleen maakt een verwerking niet automatisch GDPR-conform. De verwerkingsverantwoordelijke moet nog:

1. de volledige identiteit en privacycontactgegevens van de verantwoordelijke vastleggen;
2. per type inspectie de rechtsgrond en concrete actieve bewaartermijn documenteren;
3. een verwerkingsregister en, waar het risico dit vereist, een DPIA opstellen;
4. verwerkersovereenkomsten en internationale doorgiftegrondslagen bewaren;
5. een procedure vastleggen voor inzage, correctie, beperking, verwijdering en bezwaar;
6. een incident- en datalekprocedure met verantwoordelijken en termijnen vastleggen;
7. periodieke toegangscontrole, back-uptest en hersteltest uitvoeren;
8. gebruikers instrueren geen overbodige persoonsgegevens of bijzondere categorieën in vrije tekst of foto’s vast te leggen.

## Officiële bronnen

- Europese Commissie, GDPR-beginselen: https://commission.europa.eu/law/law-topic/data-protection/rules-business-and-organisations/principles-gdpr/overview-principles/what-data-can-we-process-and-under-which-conditions_en
- Supabase Security: https://supabase.com/docs/guides/security
- Supabase back-ups: https://supabase.com/docs/guides/platform/backups
- Supabase DPA: https://supabase.com/downloads/docs/Supabase%2BDPA%2B260601.pdf
- Vercel DPA: https://vercel.com/legal/dpa
- Vercel Function-regio’s: https://vercel.com/docs/functions/configuring-functions/region
- GitHub Privacy Statement: https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement
