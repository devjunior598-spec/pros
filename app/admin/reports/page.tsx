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
    ArrowUpRight,
    ArrowDownRight,
    Download,
    Calendar,
    Filter,
    Loader2,
    PieChart,
    Users,
    Building,
    DollarSign
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
                    const { data } = await supabase
                        .from('payments')
                        .select('amount')
                        .gte('created_at', m.start)
                        .lte('created_at', m.end)
                        .eq('status', 'completed')
                    const total = (data || []).reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0)
                    return { month: m.label, revenue: total }
                })

                // Fetch new users per month
                const userPromises = months.map(async (m) => {
                    const { count } = await supabase
                        .from('profiles')
                        .select('id', { count: 'exact', head: true })
                        .gte('created_at', m.start)
                        .lte('created_at', m.end)
                    return { month: m.label, users: count || 0 }
                })

                const [revResults, userResults] = await Promise.all([
                    Promise.all(revPromises),
                    Promise.all(userPromises),
                ])

                setRevenueData(revResults)
                setUsersData(userResults)
            } catch (err) {
                console.error('Error fetching chart data:', err)
                // Fallback placeholder data
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
                setRevenueData(months.map((m, i) => ({ month: m, revenue: 150000 + i * 80000 })))
                setUsersData(months.map((m, i) => ({ month: m, users: 4 + i * 2 })))
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
                <ReportStatCard title="Total Revenue" value="₦4,250,000" change="+12.5%" trend="up" />
                <ReportStatCard title="Active Rentals" value="156" change="+4.2%" trend="up" />
                <ReportStatCard title="User Growth" value="+24" change="-1.5%" trend="down" />
                <ReportStatCard title="Service Success" value="98.2%" change="+0.5%" trend="up" />
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

            {/* Revenue Breakdown placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-none shadow-sm bg-white dark:bg-gray-950">
                    <CardHeader>
                        <CardTitle>Revenue Breakdown</CardTitle>
                        <CardDescription>Monthly revenue by category (Rent, Commission, Repairs).</CardDescription>
                    </CardHeader>
                    <CardContent className="h-64 flex items-center justify-center text-muted-foreground italic border-t mt-4">
                        <div className="flex flex-col items-center gap-2">
                            <BarChart3 className="h-10 w-10 opacity-20" />
                            <span>Category breakdown chart coming soon.</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white dark:bg-gray-950">
                    <CardHeader>
                        <CardTitle>User Demographics</CardTitle>
                        <CardDescription>Distribution of Users across roles and states.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-64 flex items-center justify-center text-muted-foreground italic border-t mt-4">
                        <div className="flex flex-col items-center gap-2">
                            <PieChart className="h-10 w-10 opacity-20" />
                            <span>Demographic distribution chart.</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-sm bg-white dark:bg-gray-950">
                <CardHeader>
                    <CardTitle>Performance Reports</CardTitle>
                    <CardDescription>Generate and download detailed platform reports.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <ReportTypeCard title="Financial Audit" description="Monthly transaction and tax logs." icon={DollarSign} />
                        <ReportTypeCard title="Property Occupancy" description="Retention and vacancy rate analysis." icon={Building} />
                        <ReportTypeCard title="Service Quality" description="Provider ratings and resolution times." icon={Users} />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function ReportStatCard({ title, value, change, trend }: any) {
    return (
        <Card className="border-none shadow-sm bg-white dark:bg-gray-950">
            <CardContent className="p-6">
                <div className="text-xs font-medium text-muted-foreground mb-1">{title}</div>
                <div className="text-2xl font-bold mb-2">{value}</div>
                <div className="flex items-center gap-1">
                    {trend === 'up' ? (
                        <ArrowUpRight className="h-3 w-3 text-green-500" />
                    ) : (
                        <ArrowDownRight className="h-3 w-3 text-red-500" />
                    )}
                    <span className={cn(
                        "text-[10px] font-bold",
                        trend === 'up' ? "text-green-600" : "text-red-600"
                    )}>{change}</span>
                    <span className="text-[10px] text-muted-foreground ml-1">vs last month</span>
                </div>
            </CardContent>
        </Card>
    )
}

function ReportTypeCard({ title, description, icon: Icon }: any) {
    return (
        <div className="p-4 border rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors flex items-start gap-3 group cursor-pointer">
            <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
                <h4 className="font-bold text-sm">{title}</h4>
                <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <Download className="h-4 w-4 text-gray-300 group-hover:text-blue-600 transition-colors" />
        </div>
    )
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ')
}
