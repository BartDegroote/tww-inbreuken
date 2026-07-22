ALTER TABLE "Standaardinbreuk"
ADD COLUMN "specifiekeElementenAlsSituering" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "InspectieInbreuk"
ADD COLUMN "specifiekeElementenAlsSituering" BOOLEAN NOT NULL DEFAULT false;
