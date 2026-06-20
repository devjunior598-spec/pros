"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { PropertyTable } from "@/components/landlord/property-table"
import { TenantMonitoring } from "@/components/landlord/tenant-monitoring"
import { ChatPanel } from "@/components/landlord/chat-panel"
import { LandlordMaintenanceList } from "@/components/landlord/landlord-maintenance-list"
import { LandlordApplicationsList } from "@/components/landlord/landlord-applications-list"
import { LandlordDocumentsView } from "@/components/landlord/landlord-documents-view"
import { ServiceDirectory } from "@/components/landlord/service-directory"
import { ProfileSettings } from "@/components/profile-settings"
import { NewsFeed } from "@/components/news-feed/news-feed"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DollarSign, Users, Activity, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TenantDashboard } from "@/components/tenant/tenant-dashboard"
import { SummaryCard } from "@/components/dashboard/summary-cards"
import ProviderDashboardPage from "@/app/(dashboard)/provider-dashboard/page"
import { PortfolioOverview } from "@/components/landlord/portfolio-overview"
import { useAuth } from "@/contexts/auth-context"

function DashboardContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const tabParam = searchParams.get('tab')

    const { user: ctxUser, profile: ctxProfile, loading: ctxLoading } = useAuth()
    const ctxUserId = ctxUser?.id

    const [currentTab, setCurrentTab] = useState(tabParam || 'Overview')
    const [userId, setUserId] = useState<string | null>(null)
    const [userRole, setUserRole] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [metrics, setMetrics] = useState({
        totalRevenue: 0,
        activeTenants: 0,
        newApplications: 0,
        occupancyRate: 0,
    })

    // Sync tab with URL
    useEffect(() => {
        if (tabParam && tabParam !== currentTab) {
            setCurrentTab(tabParam)
        }
    }, [tabParam])

    const handleTabChange = (tab: string) => {
        setCurrentTab(tab)
        // Optionally update URL without full refresh to keep browser history clean
        const params = new URLSearchParams(searchParams)
        params.set('tab', tab)
        router.push(`?${params.toString()}`, { scroll: false })
    }

    useEffect(() => {
        const controller = new AbortController()

        const fetchUser = async () => {
            try {
                // ── Auth from context — no getUser() / no lock contention ────
                const user  = ctxUser
                const uid   = ctxUserId
                const role  = ctxProfile?.role ?? null

                if (ctxLoading) return // Wait for context to finish loading
                
                if (!user || !uid) { 
                    setLoading(false)
                    return 
                }
                if (controller.signal.aborted) return

                setUserId(uid)
                if (role) setUserRole(role)

                if (role === 'landlord' || role === 'admin') {
                    // 1. Revenue from paid bills
                    const { data: billsData } = await supabase
                        .from('bills')
                        .select('amount_paid, rental:rentals!inner(property_id)')
                        .eq('status', 'paid')

                    // 2. Rentals & portfolio size
                    const { data: rentalsData } = await supabase
                        .from('rentals')
                        .select('status, property_id')
                        .eq('landlord_id', uid)
                        .abortSignal(controller.signal)

                    const { count: propertyCount } = await supabase
                        .from('properties')
                        .select('*', { count: 'exact', head: true })
                        .eq('landlord_id', uid)
                        .abortSignal(controller.signal)

                    if (!controller.signal.aborted) {
                        const landlordRentals = rentalsData || []
                        const activeT  = landlordRentals.filter(r => r.status === 'approved' || r.status === 'active').length
                        const newApp   = landlordRentals.filter(r => r.status === 'pending').length
                        const occupancy = propertyCount ? Math.round((activeT / propertyCount) * 100) : 0

                        const { data: paymentsData } = await supabase
                            .from('payments')
                            .select('amount, status')
                            .eq('status', 'success')
                            .abortSignal(controller.signal)

                        const revenue = paymentsData?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0

                        setMetrics({
                            totalRevenue: revenue,
                            activeTenants: activeT,
                            newApplications: newApp,
                            occupancyRate: occupancy,
                        })
                    }
                }
            } catch (error: any) {
                if (error?.name === 'AbortError' || error?.message?.includes('aborted') || error?.message?.includes('AbortError')) return
                console.error("Error fetching dashboard profile:", JSON.stringify(error, null, 2))
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false)
                }
            }
        }
        fetchUser()

        return () => {
            controller.abort()
        }
    }, [ctxLoading, ctxUser, ctxUserId, ctxProfile])

    // Loading State
    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Activity className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    // Auth/Profile Error State
    if (!userId || !userRole) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 p-4 text-center">
                <h2 className="text-xl font-semibold text-red-600">Unable to load profile</h2>
                <p className="text-muted-foreground">We couldn't retrieve your user profile.</p>

                <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-md text-left text-xs font-mono max-w-lg w-full overflow-auto">
                    <p><strong>Debug Info:</strong></p>
                    <p>User ID: {userId || 'None (Not Logged In)'}</p>
                    <p>User Role: {userRole || 'None (Fetch Failed)'}</p>
                    <p>Loading: {loading.toString()}</p>
                    <div className="mt-2 text-gray-500">
                        Top Potential Causes:
                        <ul className="list-disc ml-4">
                            <li>Row Level Security (RLS) policies blocking access (Run SQL Fix).</li>
                            <li>Session expired (Try logging out and in).</li>
                            <li>Profile record missing in database.</li>
                        </ul>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button onClick={() => window.location.reload()}>Retry</Button>
                    <Button variant="outline" onClick={() => supabase.auth.signOut().then(() => router.push('/login'))}>
                        Log Out & Login
                    </Button>
                </div>
            </div>
        )
    }

    if (userRole === 'service_provider') {
        return <ProviderDashboardPage />
    }

    if (userRole === 'tenant') {
        return <TenantDashboard userId={userId} />
    }

    // Default to Landlord View
    const renderLandlordContent = () => {
        return (
            <div className="space-y-8 pb-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-3xl font-bold tracking-tight">Landlord Overview</h1>
                        <p className="text-muted-foreground">Manage your properties and stay on top of tenant requests.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <Link href="/properties">
                            <Button variant="outline">View Properties</Button>
                        </Link>
                        <Link href="/properties/new">
                            <Button className="bg-blue-600 hover:bg-blue-700">Post New Property</Button>
                        </Link>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <SummaryCard
                        title="Total Revenue"
                        value={`₦${metrics.totalRevenue.toLocaleString()}`}
                        description="All time"
                        icon={DollarSign}
                        iconClassName="text-blue-600"
                    />
                    <SummaryCard
                        title="Active Tenants"
                        value={metrics.activeTenants.toString()}
                        description="Currently renting"
                        icon={Users}
                        iconClassName="text-purple-600"
                    />
                    <SummaryCard
                        title="New Applications"
                        value={metrics.newApplications.toString()}
                        description="Pending review"
                        icon={Activity}
                        iconClassName="text-orange-600"
                    />
                    <SummaryCard
                        title="Occupancy Rate"
                        value={`${metrics.occupancyRate}%`}
                        description="Portfolio utilization"
                        icon={CreditCard}
                        iconClassName="text-green-600"
                    />
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                    <Card className="lg:col-span-4 border-none shadow-sm bg-white dark:bg-gray-950">
                        <CardHeader>
                            <CardTitle>Recent Maintenance</CardTitle>
                            <CardDescription>Latest repair requests from your properties.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <LandlordMaintenanceList landlordId={userId} limit={3} />
                                <div className="pt-2 text-center">
                                    <Link href="/maintenance">
                                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">View All Maintenance</Button>
                                    </Link>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="lg:col-span-3 border-none shadow-sm bg-white dark:bg-gray-950">
                        <CardHeader>
                            <CardTitle>Portfolio Overview</CardTitle>
                            <CardDescription>Performance of your properties.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <PortfolioOverview landlordId={userId} />
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-1">
                    <Card className="border-none shadow-sm bg-white dark:bg-gray-950 overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle>Latest News</CardTitle>
                                <CardDescription>Stay updated with PRMS announcements.</CardDescription>
                            </div>
                            <Link href="/news">
                                <Button variant="ghost" size="sm" className="text-blue-600">Explore Feed</Button>
                            </Link>
                        </CardHeader>
                        <CardContent className="p-0">
                            <NewsFeed userId={userId} limit={2} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="flex-1">
            <div className="p-8 pt-6">
                {renderLandlordContent()}
            </div>
        </div>
    )
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-12"><Activity className="h-8 w-8 animate-spin text-blue-600" /></div>}>
            <DashboardContent />
        </Suspense>
    )
}
