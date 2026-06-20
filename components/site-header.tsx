"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Building2, Search, Bell, User, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { MobileNav } from "@/components/mobile-nav"
import { NotificationsDropdown } from "@/components/notifications/notifications-dropdown"
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
            "sticky top-0 z-40 w-full border-b transition-colors",
            isDashboard
                ? "bg-white/70 dark:bg-gray-950/70 backdrop-blur-xl border-gray-200 dark:border-gray-800/60"
                : "bg-gray-900 text-white border-gray-800"
        )}>
            <div className="container flex h-16 items-center justify-between">
                <div className="flex items-center gap-4">
                    <MobileNav userRole={profile?.role} isVerified={profile?.is_verified} profile={profile} />

                    {!isDashboard && (
                        <>
                            <Link href="/" className="flex items-center space-x-2">
                                <Building2 className="h-6 w-6" />
                                <span className="font-bold text-xl inline-block">PRMS</span>
                            </Link>
                            <span className="hidden text-xs text-gray-400 md:inline-block border-l border-gray-700 pl-4">
                                JUNIOR PROPERTY TECHNOLOGIES
                            </span>
                        </>
                    )}

                    {isDashboard && (
                        <div className="hidden md:flex items-center bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-1.5 focus-within:ring-2 ring-blue-500 transition-all">
                            <Search className="h-4 w-4 text-gray-400 mr-2" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="bg-transparent border-none outline-none text-sm w-64 text-gray-900 dark:text-gray-100"
                            />
                        </div>
                    )}
                </div>

                <div className="flex items-center space-x-4">
                    {!hideNav && (
                        <nav className="flex items-center space-x-4">
                            {isDashboard && (
                                <NotificationsDropdown />
                            )}

                            {!isDashboard && profile && (
                                <Link href="/dashboard">
                                    <Button variant="ghost" size="sm" className="text-white hover:bg-gray-800">
                                        Dashboard
                                    </Button>
                                </Link>
                            )}

                            {(profile?.role === 'admin' || profile?.email === 'admin@example.com') && (
                                <Link href="/admin/kyc">
                                    <Button variant="ghost" size="sm" className={cn(isDashboard ? "text-gray-700" : "text-white", "hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-1")}>
                                        <ShieldCheck className="h-4 w-4" />
                                        Admin
                                    </Button>
                                </Link>
                            )}

                            {profile ? (
                                <Link href="/settings" className="flex items-center gap-3 group">
                                    <div className="hidden sm:flex flex-col items-end mr-1">
                                        <span className={cn("text-sm font-semibold leading-none", isDashboard ? "text-gray-900 dark:text-gray-100" : "text-white")}>
                                            {profile.full_name || profile.name}
                                        </span>
                                        <span className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">
                                            {profile.role}
                                        </span>
                                    </div>
                                    <div className="h-9 w-9 rounded-full overflow-hidden border-2 border-blue-500/20 group-hover:border-blue-500 group-hover:shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-300 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                                        {profile.profile_image_url ? (
                                            <img src={profile.profile_image_url} alt="Profile" className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                        ) : (
                                            <User className={cn("h-5 w-5 group-hover:scale-110 transition-transform duration-300", isDashboard ? "text-gray-400" : "text-gray-400")} />
                                        )}
                                    </div>
                                </Link>
                            ) : (
                                <>
                                    <Link href="/login">
                                        <Button variant="ghost" size="sm" className="text-white hover:bg-gray-800">
                                            Log in
                                        </Button>
                                    </Link>
                                    <Link href="/signup">
                                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                                            Sign up
                                        </Button>
                                    </Link>
                                </>
                            )}
                        </nav>
                    )}
                </div>
            </div>
        </header>
    )
}
