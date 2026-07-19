import { huidigeGebruiker } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ fotoId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const gebruiker = await huidigeGebruiker();

  if (!gebruiker) {
    return new Response("Niet aangemeld.", { status: 401 });
  }

  const { fotoId } = await context.params;
  const foto = await prisma.inspectieFoto.findFirst({
    where: {
      id: fotoId,
      inspectieInbreuk: {
        inspectie: { gebruikerId: gebruiker.id },
      },
    },
  });

  if (!foto) {
    return new Response("Foto niet gevonden.", { status: 404 });
  }

  return new Response(foto.data, {
    headers: {
      "Content-Type": foto.mimeType,
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(foto.naam)}`,
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
