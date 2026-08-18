ALTER TABLE "Inspectie"
ADD COLUMN "andereOpmerkingen" JSONB NOT NULL DEFAULT '[]'::jsonb;
