import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// In-memory rate limiter (per-worker; resets on cold start — sufficient for
// basic abuse prevention on a low-traffic CRM).
// ---------------------------------------------------------------------------
interface RLEntry { count: number; resetAt: number }
const rlStore = new Map<string, RLEntry>()

function isRateLimited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = rlStore.get(key)
  if (!entry || now > entry.resetAt) {
    rlStore.set(key, { count: 1, resetAt: now + windowMs })
    return false
  }
  if (entry.count >= max) return true
  entry.count++
  return false
}

// Prevent unbounded Map growth (cap at 5 000 IPs per worker).
function maybeEvict() {
  if (rlStore.size > 5_000) {
    const now = Date.now()
    for (const [k, v] of rlStore) {
      if (now > v.resetAt) rlStore.delete(k)
    }
  }
}

function getIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  )
}

// ---------------------------------------------------------------------------
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register')
  const isApiRoute = pathname.startsWith('/api/')

  const ip = getIp(request)
  maybeEvict()

  // Auth pages: max 20 requests / minute / IP (protects login form from scrapers)
  if (isAuthPage) {
    if (isRateLimited(`auth:${ip}`, 20, 60_000)) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: { 'Retry-After': '60', 'Content-Type': 'text/plain' },
      })
    }
  }

  // API routes: max 30 writes / 60 reads per minute / IP
  if (isApiRoute) {
    const isWrite = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)
    const max = isWrite ? 30 : 60
    const bucket = isWrite ? 'w' : 'r'
    if (isRateLimited(`api:${ip}:${bucket}`, max, 60_000)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again in a minute.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    }
  }

  // ---------------------------------------------------------------------------
  // Supabase auth session refresh
  // ---------------------------------------------------------------------------
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user && !isAuthPage && !isApiRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }
  if (user && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/leads'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
