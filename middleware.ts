import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Security headers
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://generativelanguage.googleapis.com https://*.supabase.co",
    "connect-src 'self' https://generativelanguage.googleapis.com https://*.supabase.co wss://*.supabase.co",
    "media-src 'self' blob:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
  ].join("; ")

  response.headers.set("Content-Security-Policy", csp)
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), accelerometer=(self), gyroscope=(self)",
  )

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icon-).*)"],
}
