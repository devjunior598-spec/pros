import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
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

  // Verify the cookie-backed access token locally against Supabase's ES256
  // signing key. Unlike getUser(), this does not make every navigation depend
  // on a remote Auth request once the public signing key is cached.
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims.sub ?? null

  const { pathname } = request.nextUrl

  // Dashboard routes require authentication
  const isDashboardPath = pathname.startsWith('/dashboard') || pathname.startsWith('/messages') || pathname.startsWith('/pay-bills') || pathname.startsWith('/payments') || pathname.startsWith('/kyc') || pathname.startsWith('/applications') || pathname.startsWith('/maintenance') || pathname.startsWith('/settings') || pathname.startsWith('/earnings') || pathname.startsWith('/tenants') || pathname.startsWith('/properties') || pathname.startsWith('/verification') || pathname.startsWith('/documents') || pathname.startsWith('/receipts') || pathname.startsWith('/reports') || pathname.startsWith('/analytics') || pathname.startsWith('/wallet') || pathname.startsWith('/withdrawals') || pathname.startsWith('/reviews') || pathname.startsWith('/portfolio') || pathname.startsWith('/requests') || pathname.startsWith('/my-property') || pathname.startsWith('/history') || pathname.startsWith('/provider-dashboard') || pathname.startsWith('/payment-success')

  // Admin routes require admin role
  const isAdminPath = pathname.startsWith('/admin')

  if (!userId && isDashboardPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  if (!userId && isAdminPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (userId && isAdminPath) {
    // Fetch profile to check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle()

    if (!profile || profile.role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  // Redirect logged-in users away from auth pages to their dashboard
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
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
