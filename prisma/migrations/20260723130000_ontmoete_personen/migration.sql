ALTER TABLE "Inspectie"
ADD COLUMN "ontmoetePersonen" JSONB NOT NULL DEFAULT '[]'::jsonb;
