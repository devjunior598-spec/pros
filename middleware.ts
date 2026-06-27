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

  // Refresh session if expired
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Public paths that never need auth
  const publicPaths = [
    '/',
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/about',
    '/contact',
    '/faq',
    '/features',
    '/landlords',
    '/privacy',
    '/terms',
  ]

  const isPublicPath = publicPaths.some(
    (p) => pathname === p || pathname.startsWith('/listings') || pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')
  )

  // Dashboard routes require authentication
  const isDashboardPath = pathname.startsWith('/dashboard') || pathname.startsWith('/messages') || pathname.startsWith('/pay-bills') || pathname.startsWith('/payments') || pathname.startsWith('/kyc') || pathname.startsWith('/applications') || pathname.startsWith('/maintenance') || pathname.startsWith('/settings') || pathname.startsWith('/earnings') || pathname.startsWith('/tenants') || pathname.startsWith('/properties') || pathname.startsWith('/verification') || pathname.startsWith('/documents') || pathname.startsWith('/receipts') || pathname.startsWith('/reports') || pathname.startsWith('/analytics') || pathname.startsWith('/wallet') || pathname.startsWith('/withdrawals') || pathname.startsWith('/reviews') || pathname.startsWith('/portfolio') || pathname.startsWith('/requests') || pathname.startsWith('/my-property') || pathname.startsWith('/history') || pathname.startsWith('/provider-dashboard') || pathname.startsWith('/payment-success')

  // Admin routes require admin role
  const isAdminPath = pathname.startsWith('/admin')

  if (!user && isDashboardPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  if (!user && isAdminPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isAdminPath) {
    // Fetch profile to check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile || profile.role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  // Redirect logged-in users away from auth pages to their dashboard
  if (user && (pathname === '/login' || pathname === '/signup')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
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
