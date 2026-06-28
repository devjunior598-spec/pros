"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Activity, DollarSign, Users, Activity as ActivityIcon, Building2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

// Landlord UI Components
import { DashboardHero } from "@/components/landlord/dashboard-hero"
import { QuickActions } from "@/components/landlord/quick-actions"
import { StatCard } from "@/components/landlord/stat-card"
import { PerformanceCharts } from "@/components/landlord/performance-charts"
import { ActivityFeed } from "@/components/landlord/activity-feed"
import { LandlordMaintenanceList } from "@/components/landlord/landlord-maintenance-list"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

function LandlordDashboardContent() {
    const router = useRouter()
    const { user: ctxUser, profile: ctxProfile, loading: ctxLoading } = useAuth()
    const ctxUserId = ctxUser?.id

    const [userId, setUserId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [metrics, setMetrics] = useState({
        totalRevenue: 0,
        properties: 0,
        activeTenants: 0,
        newApplications: 0,
        occupancyRate: 0,
    })

    useEffect(() => {
        if (ctxLoading) return

        if (!ctxUser || ctxProfile?.role !== "landlord") {
            router.replace("/login")
            return
        }

        const controller = new AbortController()
        setUserId(ctxUserId ?? null)

        const fetchMetrics = async () => {
            try {
                // 1. Rentals & portfolio size
                const { data: rentalsData } = await supabase
                    .from('rentals')
                    .select('status, property_id')
                    .eq('landlord_id', ctxUserId)
                    .abortSignal(controller.signal)

                const { count: propertyCount } = await supabase
                    .from('properties')
                    .select('*', { count: 'exact', head: true })
                    .eq('landlord_id', ctxUserId)
                    .abortSignal(controller.signal)

                if (!controller.signal.aborted) {
                    const landlordRentals = rentalsData || []
                    const activeT = landlordRentals.filter(r => r.status === 'approved' || r.status === 'active').length
                    const newApp = landlordRentals.filter(r => r.status === 'pending').length
                    const occupancy = propertyCount ? Math.round((activeT / propertyCount) * 100) : 0

                    const { data: paymentsData } = await supabase
                        .from('payments')
                        .select('amount, status')
                        .eq('status', 'success')
                        .abortSignal(controller.signal)

                    const revenue = paymentsData?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0

                    setMetrics({
                        totalRevenue: revenue,
                        properties: propertyCount || 0,
                        activeTenants: activeT,
                        newApplications: newApp,
                        occupancyRate: occupancy,
                    })
                }
            } catch (error: any) {
                if (error?.name === 'AbortError' || error?.message?.includes('aborted')) return
                console.error("Error fetching dashboard metrics:", error)
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false)
                }
            }
        }

        fetchMetrics()

        return () => controller.abort()
    }, [ctxLoading, ctxUser, ctxUserId, ctxProfile, router])

    if (ctxLoading || loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Activity className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    if (!userId) return null

    return (
        <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-20 md:pb-10">
            {/* Hero Section */}
            <DashboardHero 
                name={ctxProfile?.full_name || ctxProfile?.first_name || "Landlord"} 
                isVerified={ctxProfile?.is_verified}
                metrics={metrics}
            />

            {/* Quick Actions */}
            <div className="space-y-3">
                <h2 className="text-lg font-semibold tracking-tight px-1">Quick Actions</h2>
                <QuickActions />
            </div>

            {/* Stats Cards */}
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

            {/* Performance Charts & Activity Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <PerformanceCharts />
                </div>
                <div className="lg:col-span-1 h-[300px] lg:h-auto">
                    <ActivityFeed />
                </div>
            </div>

            {/* Recent Maintenance */}
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

export default function LandlordDashboardPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-12"><Activity className="h-8 w-8 animate-spin text-blue-600" /></div>}>
            <LandlordDashboardContent />
        </Suspense>
    )
}
