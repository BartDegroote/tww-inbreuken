ALTER TABLE "Gebruiker"
ADD COLUMN "wachtwoordWijzigingVereist" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "mislukteAanmeldingen" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "geblokkeerdTot" TIMESTAMP(3);

UPDATE "Gebruiker"
SET "wachtwoordWijzigingVereist" = true
WHERE "gebruikersnaam" = 'Bart';
