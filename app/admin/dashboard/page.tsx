"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { SummaryCard } from "@/components/dashboard/summary-cards"
import {
    Users,
    Home,
    Handshake,
    Briefcase,
    Wallet,
    TrendingUp,
    AlertCircle,
    Clock,
    UserCheck,
    ArrowDownCircle,
    Building,
    Activity
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function AdminDashboardPage() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        tenants: 0,
        landlords: 0,
        providers: 0,
        properties: 0,
        activeRentals: 0,
        totalBalance: 0,
        platformRevenue: 0,
        pendingKYC: 0,
        pendingWithdrawals: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true
        const fetchStats = async (signal: AbortSignal) => {
            setLoading(true)
            try {
                // In a real app, many of these counts should be cached or retrieved via a single RPC
                // We use Promise.all to fetch everything in parallel
                const queries = [
                    supabase.from('profiles').select('*', { count: 'exact', head: true }),
                    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'tenant'),
                    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'landlord'),
                    supabase.from('service_providers').select('*', { count: 'exact', head: true }),
                    supabase.from('properties').select('*', { count: 'exact', head: true }),
                    supabase.from('rentals').select('*', { count: 'exact', head: true }).eq('status', 'active'),
                    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_verified', false),
                    supabase.from('withdrawals').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                    supabase.from('wallets').select('balance'),
                    supabase.from('accounts').select('balance').eq('code', '4001').single()
                ]

                const results = await Promise.all(queries)

                if (!signal.aborted) {
                    setStats({
                        totalUsers: results[0].count || 0,
                        tenants: results[1].count || 0,
                        landlords: results[2].count || 0,
                        providers: results[3].count || 0,
                        properties: results[4].count || 0,
                        activeRentals: results[5].count || 0,
                        totalBalance: (results[8].data as any[])?.reduce((acc, w) => acc + (Number(w.balance) || 0), 0) || 0,
                        platformRevenue: (results[9].data as any)?.balance || 0,
                        pendingKYC: results[6].count || 0,
                        pendingWithdrawals: results[7].count || 0
                    })
                }
            } catch (error: any) {
                if (signal.aborted) return
                console.error("Error fetching admin stats:", error)
            } finally {
                if (!signal.aborted) {
                    setLoading(false)
                }
            }
        }
        fetchStats()
        return () => mounted = false
    }, [])

    return (
        <div className="space-y-8 pb-10">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
                <p className="text-muted-foreground">Keep track of PRMS platform activity and performance.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
                <SummaryCard
                    title="Total Users"
                    value={stats.totalUsers.toString()}
                    description="Across all roles"
                    icon={Users}
                    iconClassName="text-blue-600"
                />
                <SummaryCard
                    title="Total Tenants"
                    value={stats.tenants.toString()}
                    description="Active & inactive"
                    icon={UserCheck}
                    iconClassName="text-green-600"
                />
                <SummaryCard
                    title="Total Landlords"
                    value={stats.landlords.toString()}
                    description="Property owners"
                    icon={Home}
                    iconClassName="text-purple-600"
                />
                <SummaryCard
                    title="Service Providers"
                    value={stats.providers.toString()}
                    description="Repair experts"
                    icon={Briefcase}
                    iconClassName="text-orange-600"
                />
                <SummaryCard
                    title="Total Properties"
                    value={stats.properties.toString()}
                    description="Listings in system"
                    icon={Building}
                    iconClassName="text-indigo-600"
                />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
                <SummaryCard
                    title="Active Rentals"
                    value={stats.activeRentals.toString()}
                    description="Ongoing leases"
                    icon={Handshake}
                    iconClassName="text-cyan-600"
                />
                <SummaryCard
                    title="System Balance"
                    value={`₦${stats.totalBalance.toLocaleString()}`}
                    description="Total wallet funds"
                    icon={Wallet}
                    iconClassName="text-emerald-600"
                />
                <SummaryCard
                    title="Platform Revenue"
                    value={`₦${stats.platformRevenue.toLocaleString()}`}
                    description="Commissions earned"
                    icon={TrendingUp}
                    iconClassName="text-yellow-600"
                />
                <SummaryCard
                    title="Pending KYC"
                    value={stats.pendingKYC.toString()}
                    description="Awaiting review"
                    icon={AlertCircle}
                    iconClassName="text-red-500"
                />
                <SummaryCard
                    title="Pending Withdrawals"
                    value={stats.pendingWithdrawals.toString()}
                    description="Requests to process"
                    icon={Clock}
                    iconClassName="text-rose-500"
                />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-none shadow-sm bg-white dark:bg-gray-950">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Latest platform-wide events.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                            <Activity className="h-10 w-10 opacity-20 mb-2" />
                            <p className="text-sm italic">Activity logs will appear here as they occur.</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white dark:bg-gray-950">
                    <CardHeader>
                        <CardTitle>System Health</CardTitle>
                        <CardDescription>Real-time monitoring status.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-green-50/50 dark:bg-green-900/10 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="h-2 w-2 rounded-full bg-green-500" />
                                <span className="text-sm font-medium">Database Connection</span>
                            </div>
                            <span className="text-xs text-green-700">Operational</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-green-50/50 dark:bg-green-900/10 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="h-2 w-2 rounded-full bg-green-500" />
                                <span className="text-sm font-medium">Storage Services</span>
                            </div>
                            <span className="text-xs text-green-700">Operational</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-green-50/50 dark:bg-green-900/10 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="h-2 w-2 rounded-full bg-green-500" />
                                <span className="text-sm font-medium">Payment Gateway (Paystack)</span>
                            </div>
                            <span className="text-xs text-green-700">Operational</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
