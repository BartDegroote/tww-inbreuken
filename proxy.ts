import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const pad = request.nextUrl.pathname;

  if (
    pad.startsWith("/_next/") ||
    pad.startsWith("/api/") ||
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
