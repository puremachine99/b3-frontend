import { NextResponse } from "next/server"

export function middleware(req) {
  const token =
    typeof window === "undefined"
      ? null
      : req.cookies.get("token")?.value || null

  if (!token && req.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*"],
}
