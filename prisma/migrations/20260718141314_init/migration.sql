-- CreateTable
CREATE TABLE "Wetgeving" (
    "id" TEXT NOT NULL,
    "naam" TEXT NOT NULL,

    CONSTRAINT "Wetgeving_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Boek" (
    "id" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "wetgevingId" TEXT NOT NULL,

    CONSTRAINT "Boek_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Titel" (
    "id" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "onderwerp" TEXT NOT NULL,
    "boekId" TEXT NOT NULL,

    CONSTRAINT "Titel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Standaardinbreuk" (
    "id" TEXT NOT NULL,
    "wetgevingId" TEXT NOT NULL,
    "boekId" TEXT NOT NULL,
    "titelId" TEXT NOT NULL,
    "beschrijving" TEXT NOT NULL,
    "extraInfo" TEXT,
    "wettelijkeVerwijzing" TEXT NOT NULL,
    "kernwoorden" TEXT[],
    "aangemaaktOp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gewijzigdOp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Standaardinbreuk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Boek_wetgevingId_idx" ON "Boek"("wetgevingId");

-- CreateIndex
CREATE INDEX "Titel_boekId_idx" ON "Titel"("boekId");

-- CreateIndex
CREATE INDEX "Standaardinbreuk_wetgevingId_idx" ON "Standaardinbreuk"("wetgevingId");

-- CreateIndex
CREATE INDEX "Standaardinbreuk_boekId_idx" ON "Standaardinbreuk"("boekId");

-- CreateIndex
CREATE INDEX "Standaardinbreuk_titelId_idx" ON "Standaardinbreuk"("titelId");

-- AddForeignKey
ALTER TABLE "Boek" ADD CONSTRAINT "Boek_wetgevingId_fkey" FOREIGN KEY ("wetgevingId") REFERENCES "Wetgeving"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Titel" ADD CONSTRAINT "Titel_boekId_fkey" FOREIGN KEY ("boekId") REFERENCES "Boek"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Standaardinbreuk" ADD CONSTRAINT "Standaardinbreuk_titelId_fkey" FOREIGN KEY ("titelId") REFERENCES "Titel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
