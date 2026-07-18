-- AlterTable
ALTER TABLE "Standaardinbreuk" ADD COLUMN     "aanvulling" TEXT,
ADD COLUMN     "aanvullingOpmaak" JSONB,
ADD COLUMN     "omschrijvingOpmaak" JSONB,
ADD COLUMN     "situering" TEXT;
