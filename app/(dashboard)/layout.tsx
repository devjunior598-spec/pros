"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { SiteHeader } from "@/components/site-header"
import { DashboardNav } from "@/components/dashboard-nav"
import { DashboardGuard } from "@/components/dashboard-guard"
import { NotificationManager } from "@/components/notification-manager"
import { BottomNav } from "@/components/bottom-nav"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Building2, ShieldCheck, CheckCircle } from "lucide-react"
import Link from "next/link"
import { ChatProvider } from "@/components/chat/chat-provider"
import { CallModal } from "@/components/chat/call-modal"
import { Logo } from "@/components/logo"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [userRole, setUserRole] = useState<string | null>(null)
    const [isVerified, setIsVerified] = useState<boolean>(false)
    const [profile, setProfile] = useState<any>(null)
    const [providerStatus, setProviderStatus] = useState<string | null>(null)

    useEffect(() => {
        const controller = new AbortController()

        const fetchUserData = async () => {
            try {
                const { data: { user }, error: authError } = await supabase.auth.getUser()
                if (authError) throw authError

                if (user && !controller.signal.aborted) {
                    const { data: profile, error: profileError } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', user.id)
                        .abortSignal(controller.signal)
                        .maybeSingle()

                    if (profileError) throw profileError

                    if (profile && !controller.signal.aborted) {
                        setUserRole(profile.role)
                        setIsVerified(profile.is_verified)
                        setProfile(profile)

                        if (profile.role === 'service_provider') {
                            const { data: provider } = await supabase
                                .from('service_providers')
                                .select('approval_status')
                                .eq('user_id', user.id)
                                .abortSignal(controller.signal)
                                .maybeSingle()

                            if (provider && !controller.signal.aborted) {
                                setProviderStatus(provider.approval_status)
                            }
                        }
                    }
                }
            } catch (error: any) {
                if (error?.name === 'AbortError' || error?.message?.includes('aborted') || error?.message?.includes('AbortError') || controller?.signal?.aborted) return
                console.error("Error fetching user data:", JSON.stringify(error, null, 2))
            }
        }
        fetchUserData()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user && !controller.signal.aborted) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .abortSignal(controller.signal)
                    .maybeSingle()

                if (profile && !controller.signal.aborted) {
                    setUserRole(profile.role)
                    setIsVerified(profile.is_verified)
                    setProfile(profile)

                    if (profile.role === 'service_provider') {
                        const { data: provider } = await supabase
                            .from('service_providers')
                            .select('approval_status')
                            .eq('user_id', session.user.id)
                            .abortSignal(controller.signal)
                            .maybeSingle()

                        if (provider && !controller.signal.aborted) {
                            setProviderStatus(provider.approval_status)
                        }
                    }
                }
            } else {
                if (!controller.signal.aborted) {
                    setUserRole(null)
                    setIsVerified(false)
                    setProfile(null)
                    setProviderStatus(null)
                }
            }
        })

        return () => {
            controller.abort()
            subscription.unsubscribe()
        }
    }, [])

    return (
        <ChatProvider>
            <DashboardGuard>
                <NotificationManager>
                <div className="flex min-h-screen bg-[#f8fafc] dark:bg-[#0f172a]">
                    <CallModal />
                    {/* Desktop Sidebar */}
                    <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 border-r border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-950 md:block shadow-[1px_0_10px_rgba(0,0,0,0.02)]">
                        <div className="flex h-16 items-center border-b px-5">
                            <Logo />
                        </div>
                        <ScrollArea className="h-[calc(100vh-64px)] px-3 py-4">
                            <div className="mb-6 px-3">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                                    {userRole === 'landlord' ? 'Landlord Dashboard' : 'Tenant Dashboard'}
                                </p>
                            </div>
                            <DashboardNav userRole={userRole} isVerified={isVerified} />
                        </ScrollArea>
                    </aside>

                    {/* Main Content Area */}
                    <div className="flex flex-1 flex-col md:pl-64">
                        <SiteHeader />
                        <main className="flex-1 px-3 py-4 md:p-8 pb-24 md:pb-12 max-w-7xl mx-auto w-full">
                            {userRole === 'service_provider' && providerStatus === 'pending' ? (
                                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-2xl mx-auto space-y-6">
                                    <div className="h-24 w-24 rounded-full bg-blue-50 flex items-center justify-center animate-pulse">
                                        <ShieldCheck className="h-12 w-12 text-blue-600" />
                                    </div>
                                    <div className="space-y-2">
                                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Account Awaiting Approval</h1>
                                        <p className="text-muted-foreground text-lg">
                                            Thanks for joining PRMS! Your service provider account is currently being reviewed by our team.
                                        </p>
                                    </div>
                                    <div className="p-6 bg-white border rounded-2xl shadow-sm text-left space-y-4 w-full">
                                        <h3 className="font-semibold flex items-center gap-2">
                                            <CheckCircle className="h-5 w-5 text-green-500" /> What's Next?
                                        </h3>
                                        <ul className="space-y-3 text-sm text-muted-foreground">
                                            <li className="flex gap-2">
                                                <span className="font-bold text-blue-600">1.</span>
                                                <span>We verify your uploaded documents and professional category.</span>
                                            </li>
                                            <li className="flex gap-2">
                                                <span className="font-bold text-blue-600">2.</span>
                                                <span>You'll receive an email once your account is activated.</span>
                                            </li>
                                            <li className="flex gap-2">
                                                <span className="font-bold text-blue-600">3.</span>
                                                <span>Once live, you can start bidding on available maintenance jobs.</span>
                                            </li>
                                        </ul>
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        Need help? Contact support at <span className="font-medium text-blue-600">partners@prms.ng</span>
                                    </p>
                                </div>
                            ) : (
                                children
                            )}
                        </main>
                        <BottomNav userRole={userRole} />
                    </div>
                </div>
                </NotificationManager>
            </DashboardGuard>
        </ChatProvider>
    )
}
