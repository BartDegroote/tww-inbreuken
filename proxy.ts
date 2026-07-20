import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const pad = request.nextUrl.pathname;

  /*
   * Laat Server Actions zelf de sessie controleren.
   * Een redirect vanuit de proxy levert bij zo'n POST-verzoek
   * geen geldig React Server Components-antwoord op, waardoor
   * de browser alleen "An unexpected response..." toont.
   * `vereisGebruiker()` zorgt in de action voor de correcte
   * doorverwijzing naar de aanmeldpagina.
   */
  const isServerAction =
    request.headers.has("next-action");

  if (
    pad.startsWith("/_next/") ||
    pad.startsWith("/api/") ||
    isServerAction ||
    pad === "/favicon.ico" ||
    pad === "/login" ||
    pad === "/privacy"
  ) {
    return NextResponse.next();
  }

  if (!request.cookies.has("tww_sessie")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
