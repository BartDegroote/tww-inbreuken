import { NextResponse } from "next/server";

import { huidigeGebruiker } from "@/lib/auth";
import { MAX_FOTOS_PER_OPMERKING } from "@/lib/inspectie-limieten";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    inspectieId: string;
    opmerkingId: string;
  }>;
};

function bevatOpmerking(
  waarde: unknown,
  opmerkingId: string,
): boolean {
  return (
    Array.isArray(waarde) &&
    waarde.some(
      (opmerking) =>
        typeof opmerking === "object" &&
        opmerking !== null &&
        !Array.isArray(opmerking) &&
        (opmerking as { id?: unknown }).id ===
          opmerkingId,
    )
  );
}

export async function POST(
  request: Request,
  context: RouteContext,
) {
  const oorsprong = request.headers.get("origin");
  if (
    oorsprong &&
    oorsprong !== new URL(request.url).origin
  ) {
    return NextResponse.json(
      { fout: "Ongeldige aanvraagbron." },
      { status: 403 },
    );
  }

  const gebruiker = await huidigeGebruiker();

  if (!gebruiker) {
    return NextResponse.json(
      { fout: "Niet aangemeld." },
      { status: 401 },
    );
  }

  const { inspectieId, opmerkingId } =
    await context.params;
  const inspectie = await prisma.inspectie.findFirst({
    where: {
      id: inspectieId,
      gebruikerId: gebruiker.id,
      status: { not: "VERWIJDERD" },
    },
    select: {
      id: true,
      andereOpmerkingen: true,
      _count: {
        select: {
          andereOpmerkingFotos: {
            where: { opmerkingId },
          },
        },
      },
    },
  });

  if (
    !inspectie ||
    !bevatOpmerking(
      inspectie.andereOpmerkingen,
      opmerkingId,
    )
  ) {
    return NextResponse.json(
      { fout: "Opmerking niet gevonden." },
      { status: 404 },
    );
  }

  if (
    inspectie._count.andereOpmerkingFotos >=
    MAX_FOTOS_PER_OPMERKING
  ) {
    return NextResponse.json(
      {
        fout: `Je kunt maximaal ${MAX_FOTOS_PER_OPMERKING} foto’s aan één andere opmerking koppelen.`,
      },
      { status: 409 },
    );
  }

  const formData = await request.formData();
  const bestand = formData.get("foto");

  if (
    !(bestand instanceof File) ||
    !bestand.type.startsWith("image/")
  ) {
    return NextResponse.json(
      { fout: "Ongeldig fotobestand." },
      { status: 400 },
    );
  }

  if (bestand.size > 3_000_000) {
    return NextResponse.json(
      {
        fout: "De verwerkte foto is groter dan 3 MB.",
      },
      { status: 413 },
    );
  }

  const foto = await prisma.andereOpmerkingFoto.create({
    data: {
      naam: bestand.name.slice(0, 240),
      mimeType: bestand.type,
      data: new Uint8Array(
        await bestand.arrayBuffer(),
      ),
      inspectieId,
      opmerkingId,
    },
    select: { id: true, naam: true },
  });

  return NextResponse.json({
    ...foto,
    url: `/api/opmerking-fotos/${foto.id}`,
  });
}
