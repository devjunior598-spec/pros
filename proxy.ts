import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getClientIp, rateLimit } from '@/lib/rate-limit'


const RETIRED_PAYMENT_WEBHOOKS = new Set([
  '/api/payments/webhook',
  '/api/webhook',
  '/api/webhooks/paystack',
  '/api/paystack/webhook',
  '/api/paystack/transfer-webhook',
])

const US_PAYMENT_ROUTES = new Set([
  '/api/payments/initiate',
  '/api/payments/initialize',
  '/api/payments/verify',
  '/api/payments/refund',
  '/api/payments/bank-transfer',
  '/api/payments/approve-transfer',
  '/api/initiate-payment',
  '/api/verify-payment',
  '/api/landlord/bank/verify',
  '/api/landlord/withdraw',
  '/api/landlord/maintenance/pay',
  '/api/admin/withdrawals/process',
  '/api/wallet/create',
])

function isTrustedApiOrigin(request: NextRequest) {
  const origin = request.headers.get('origin')
  if (!origin) return true
  if (origin === request.nextUrl.origin) return true

  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL
    return Boolean(siteUrl && origin === new URL(siteUrl).origin)
  } catch {
    return false
  }
}

const isWriteMethod = (method: string) => !['GET', 'HEAD', 'OPTIONS'].includes(method)

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (RETIRED_PAYMENT_WEBHOOKS.has(pathname)) {
    return NextResponse.json({ message: "This legacy payment integration has been retired." }, { status: 410 })
  }
  if (US_PAYMENT_ROUTES.has(pathname) || pathname.startsWith('/api/wallet/auto-refill/')) {
    return NextResponse.json({ error: "U.S. payment and payout processing is not configured. No payment was taken." }, { status: 503 })
  }
  if (["/login", "/provider-login", "/signup", "/reset-password"].includes(pathname) && request.nextUrl.searchParams.has("code")) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/callback"
    url.search = ""
    url.searchParams.set("code", request.nextUrl.searchParams.get("code")!)
    url.searchParams.set("next", pathname === "/reset-password" ? "/reset-password" : pathname === "/provider-login" ? "/provider-onboarding" : "/dashboard")
    const response = NextResponse.redirect(url)
    response.headers.set("Cache-Control", "private, no-store")
    response.headers.set("Referrer-Policy", "no-referrer")
    return response
  }
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const withAuthCookies = (response: NextResponse) => {
    supabaseResponse.cookies.getAll().forEach(cookie => response.cookies.set(cookie))
    response.headers.set("Cache-Control", "private, no-store")
    return response
  }
  let claimsData: Awaited<ReturnType<typeof supabase.auth.getClaims>>["data"] = null
  try {
    const result = await supabase.auth.getClaims()
    if (result.error && (result.error.name === "AuthRetryableFetchError" || (result.error.status ?? 0) >= 500)) throw result.error
    claimsData = result.data
  } catch {
    return withAuthCookies(NextResponse.json({ error: "Unable to verify your session. Please check your connection and retry." }, { status: 503 }))
  }
  const userId = claimsData?.claims.sub ?? null

  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/cron/')) {
    const writeRequest = isWriteMethod(request.method)
    const ip = getClientIp(request)
    const limit = writeRequest ? 60 : 180
    const { success, remaining, resetInMs } = await rateLimit(
      `api:${ip}:${request.method}:${pathname}`,
      { limit, windowMs: 60_000 }
    )

    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'Cache-Control': 'no-store',
            'Retry-After': String(Math.ceil(resetInMs / 1000)),
            'X-RateLimit-Remaining': String(remaining),
          },
        }
      )
    }

    if (writeRequest && !isTrustedApiOrigin(request)) {
      return NextResponse.json({ error: 'Forbidden origin' }, { status: 403 })
    }

    const contentLength = Number(request.headers.get('content-length') || 0)
    if (writeRequest && request.headers.get('content-type')?.includes('application/json') && contentLength > 1_000_000) {
      return NextResponse.json({ error: 'Request body too large' }, { status: 413 })
    }
  }

  const isDashboardPath = pathname.startsWith('/dashboard') || pathname.startsWith('/messages') || pathname.startsWith('/pay-bills') || pathname.startsWith('/payments') || pathname.startsWith('/kyc') || pathname.startsWith('/applications') || pathname.startsWith('/maintenance') || pathname.startsWith('/settings') || pathname.startsWith('/earnings') || pathname.startsWith('/tenants') || pathname.startsWith('/properties') || pathname.startsWith('/verification') || pathname.startsWith('/documents') || pathname.startsWith('/receipts') || pathname.startsWith('/reports') || pathname.startsWith('/analytics') || pathname.startsWith('/wallet') || pathname.startsWith('/withdrawals') || pathname.startsWith('/reviews') || pathname.startsWith('/portfolio') || pathname.startsWith('/requests') || pathname.startsWith('/my-property') || pathname.startsWith('/history') || pathname.startsWith('/provider-dashboard') || pathname.startsWith('/payment-success') || pathname.startsWith('/service-provider')

  const isAdminPath = pathname.startsWith('/admin')

  if (!userId && isDashboardPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return withAuthCookies(NextResponse.redirect(url))
  }

  if (!userId && isAdminPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return withAuthCookies(NextResponse.redirect(url))
  }

  if (userId && isAdminPath) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) return withAuthCookies(NextResponse.json({ error: 'Unable to verify administrator session. Please retry.' }, { status: 503 }))
    const aal = claimsData?.claims.aal
    if (!profile || profile.role !== 'admin' || !user?.email_confirmed_at || aal !== 'aal2') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return withAuthCookies(NextResponse.redirect(url))
    }
  }

  if (userId && (pathname === '/login' || pathname === '/signup')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle()

    const role = profile?.role
    let redirectPath = '/dashboard'
    if (role === 'admin') redirectPath = '/admin/dashboard'

    const url = request.nextUrl.clone()
    url.pathname = redirectPath
    return withAuthCookies(NextResponse.redirect(url))
  }

  if (userId) supabaseResponse.headers.set("Cache-Control", "private, no-store")
  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
