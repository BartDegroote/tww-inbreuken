ALTER TABLE "Inspectie"
ADD COLUMN "ernstigArbeidsongeval" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "slachtofferVoornaam" TEXT,
ADD COLUMN "slachtofferNaam" TEXT,
ADD COLUMN "ongevalsdatum" TEXT,
ADD COLUMN "slachtofferWerkHervat" BOOLEAN,
ADD COLUMN "werkpostBezocht" BOOLEAN;
