-- De applicatie gebruikt uitsluitend een rechtstreekse Prisma-verbinding
-- met de afgeschermde postgres-rol. De Supabase Data API wordt niet gebruikt.
--
-- Daarom krijgen anon en authenticated geen toegang tot deze tabellen.
-- De serverrol postgres heeft BYPASSRLS en blijft de applicatie bedienen.

ALTER TABLE "Gebruiker" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Sessie" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Inspectie" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InspectieInbreuk" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InspectieFoto" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Wetgeving" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Boek" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Titel" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Standaardinbreuk" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SpecifiekElement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;

-- Extra beveiligingslaag: zelfs zonder RLS-policy hebben de publieke
-- Supabase-rollen geen tabel- of sequencerechten.
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public
FROM anon, authenticated;

REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public
FROM anon, authenticated;

-- Nieuwe Prisma-tabellen worden niet automatisch publiek toegankelijk.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
REVOKE ALL PRIVILEGES ON TABLES FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
REVOKE ALL PRIVILEGES ON SEQUENCES FROM anon, authenticated;
