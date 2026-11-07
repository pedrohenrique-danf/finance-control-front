import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

const PRIVATE = ["/dashboard", "/transactions", "/categories", "/recurrences", "/import-export"];
const AUTH_PAGES = ["/login", "/register"];

/** Verificação OTIMISTA (presença do cookie). A verificação autoritativa é requireSession() no layout privado. */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSessionCookie = Boolean(getSessionCookie(request));

  if (PRIVATE.some((p) => pathname.startsWith(p)) && !hasSessionCookie) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (AUTH_PAGES.includes(pathname) && hasSessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/transactions/:path*",
    "/categories/:path*",
    "/recurrences/:path*",
    "/import-export/:path*",
    "/login",
    "/register",
  ],
};
