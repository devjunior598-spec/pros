"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Search, User, ShieldCheck } from "lucide-react"

import { MobileNav } from "@/components/mobile-nav"
import { Logo } from "@/components/logo"
import { NotificationBell } from "@/components/notification-manager"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

interface SiteHeaderProps {
    hideNav?: boolean
}

export function SiteHeader({ hideNav = false }: SiteHeaderProps) {
    const pathname = usePathname()
    const isDashboard = pathname.startsWith('/dashboard') ||
        pathname.startsWith('/properties') ||
        pathname.startsWith('/tenants') ||
        pathname.startsWith('/earnings') ||
        pathname.startsWith('/wallet') ||
        pathname.startsWith('/messages') ||
        pathname.startsWith('/settings') ||
        pathname.startsWith('/kyc') ||
        pathname.startsWith('/my-property') ||
        pathname.startsWith('/pay-bills') ||
        pathname.startsWith('/requests') ||
        pathname.startsWith('/history') ||
        pathname.startsWith('/notifications') ||
        pathname.startsWith('/reports') ||
        pathname.startsWith('/withdrawals') ||
        pathname.startsWith('/admin')

    const [profile, setProfile] = useState<any>(null)

    useEffect(() => {
        const controller = new AbortController()

        const fetchProfile = async () => {
            try {
                const { data: { user }, error: authError } = await supabase.auth.getUser()
                if (authError) throw authError

                if (user) {
                    const { data, error: profileError } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', user.id)
                        .maybeSingle()

                    if (profileError) throw profileError
                    if (!controller.signal.aborted) {
                        setProfile(data)
                    }
                }
            } catch (error: any) {
                if (error?.name === 'AbortError' || error?.message?.includes('aborted') || error?.message?.includes('AbortError')) return
                if (error.name === 'AuthSessionMissingError') return
                console.error("Error fetching profile:", JSON.stringify(error, null, 2))
            }
        }
        fetchProfile()

        const channel = supabase
            .channel('profile_updates')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
                if (profile && payload.new.id === profile.id) {
                    setProfile(payload.new)
                }
            })
            .subscribe()

        return () => {
            controller.abort()
            supabase.removeChannel(channel)
        }
    }, [profile?.id])

    return (
        <header className={cn(
            "sticky top-0 z-50 w-full border-b border-border bg-white transition-colors",
            !isDashboard && "bg-prms-navy text-white border-prms-navy"
        )}>
            <div className="flex h-16 items-center justify-between px-4 md:px-6">

                {/* ── Left: hamburger + logo / search ── */}
                <div className="flex items-center gap-3 min-w-0">
                    <MobileNav userRole={profile?.role} isVerified={profile?.is_verified} profile={profile} />

                    {!isDashboard && (
                        <Logo dark className="shrink-0" />
                    )}

                    {isDashboard && (
                        <div className="hidden md:flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-4 py-2 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="bg-transparent border-none outline-none text-sm w-48 lg:w-64 text-foreground"
                            />
                        </div>
                    )}
                </div>

                {/* ── Right: bell + avatar (always flex items-center gap-3) ── */}
                {!hideNav && (
                    <div className="flex items-center gap-3 shrink-0">

                        {/* Admin link */}
                        {(profile?.role === 'admin' || profile?.email === 'admin@example.com') && (
                            <Link href="/admin/kyc">
                                <button className={cn(
                                    "hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                                    isDashboard
                                        ? "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                        : "text-white/80 hover:bg-white/10 hover:text-white"
                                )}>
                                    <ShieldCheck className="h-4 w-4" />
                                    Admin
                                </button>
                            </Link>
                        )}

                        {/* Dashboard link (public pages only) */}
                        {!isDashboard && profile && (
                            <Link href="/dashboard">
                                <button className="text-white/80 hover:bg-white/10 hover:text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
                                    Dashboard
                                </button>
                            </Link>
                        )}

                        {/* Notification bell — inline, vertically centred by parent flex */}
                        {isDashboard && <NotificationBell />}

                        {/* Avatar / auth buttons */}
                        {profile ? (
                            <Link href="/settings" className="flex items-center gap-2 group">
                                <div className="hidden sm:flex flex-col items-end">
                                    <span className={cn(
                                        "text-sm font-semibold leading-none",
                                        isDashboard ? "text-foreground" : "text-white"
                                    )}>
                                        {profile.full_name || profile.name}
                                    </span>
                                    <span className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">
                                        {profile.role}
                                    </span>
                                </div>

                                {/* Avatar circle */}
                                <div className="h-9 w-9 rounded-full overflow-hidden border-2 border-primary/20 group-hover:border-primary transition-all duration-200 flex items-center justify-center bg-secondary shrink-0">
                                    {profile.profile_image_url ? (
                                        <img
                                            src={profile.profile_image_url}
                                            alt="Profile"
                                            className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                                        />
                                    ) : (
                                        <User className="h-5 w-5 text-gray-400 group-hover:scale-110 transition-transform duration-300" />
                                    )}
                                </div>
                            </Link>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link href="/login">
                                    <button className="text-white/80 hover:bg-white/10 hover:text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
                                        Log in
                                    </button>
                                </Link>
                                <Link href="/signup">
                                    <button className="bg-primary hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
                                        Sign up
                                    </button>
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </header>
    )
}
