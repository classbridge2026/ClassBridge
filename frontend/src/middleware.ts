import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  // Legacy /admin → /institution-admin
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const target = pathname.replace(/^\/admin/, "/institution-admin");
    return NextResponse.redirect(new URL(target, request.url));
  }

  const isProtectedPath =
    pathname.startsWith("/super-admin") ||
    pathname.startsWith("/institution-admin") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/lecturer") ||
    pathname.startsWith("/student") ||
    pathname.startsWith("/class/");

  // Redirect unauthenticated user attempting to access protected route
  if (isProtectedPath && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/super-admin/:path*",
    "/institution-admin/:path*",
    "/admin/:path*",
    "/lecturer/:path*",
    "/student/:path*",
    "/class/:path*",
    "/login",
    "/forgot-password",
    "/reset-password",
  ],
};
