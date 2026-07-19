ALTER TABLE "Gebruiker" RENAME COLUMN "email" TO "gebruikersnaam";
ALTER INDEX "Gebruiker_email_key" RENAME TO "Gebruiker_gebruikersnaam_key";
