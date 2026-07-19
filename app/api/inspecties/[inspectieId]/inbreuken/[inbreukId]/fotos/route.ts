import { NextResponse } from "next/server";

import { huidigeGebruiker } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ inspectieId: string; inbreukId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const oorsprong = request.headers.get("origin");
  if (oorsprong && oorsprong !== new URL(request.url).origin) {
    return NextResponse.json({ fout: "Ongeldige aanvraagbron." }, { status: 403 });
  }

  const gebruiker = await huidigeGebruiker();

  if (!gebruiker) {
    return NextResponse.json({ fout: "Niet aangemeld." }, { status: 401 });
  }

  const { inspectieId, inbreukId } = await context.params;
  const inbreuk = await prisma.inspectieInbreuk.findFirst({
    where: {
      id: inbreukId,
      inspectieId,
      inspectie: { gebruikerId: gebruiker.id },
    },
    select: { id: true },
  });

  if (!inbreuk) {
    return NextResponse.json({ fout: "Inbreuk niet gevonden." }, { status: 404 });
  }

  const formData = await request.formData();
  const bestand = formData.get("foto");

  if (!(bestand instanceof File) || !bestand.type.startsWith("image/")) {
    return NextResponse.json({ fout: "Ongeldig fotobestand." }, { status: 400 });
  }

  if (bestand.size > 3_000_000) {
    return NextResponse.json(
      { fout: "De verwerkte foto is groter dan 3 MB." },
      { status: 413 },
    );
  }

  const foto = await prisma.inspectieFoto.create({
    data: {
      naam: bestand.name.slice(0, 240),
      mimeType: bestand.type,
      data: new Uint8Array(await bestand.arrayBuffer()),
      inspectieInbreukId: inbreukId,
    },
    select: { id: true, naam: true },
  });

  return NextResponse.json({
    ...foto,
    url: `/api/fotos/${foto.id}`,
  });
}
