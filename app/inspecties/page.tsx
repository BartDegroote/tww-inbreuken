import Link from "next/link";

import { vereisGebruiker } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ruimVervallenPrullenmandOp } from "@/lib/retentie";

import InspectieActies from "./InspectieActies";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ prullenmand?: string }> };

export default async function InspectiesPagina({ searchParams }: Props) {
  const gebruiker = await vereisGebruiker();
  const toonPrullenmand = (await searchParams).prullenmand === "1";
  await ruimVervallenPrullenmandOp(gebruiker.id);
  const inspecties = await prisma.inspectie.findMany({
    where: {
      gebruikerId: gebruiker.id,
      status: toonPrullenmand ? "VERWIJDERD" : { not: "VERWIJDERD" },
    },
    include: { _count: { select: { inbreuken: true } } },
    orderBy: { gewijzigdOp: "desc" },
  });

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href="/" className="text-sm font-medium text-blue-700 hover:underline">
              ← Terug naar beginscherm
            </Link>
            <h1 className="mt-4 text-3xl font-bold text-slate-900">
              {toonPrullenmand ? "Prullenmand" : "Opgeslagen inspecties"}
            </h1>
          </div>
          <div className="flex gap-2">
            <Link
              href={toonPrullenmand ? "/inspecties" : "/inspecties?prullenmand=1"}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              {toonPrullenmand ? "Actieve inspecties" : "Prullenmand"}
            </Link>
            {!toonPrullenmand && (
              <Link href="/inspecties/nieuw" className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">
                Nieuwe inspectie
              </Link>
            )}
          </div>
        </div>

        {inspecties.length === 0 ? (
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
            {toonPrullenmand ? "De prullenmand is leeg." : "Er zijn nog geen inspecties opgeslagen."}
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {inspecties.map((inspectie) => (
              <article key={inspectie.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-blue-700">{inspectie.flow}</p>
                    <h2 className="mt-1 text-xl font-bold text-slate-900">{inspectie.onderneming}</h2>
                    <p className="mt-2 text-sm text-slate-500">
                      {inspectie.inspectiedatum} · {inspectie._count.inbreuken} inbreuk{inspectie._count.inbreuken === 1 ? "" : "en"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {!toonPrullenmand && (
                      <Link href={`/inspecties/uitvoeren?id=${inspectie.id}`} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                        Openen
                      </Link>
                    )}
                    <InspectieActies inspectieId={inspectie.id} verwijderd={toonPrullenmand} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        {toonPrullenmand && (
          <p className="mt-5 text-sm text-slate-500">
            Inspecties in de prullenmand worden na 30 dagen automatisch definitief verwijderd, inclusief foto’s.
          </p>
        )}
      </div>
    </main>
  );
}
