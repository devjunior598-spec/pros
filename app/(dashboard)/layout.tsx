"use client"

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
import { useAuth } from "@/contexts/auth-context"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { profile, providerStatus } = useAuth()
    const userRole = profile?.role ?? null
    const isVerified = profile?.is_verified ?? false

    return (
        <ChatProvider>
            <DashboardGuard>
                <NotificationManager>
                <div className="flex min-h-screen bg-[#f7f9fc]">
                    <CallModal />
                    {/* Desktop Sidebar */}
                    <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 border-r border-border bg-white/95 shadow-[10px_0_32px_-28px_rgba(15,23,42,0.45)] backdrop-blur-xl md:block">
                        <div className="flex h-16 items-center border-b border-border px-5">
                            <Logo />
                        </div>
                        <ScrollArea className="h-[calc(100vh-64px)] px-3 py-4">
                            <div className="mb-4 px-3">
                                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                    {userRole === 'landlord' ? 'Landlord Dashboard' : userRole === 'tenant' ? 'Tenant Dashboard' : 'Dashboard'}
                                </p>
                            </div>
                            <DashboardNav userRole={userRole} isVerified={isVerified} />
                        </ScrollArea>
                    </aside>

                    {/* Main Content Area */}
                    <div className="flex flex-1 flex-col md:pl-64">
                        <SiteHeader />
                        <main className="relative flex-1 px-3 py-4 pb-24 md:mx-auto md:w-full md:max-w-7xl md:p-8 md:pb-12">
                            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-56 bg-gradient-to-b from-blue-50/70 to-transparent" />
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
                                        Need help? Open a support ticket from your account.
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
