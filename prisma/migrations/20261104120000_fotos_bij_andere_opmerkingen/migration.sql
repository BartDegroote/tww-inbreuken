CREATE TABLE "AndereOpmerkingFoto" (
    "id" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "opmerkingId" TEXT NOT NULL,
    "inspectieId" TEXT NOT NULL,
    "aangemaaktOp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AndereOpmerkingFoto_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AndereOpmerkingFoto_inspectieId_opmerkingId_idx"
ON "AndereOpmerkingFoto"("inspectieId", "opmerkingId");

ALTER TABLE "AndereOpmerkingFoto"
ADD CONSTRAINT "AndereOpmerkingFoto_inspectieId_fkey"
FOREIGN KEY ("inspectieId") REFERENCES "Inspectie"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- De app gebruikt uitsluitend de afgeschermde serververbinding. De tabel is
-- niet rechtstreeks beschikbaar via de publieke Supabase Data API.
ALTER TABLE "AndereOpmerkingFoto" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE "AndereOpmerkingFoto" FROM anon, authenticated;
