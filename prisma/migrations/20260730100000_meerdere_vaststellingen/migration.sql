ALTER TABLE "Standaardinbreuk"
ADD COLUMN "eigenElementenToegestaan" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "InspectieInbreuk"
ADD COLUMN "vaststellingen" JSONB,
ADD COLUMN "eigenElementenToegestaan" BOOLEAN NOT NULL DEFAULT false;
