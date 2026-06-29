"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { RoleGuard } from "@/components/role-guard"
import { Button } from "@/components/ui/button"
import {
    Loader2,
    BarChart3,
    TrendingUp,
    Users,
    DollarSign,
    Home,
    ChevronDown,
    Building2,
    FileText,
} from "lucide-react"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts"

type DateRange = "30d" | "90d" | "12m"

interface MonthlyRevenue {
    month: string
    revenue: number
}

interface PropertyEarning {
    id: string
    title: string
    city: string
    revenue: number
    tenants: number
}

interface AnalyticsData {
    totalRevenue: number
    occupancyRate: number
    activeTenants: number
    avgRent: number
    monthlyRevenue: MonthlyRevenue[]
    topProperties: PropertyEarning[]
    totalApplications: number
    approvedApplications: number
}

const RANGE_LABELS: Record<DateRange, string> = {
    "30d": "Last 30 Days",
    "90d": "Last 90 Days",
    "12m": "Last 12 Months",
}

function SummaryCard({
    label,
    value,
    icon: Icon,
    accent,
    sub,
}: {
    label: string
    value: string
    icon: React.ElementType
    accent: string
    sub?: string
}) {
    return (
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-4 ${accent}`}>
                <Icon className="w-5 h-5" />
            </div>
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">{label}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {sub && <p className="text-muted-foreground/70 text-xs mt-1">{sub}</p>}
        </div>
    )
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-popover border border-border rounded-xl p-3 shadow-xl">
                <p className="text-muted-foreground text-xs mb-1">{label}</p>
                <p className="text-blue-500 font-bold">
                    &#8358;{payload[0].value?.toLocaleString()}
                </p>
            </div>
        )
    }
    return null
}

export default function AnalyticsPage() {
    return (
        <RoleGuard allowedRoles={["landlord"]}>
            <AnalyticsDashboard />
        </RoleGuard>
    )
}

function AnalyticsDashboard() {
    const [range, setRange] = useState<DateRange>("30d")
    const [showRangeMenu, setShowRangeMenu] = useState(false)
    const [loading, setLoading] = useState(true)
    const [landlordId, setLandlordId] = useState<string | null>(null)
    const [data, setData] = useState<AnalyticsData>({
        totalRevenue: 0,
        occupancyRate: 0,
        activeTenants: 0,
        avgRent: 0,
        monthlyRevenue: [],
        topProperties: [],
        totalApplications: 0,
        approvedApplications: 0,
    })

    useEffect(() => {
        let mounted = true
        const init = async () => {
            try {
                const {
                    data: { user },
                } = await supabase.auth.getUser()
                if (!user || !mounted) return
                setLandlordId(user.id)
                await fetchAnalytics(user.id, range)
            } catch (err) {
                if (mounted) console.error("Analytics init:", err)
            } finally {
                if (mounted) setLoading(false)
            }
        }
        init()
        return () => { mounted = false }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (!landlordId) return
        let mounted = true
        setLoading(true)
        fetchAnalytics(landlordId, range).finally(() => {
            if (mounted) setLoading(false)
        })
        return () => { mounted = false }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [range, landlordId])

    const fetchAnalytics = async (uid: string, selectedRange: DateRange) => {
        try {
            const now = new Date()
            const daysBack = selectedRange === "30d" ? 30 : selectedRange === "90d" ? 90 : 365
            const since = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000).toISOString()

            const { data: bills } = await supabase
                .from("bills")
                .select("amount, created_at, rental_id, status, rental:rentals!inner(property:properties!inner(title, city, landlord_id))")
                .gte("created_at", since)
                .eq("status", "paid")

            const landlordBills = (bills || []).filter(
                (b: any) => b.rental?.property?.landlord_id === uid
            )
            const totalRevenue = landlordBills.reduce((sum: number, b: any) => sum + (b.amount || 0), 0)

            const monthlyMap: Record<string, number> = {}
            landlordBills.forEach((b: any) => {
                const d = new Date(b.created_at)
                const key = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
                monthlyMap[key] = (monthlyMap[key] || 0) + (b.amount || 0)
            })
            const monthlyRevenue: MonthlyRevenue[] = Object.entries(monthlyMap)
                .map(([month, revenue]) => ({ month, revenue }))
                .slice(-12)

            const { data: activeRentals } = await supabase
                .from("rentals")
                .select("id, rent_amount, property:properties!inner(id, title, city, landlord_id)")
                .eq("landlord_id", uid)
                .in("status", ["approved", "active"])

            const activeTenants = (activeRentals || []).length
            const avgRent =
                activeTenants > 0
                    ? (activeRentals || []).reduce((s: number, r: any) => s + (r.rent_amount || 0), 0) / activeTenants
                    : 0

            const { data: allProps } = await supabase
                .from("properties")
                .select("id")
                .eq("landlord_id", uid)
            const totalProps = (allProps || []).length
            const occupancyRate = totalProps > 0 ? Math.round((activeTenants / totalProps) * 100) : 0

            const propRevenueMap: Record<string, PropertyEarning> = {}
            landlordBills.forEach((b: any) => {
                const prop = b.rental?.property
                if (!prop) return
                const key = prop.title
                if (!propRevenueMap[key]) {
                    propRevenueMap[key] = { id: key, title: prop.title, city: prop.city, revenue: 0, tenants: 0 }
                }
                propRevenueMap[key].revenue += b.amount || 0
            })
            ;(activeRentals || []).forEach((r: any) => {
                const title = r.property?.title
                if (title && propRevenueMap[title]) {
                    propRevenueMap[title].tenants += 1
                }
            })
            const topProperties = Object.values(propRevenueMap)
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 5)

            const { data: appData } = await supabase
                .from("rentals")
                .select("id, status")
                .eq("landlord_id", uid)
                .gte("created_at", since)

            const totalApplications = (appData || []).length
            const approvedApplications = (appData || []).filter(
                (a: any) => a.status === "approved" || a.status === "active"
            ).length

            setData({
                totalRevenue,
                occupancyRate,
                activeTenants,
                avgRent,
                monthlyRevenue,
                topProperties,
                totalApplications,
                approvedApplications,
            })
        } catch (err) {
            console.error("Analytics fetch:", err)
        }
    }

    const funnelApprovalPct =
        data.totalApplications > 0
            ? Math.round((data.approvedApplications / data.totalApplications) * 100)
            : 0

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center">
                            <BarChart3 className="w-4 h-4 text-blue-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
                    </div>
                    <p className="text-muted-foreground text-sm ml-10">Track your portfolio performance and revenue.</p>
                </div>

                {/* Date Range Selector */}
                <div className="relative">
                    <Button
                        variant="outline"
                        className="rounded-xl gap-2"
                        onClick={() => setShowRangeMenu((v) => !v)}
                    >
                        {RANGE_LABELS[range]}
                        <ChevronDown className="w-4 h-4" />
                    </Button>
                    {showRangeMenu && (
                        <div className="absolute right-0 mt-2 w-44 bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                            {(Object.entries(RANGE_LABELS) as [DateRange, string][]).map(([key, label]) => (
                                <button
                                    key={key}
                                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-muted ${
                                        range === key ? "text-blue-500 bg-blue-500/10" : "text-foreground"
                                    }`}
                                    onClick={() => {
                                        setRange(key)
                                        setShowRangeMenu(false)
                                    }}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex h-[400px] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <SummaryCard
                            label="Total Revenue"
                            value={`₦${data.totalRevenue.toLocaleString()}`}
                            icon={DollarSign}
                            accent="bg-blue-600/20 text-blue-500"
                            sub={RANGE_LABELS[range]}
                        />
                        <SummaryCard
                            label="Occupancy Rate"
                            value={`${data.occupancyRate}%`}
                            icon={Building2}
                            accent="bg-green-500/20 text-green-600 dark:text-green-400"
                            sub="of total properties"
                        />
                        <SummaryCard
                            label="Active Tenants"
                            value={String(data.activeTenants)}
                            icon={Users}
                            accent="bg-purple-500/20 text-purple-600 dark:text-purple-400"
                            sub="current leases"
                        />
                        <SummaryCard
                            label="Avg. Rent"
                            value={data.avgRent > 0 ? `₦${Math.round(data.avgRent).toLocaleString()}` : "N/A"}
                            icon={TrendingUp}
                            accent="bg-amber-500/20 text-amber-600 dark:text-amber-400"
                            sub="per month"
                        />
                    </div>

                    {/* Revenue Chart */}
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-base font-bold text-foreground">Revenue Over Time</h3>
                                <p className="text-muted-foreground text-xs mt-0.5">Monthly revenue from paid bills</p>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="w-3 h-3 rounded-sm bg-blue-600 inline-block" />
                                Revenue
                            </div>
                        </div>

                        {data.monthlyRevenue.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                                <BarChart3 className="w-10 h-10 mb-3 opacity-30" />
                                <p className="text-sm">No revenue data for selected period.</p>
                            </div>
                        ) : (
                            <div className="h-56">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.monthlyRevenue} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                        <XAxis
                                            dataKey="month"
                                            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                                            axisLine={false}
                                            tickLine={false}
                                            tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`}
                                            width={56}
                                        />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(37,99,235,0.08)" }} />
                                        <Bar dataKey="revenue" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={52} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    {/* Bottom Row: Top Properties + Application Funnel */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        {/* Top Properties Table */}
                        <div className="lg:col-span-3 bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                            <div className="px-6 py-4 border-b border-border flex items-center gap-2">
                                <Home className="w-4 h-4 text-blue-500" />
                                <h3 className="text-base font-bold text-foreground">Top Properties by Revenue</h3>
                            </div>
                            {data.topProperties.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                    <Home className="w-8 h-8 mb-3 opacity-30" />
                                    <p className="text-sm">No property revenue data yet.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    <div className="grid grid-cols-3 px-6 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        <span className="col-span-1">Property</span>
                                        <span className="text-right">Tenants</span>
                                        <span className="text-right">Revenue</span>
                                    </div>
                                    {data.topProperties.map((prop, idx) => (
                                        <div
                                            key={prop.id}
                                            className="grid grid-cols-3 px-6 py-3.5 hover:bg-muted/50 transition-colors items-center"
                                        >
                                            <div className="col-span-1 flex items-center gap-3 min-w-0">
                                                <span className="text-xs text-muted-foreground font-bold w-5 shrink-0">
                                                    #{idx + 1}
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-foreground truncate">
                                                        {prop.title}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground truncate">{prop.city}</p>
                                                </div>
                                            </div>
                                            <span className="text-right text-sm text-foreground">{prop.tenants}</span>
                                            <span className="text-right text-sm font-bold text-blue-500">
                                                &#8358;{prop.revenue.toLocaleString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Application Funnel */}
                        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center gap-2 mb-5">
                                <FileText className="w-4 h-4 text-blue-500" />
                                <h3 className="text-base font-bold text-foreground">Application Funnel</h3>
                            </div>

                            <div className="space-y-5">
                                {/* Total */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-muted-foreground">Total Applications</span>
                                        <span className="text-sm font-bold text-foreground">
                                            {data.totalApplications}
                                        </span>
                                    </div>
                                    <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-600 rounded-full transition-all duration-700"
                                            style={{ width: "100%" }}
                                        />
                                    </div>
                                </div>

                                {/* Approved */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-muted-foreground">Approved</span>
                                        <span className="text-sm font-bold text-green-600 dark:text-green-400">
                                            {data.approvedApplications}
                                            <span className="text-muted-foreground font-normal ml-1">({funnelApprovalPct}%)</span>
                                        </span>
                                    </div>
                                    <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-green-500 rounded-full transition-all duration-700"
                                            style={{ width: `${funnelApprovalPct}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="pt-3 border-t border-border">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">Conversion Rate</span>
                                        <span
                                            className={`text-sm font-bold ${funnelApprovalPct >= 50 ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}
                                        >
                                            {funnelApprovalPct}%
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-xs text-muted-foreground">Pending / Rejected</span>
                                        <span className="text-sm font-bold text-foreground">
                                            {data.totalApplications - data.approvedApplications}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
