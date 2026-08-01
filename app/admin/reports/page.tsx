"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
} from "recharts"
import {
    BarChart3,
    TrendingUp,
    Calendar,
    Filter,
    Loader2,
    PieChart,
    Users,
    Building,
    DollarSign,
    Download
} from "lucide-react"
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns"

interface MonthlyRevenue {
    month: string
    revenue: number
}

interface MonthlyUsers {
    month: string
    users: number
}

interface ReportStats {
    totalRevenue: number
    activeRentals: number
    userGrowth: number
    serviceSuccess: number | null
}

interface RoleCounts {
    tenants: number
    landlords: number
    providers: number
}

interface RevenueBreakdown {
    rent: number
    commission: number
    maintenance: number
}

// Custom dark tooltip for recharts
function DarkTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 shadow-2xl">
            <p className="text-xs font-bold text-slate-400 mb-1">{label}</p>
            {payload.map((entry: any, i: number) => (
                <p key={i} className="text-sm font-black" style={{ color: entry.color }}>
                    {entry.name === 'revenue'
                        ? `₦${Number(entry.value).toLocaleString()}`
                        : `${entry.value} users`
                    }
                </p>
            ))}
        </div>
    )
}

export default function AdminReportsPage() {
    const [revenueData, setRevenueData] = useState<MonthlyRevenue[]>([])
    const [usersData, setUsersData] = useState<MonthlyUsers[]>([])
    const [reportStats, setReportStats] = useState<ReportStats>({
        totalRevenue: 0,
        activeRentals: 0,
        userGrowth: 0,
        serviceSuccess: null,
    })
    const [roleCounts, setRoleCounts] = useState<RoleCounts>({
        tenants: 0,
        landlords: 0,
        providers: 0,
    })
    const [revenueBreakdown, setRevenueBreakdown] = useState<RevenueBreakdown>({
        rent: 0,
        commission: 0,
        maintenance: 0,
    })
    const [loadingCharts, setLoadingCharts] = useState(true)

    useEffect(() => {
        const fetchChartData = async () => {
            setLoadingCharts(true)
            try {
                // Build last 6 month ranges
                const months = Array.from({ length: 6 }, (_, i) => {
                    const d = subMonths(new Date(), 5 - i)
                    return {
                        label: format(d, 'MMM'),
                        start: startOfMonth(d).toISOString(),
                        end: endOfMonth(d).toISOString(),
                    }
                })

                // Fetch payments grouped by month
                const revPromises = months.map(async (m) => {
                    const { data, error } = await supabase
                        .from('payments')
                        .select('amount')
                        .gte('created_at', m.start)
                        .lte('created_at', m.end)
                        .eq('status', 'completed')
                    if (error) throw error
                    const total = (data || []).reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0)
                    return { month: m.label, revenue: total }
                })

                // Fetch new users per month
                const userPromises = months.map(async (m) => {
                    const { count, error } = await supabase
                        .from('profiles')
                        .select('id', { count: 'exact', head: true })
                        .gte('created_at', m.start)
                        .lte('created_at', m.end)
                    if (error) throw error
                    return { month: m.label, users: count || 0 }
                })

                const [revResults, userResults] = await Promise.all([
                    Promise.all(revPromises),
                    Promise.all(userPromises),
                ])

                setRevenueData(revResults)
                setUsersData(userResults)

                const thisMonthStart = startOfMonth(new Date()).toISOString()
                const previousMonthStart = startOfMonth(subMonths(new Date(), 1)).toISOString()
                const previousMonthEnd = endOfMonth(subMonths(new Date(), 1)).toISOString()

                const [
                    activeRentalsResult,
                    currentUsersResult,
                    previousUsersResult,
                    tenantResult,
                    landlordResult,
                    providerResult,
                    completedMaintenanceResult,
                    totalMaintenanceResult,
                    commissionAccountResult,
                    maintenancePaymentsResult,
                ] = await Promise.all([
                    supabase.from('rentals').select('id', { count: 'exact', head: true }).eq('status', 'active'),
                    supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', thisMonthStart),
                    supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', previousMonthStart).lte('created_at', previousMonthEnd),
                    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'tenant'),
                    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'landlord'),
                    supabase.from('service_providers').select('id', { count: 'exact', head: true }),
                    supabase.from('maintenance_requests').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
                    supabase.from('maintenance_requests').select('id', { count: 'exact', head: true }),
                    supabase.from('accounts').select('balance').eq('code', '4001').maybeSingle(),
                    supabase.from('payments').select('amount').eq('status', 'completed').eq('type', 'maintenance'),
                ])

                const totalRevenue = revResults.reduce((sum, item) => sum + item.revenue, 0)
                const maintenanceTotal = totalMaintenanceResult.error ? 0 : totalMaintenanceResult.count || 0
                const completedMaintenance = completedMaintenanceResult.error ? 0 : completedMaintenanceResult.count || 0
                const maintenanceRevenue = maintenancePaymentsResult.error
                    ? 0
                    : (maintenancePaymentsResult.data || []).reduce((sum: number, payment: any) => sum + (Number(payment.amount) || 0), 0)

                setReportStats({
                    totalRevenue,
                    activeRentals: activeRentalsResult.error ? 0 : activeRentalsResult.count || 0,
                    userGrowth: (currentUsersResult.error ? 0 : currentUsersResult.count || 0) - (previousUsersResult.error ? 0 : previousUsersResult.count || 0),
                    serviceSuccess: maintenanceTotal > 0 ? Math.round((completedMaintenance / maintenanceTotal) * 1000) / 10 : null,
                })
                setRoleCounts({
                    tenants: tenantResult.error ? 0 : tenantResult.count || 0,
                    landlords: landlordResult.error ? 0 : landlordResult.count || 0,
                    providers: providerResult.error ? 0 : providerResult.count || 0,
                })
                setRevenueBreakdown({
                    rent: totalRevenue - maintenanceRevenue,
                    commission: Math.abs(Number(commissionAccountResult.data?.balance) || 0),
                    maintenance: maintenanceRevenue,
                })
            } catch (err) {
                console.error('Error fetching chart data:', err)
                setRevenueData([])
                setUsersData([])
            } finally {
                setLoadingCharts(false)
            }
        }

        fetchChartData()
    }, [])

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Reports &amp; Analytics</h1>
                    <p className="text-muted-foreground">Deep dive into platform performance and growth metrics.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2 rounded-xl">
                        <Calendar className="h-4 w-4" /> This Month
                    </Button>
                    <Button variant="outline" className="gap-2 rounded-xl">
                        <Filter className="h-4 w-4" /> Filters
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl gap-2">
                        <Download className="h-4 w-4" /> Export All
                    </Button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <ReportStatCard title="Total Revenue" value={`₦${reportStats.totalRevenue.toLocaleString()}`} description="Completed payments, last 6 months" />
                <ReportStatCard title="Active Rentals" value={reportStats.activeRentals.toString()} description="Currently active leases" />
                <ReportStatCard title="User Growth" value={reportStats.userGrowth >= 0 ? `+${reportStats.userGrowth}` : reportStats.userGrowth.toString()} description="New users vs previous month" />
                <ReportStatCard title="Service Success" value={reportStats.serviceSuccess === null ? "N/A" : `${reportStats.serviceSuccess}%`} description="Completed maintenance requests" />
            </div>

            {/* Revenue Trend + User Growth charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue BarChart */}
                <Card className="border-none shadow-sm bg-white dark:bg-gray-950">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-blue-600" />
                            Revenue Trend
                        </CardTitle>
                        <CardDescription>Monthly revenue over the last 6 months.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loadingCharts ? (
                            <div className="h-72 flex items-center justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                            </div>
                        ) : revenueData.length === 0 ? (
                            <EmptyChartState icon={BarChart3} message="No completed payment data is available yet." />
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={revenueData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.15)" vertical={false} />
                                    <XAxis
                                        dataKey="month"
                                        tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(v) =>
                                            v >= 1000000
                                                ? `₦${(v / 1000000).toFixed(1)}M`
                                                : v >= 1000
                                                ? `₦${(v / 1000).toFixed(0)}K`
                                                : `₦${v}`
                                        }
                                        width={60}
                                    />
                                    <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(59,130,246,0.08)' }} />
                                    <Bar
                                        dataKey="revenue"
                                        fill="#2563eb"
                                        radius={[6, 6, 0, 0]}
                                        maxBarSize={52}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* New Users LineChart */}
                <Card className="border-none shadow-sm bg-white dark:bg-gray-950">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-blue-600" />
                            New Users per Month
                        </CardTitle>
                        <CardDescription>User sign-ups over the last 6 months.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loadingCharts ? (
                            <div className="h-72 flex items-center justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                            </div>
                        ) : usersData.length === 0 ? (
                            <EmptyChartState icon={TrendingUp} message="No user sign-up data is available yet." />
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <LineChart data={usersData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.15)" vertical={false} />
                                    <XAxis
                                        dataKey="month"
                                        tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                                        axisLine={false}
                                        tickLine={false}
                                        allowDecimals={false}
                                        width={36}
                                    />
                                    <Tooltip content={<DarkTooltip />} cursor={{ stroke: 'rgba(59,130,246,0.2)', strokeWidth: 2 }} />
                                    <Line
                                        type="monotone"
                                        dataKey="users"
                                        stroke="#2563eb"
                                        strokeWidth={3}
                                        dot={{ r: 5, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                                        activeDot={{ r: 7, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-none shadow-sm bg-white dark:bg-gray-950">
                    <CardHeader>
                        <CardTitle>Revenue Breakdown</CardTitle>
                        <CardDescription>Live revenue totals from payments and ledger accounts.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 border-t mt-4 pt-6">
                        <BreakdownRow label="Rent payments" value={`₦${Math.max(revenueBreakdown.rent, 0).toLocaleString()}`} />
                        <BreakdownRow label="Maintenance payments" value={`₦${revenueBreakdown.maintenance.toLocaleString()}`} />
                        <BreakdownRow label="Commission ledger" value={`₦${revenueBreakdown.commission.toLocaleString()}`} />
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white dark:bg-gray-950">
                    <CardHeader>
                        <CardTitle>User Demographics</CardTitle>
                        <CardDescription>Distribution of registered users across platform roles.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 border-t mt-4 pt-6">
                        <BreakdownRow label="Tenants" value={roleCounts.tenants.toLocaleString()} />
                        <BreakdownRow label="Landlords" value={roleCounts.landlords.toLocaleString()} />
                        <BreakdownRow label="Service providers" value={roleCounts.providers.toLocaleString()} />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function ReportStatCard({ title, value, description }: any) {
    return (
        <Card className="border-none shadow-sm bg-white dark:bg-gray-950">
            <CardContent className="p-6">
                <div className="text-xs font-medium text-muted-foreground mb-1">{title}</div>
                <div className="text-2xl font-bold mb-2">{value}</div>
                <p className="text-[10px] text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    )
}

function BreakdownRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between rounded-xl border bg-slate-50/60 px-4 py-3 dark:bg-slate-900/30">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="text-sm font-bold">{value}</span>
        </div>
    )
}

function EmptyChartState({ icon: Icon, message }: { icon: any; message: string }) {
    return (
        <div className="h-72 flex flex-col items-center justify-center text-center text-muted-foreground">
            <Icon className="h-10 w-10 opacity-20 mb-2" />
            <p className="text-sm">{message}</p>
        </div>
    )
}
