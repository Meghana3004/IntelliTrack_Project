import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { ROLE_HOME, isAppRole } from "@/lib/roles";

const PROTECTED_PREFIXES = Object.values(ROLE_HOME);

function prefixForPath(pathname: string): string | null {
  return (
    PROTECTED_PREFIXES.find(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    ) ?? null
  );
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const role = token && isAppRole(token.role) ? token.role : null;

  if (pathname === "/login") {
    if (role) {
      return NextResponse.redirect(new URL(ROLE_HOME[role], req.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(role ? ROLE_HOME[role] : "/login", req.url),
    );
  }

  const matchedPrefix = prefixForPath(pathname);
  if (matchedPrefix) {
    if (!role) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (ROLE_HOME[role] !== matchedPrefix) {
      return NextResponse.redirect(new URL(ROLE_HOME[role], req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|track).*)"],
};
