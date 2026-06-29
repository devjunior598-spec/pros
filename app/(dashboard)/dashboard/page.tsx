"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Activity, DollarSign, Users, Activity as ActivityIcon, CreditCard, Building2, CalendarCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

import { TenantDashboard } from "@/components/tenant/tenant-dashboard"
import ProviderDashboardPage from "@/app/(dashboard)/provider-dashboard/page"
import { useAuth } from "@/contexts/auth-context"

// New Landlord UI Components
import { DashboardHero } from "@/components/landlord/dashboard-hero"
import { QuickActions } from "@/components/landlord/quick-actions"
import { StatCard } from "@/components/landlord/stat-card"
import { PerformanceCharts } from "@/components/landlord/performance-charts"
import { ActivityFeed } from "@/components/landlord/activity-feed"

// Old components (still used for some sections if needed, but we'll try to rely on new ones)
import { LandlordMaintenanceList } from "@/components/landlord/landlord-maintenance-list"
import { PropertyTable } from "@/components/landlord/property-table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

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
        properties: 0,
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

    useEffect(() => {
        let mounted = true

        const fetchUser = async () => {
            try {
                const user  = ctxUser
                const uid   = ctxUserId
                const role  = ctxProfile?.role ?? null

                if (ctxLoading) return 
                
                if (!user || !uid) { 
                    setLoading(false)
                    return 
                }
                if (!mounted) return

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

                    const { count: propertyCount } = await supabase
                        .from('properties')
                        .select('*', { count: 'exact', head: true })
                        .eq('landlord_id', uid)

                    if (mounted) {
                        const landlordRentals = rentalsData || []
                        const activeT  = landlordRentals.filter(r => r.status === 'approved' || r.status === 'active').length
                        const newApp   = landlordRentals.filter(r => r.status === 'pending').length
                        const occupancy = propertyCount ? Math.round((activeT / propertyCount) * 100) : 0

                        const { data: paymentsData } = await supabase
                            .from('payments')
                            .select('amount, status')
                            .eq('status', 'success')

                        const revenue = paymentsData?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0

                        setMetrics({
                            totalRevenue: revenue,
                            properties: propertyCount || 0,
                            activeTenants: activeT,
                            newApplications: newApp,
                            occupancyRate: occupancy,
                        })
                    }
                }
            } catch (error: any) {
                if (!mounted) return
                console.error("Error fetching dashboard profile:", error)
            } finally {
                if (mounted) {
                    setLoading(false)
                }
            }
        }
        fetchUser()

        return () => { mounted = false }
    }, [ctxLoading, ctxUser, ctxUserId, ctxProfile])

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Activity className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    if (!userId || !userRole) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 p-4 text-center">
                <h2 className="text-xl font-semibold text-red-600">Unable to load profile</h2>
                <p className="text-muted-foreground">We couldn't retrieve your user profile.</p>
                <div className="flex gap-2">
                    <Button onClick={() => window.location.reload()}>Retry</Button>
                    <Button variant="outline" onClick={() => supabase.auth.signOut().then(() => router.push('/login'))}>
                        Log Out & Login
                    </Button>
                </div>
            </div>
        )
    }

    if (userRole === 'service_provider') return <ProviderDashboardPage />
    if (userRole === 'tenant') return <TenantDashboard userId={userId} />

    const renderLandlordContent = () => {
        return (
            <div className="space-y-8 pb-20 md:pb-10 max-w-7xl mx-auto">
                
                {/* 1. Hero Section */}
                <DashboardHero 
                    name={ctxProfile?.full_name || ctxProfile?.first_name || "Landlord"} 
                    isVerified={ctxProfile?.is_verified}
                    metrics={metrics}
                />

                {/* 2. Quick Actions */}
                <div className="space-y-3">
                    <h2 className="text-lg font-semibold tracking-tight px-1">Quick Actions</h2>
                    <QuickActions />
                </div>

                {/* 3. Modern Stats Cards */}
                <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Total Revenue"
                        value={`₦${metrics.totalRevenue.toLocaleString()}`}
                        description="vs last month"
                        icon={DollarSign}
                        iconClassName="text-blue-600 dark:text-blue-400"
                        trend="up"
                        trendValue="+12.5%"
                        delay={0.1}
                    />
                    <StatCard
                        title="Active Tenants"
                        value={metrics.activeTenants.toString()}
                        description="vs last month"
                        icon={Users}
                        iconClassName="text-purple-600 dark:text-purple-400"
                        trend="up"
                        trendValue="+2"
                        delay={0.2}
                    />
                    <StatCard
                        title="Pending Applications"
                        value={metrics.newApplications.toString()}
                        description="Requires review"
                        icon={ActivityIcon}
                        iconClassName="text-orange-600 dark:text-orange-400"
                        trend={metrics.newApplications > 0 ? "up" : "neutral"}
                        trendValue={metrics.newApplications > 0 ? `${metrics.newApplications} new` : ""}
                        delay={0.3}
                    />
                    <StatCard
                        title="Occupancy Rate"
                        value={`${metrics.occupancyRate}%`}
                        description="Portfolio utilization"
                        icon={Building2}
                        iconClassName="text-emerald-600 dark:text-emerald-400"
                        trend="neutral"
                        delay={0.4}
                    />
                </div>

                {/* 4. Performance Charts & Activity Feed */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <PerformanceCharts />
                    </div>
                    <div className="lg:col-span-1 h-[300px] lg:h-auto">
                        <ActivityFeed />
                    </div>
                </div>

                {/* 5. Recent Maintenance */}
                <Card className="border shadow-sm bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle>Recent Maintenance Requests</CardTitle>
                        <CardDescription>Latest repair requests from your properties.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <LandlordMaintenanceList landlordId={userId} limit={5} />
                    </CardContent>
                </Card>

            </div>
        )
    }

    return (
        <div className="flex-1">
            <div className="p-4 md:p-8">
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
