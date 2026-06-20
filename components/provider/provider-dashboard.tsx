"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { SummaryCard } from "@/components/dashboard/summary-cards"
import {
    Briefcase,
    Star,
    Clock,
    DollarSign,
    Activity,
    ChevronRight,
    Search,
    Wallet
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

interface ProviderDashboardProps {
    userId: string
}

export function ProviderDashboard({ userId }: ProviderDashboardProps) {
    const [stats, setStats] = useState({
        completedJobs: 0,
        activeJobs: 0,
        balance: 0,
        rating: 0,
    })
    const [loading, setLoading] = useState(true)
    const [provider, setProvider] = useState<any>(null)
    const [recentJobs, setRecentJobs] = useState<any[]>([])

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true)
            try {
                // 1. Fetch provider details
                const { data: providerData } = await supabase
                    .from('service_providers')
                    .select('*')
                    .eq('user_id', userId)
                    .single()

                if (providerData) {
                    setProvider(providerData)

                    // 2. Fetch stats
                    const { count: activeCount } = await supabase
                        .from('repair_assignments')
                        .select('*', { count: 'exact', head: true })
                        .eq('provider_id', providerData.id)
                        .in('status', ['assigned', 'in_progress'])

                    // Fetch Provider Wallet Balance
                    const { data: walletData } = await supabase
                        .from('provider_wallets')
                        .select('balance')
                        .eq('provider_id', providerData.id)
                        .single()

                    setStats({
                        completedJobs: providerData.total_jobs_completed || 0,
                        activeJobs: activeCount || 0,
                        balance: walletData?.balance || 0,
                        rating: providerData.rating || 0,
                    })

                    // 3. Fetch recent assignments
                    const { data: assignments } = await supabase
                        .from('repair_assignments')
                        .select(`
                            *,
                            request:maintenance_requests (
                                title,
                                description,
                                priority,
                                created_at,
                                property:properties (title, city)
                            )
                        `)
                        .eq('provider_id', providerData.id)
                        .order('created_at', { ascending: false })
                        .limit(3)

                    setRecentJobs(assignments || [])
                }
            } catch (error) {
                console.error("Error fetching provider dashboard:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchDashboardData()
    }, [userId])

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Activity className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold tracking-tight">Provider Overview</h1>
                    <p className="text-muted-foreground">Welcome back! Manage your jobs and track your earnings.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Link href="/withdrawals">
                        <Button variant="outline" className="border-green-200 text-green-700 hover:bg-green-50">
                            <Wallet className="h-4 w-4 mr-2" /> Withdrawals
                        </Button>
                    </Link>
                    <Link href="/maintenance/available">
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <Search className="h-4 w-4 mr-2" /> Find Jobs
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <SummaryCard
                    title="Jobs Completed"
                    value={stats.completedJobs.toString()}
                    description="Total lifetime jobs"
                    icon={Briefcase}
                    iconClassName="text-blue-600"
                />
                <SummaryCard
                    title="Active Jobs"
                    value={stats.activeJobs.toString()}
                    description="Work in progress"
                    icon={Clock}
                    iconClassName="text-orange-600"
                />
                <SummaryCard
                    title="Available Earnings"
                    value={`₦${stats.balance.toLocaleString()}`}
                    description="Ready to withdraw"
                    icon={DollarSign}
                    iconClassName="text-green-600"
                />
                <SummaryCard
                    title="Average Rating"
                    value={stats.rating.toFixed(1)}
                    description="Based on client reviews"
                    icon={Star}
                    iconClassName="text-yellow-600"
                />
            </div>

            <div className="grid gap-6 md:grid-cols-7">
                <Card className="md:col-span-4 border-none shadow-sm bg-white dark:bg-gray-950">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Recent Assignments</CardTitle>
                            <CardDescription>Your most recently assigned repair jobs.</CardDescription>
                        </div>
                        <Link href="/maintenance/assigned">
                            <Button variant="ghost" size="sm" className="text-blue-600">View All</Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {recentJobs.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">
                                <Briefcase className="h-10 w-10 mx-auto opacity-20 mb-2" />
                                <p>No active jobs yet. Check "Available Jobs" to start bidding!</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {recentJobs.map((job) => (
                                    <div key={job.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-semibold">{job.request?.title}</h4>
                                                <Badge variant={job.status === 'in_progress' ? 'secondary' : 'outline'}>
                                                    {job.status}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground">{job.request?.property?.title} • {job.request?.property?.city}</p>
                                        </div>
                                        <Link href={`/assigned-jobs/${job.id}`}>
                                            <Button variant="ghost" size="icon">
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="md:col-span-3 border-none shadow-sm bg-white dark:bg-gray-950">
                    <CardHeader>
                        <CardTitle>Profile Tip</CardTitle>
                        <CardDescription>How to win more jobs.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl space-y-2">
                            <h4 className="font-semibold text-sm text-blue-700 flex items-center gap-2">
                                <Star className="h-4 w-4" /> Complete Your Portfolio
                            </h4>
                            <p className="text-xs text-muted-foreground">
                                Landlords are 80% more likely to hire providers with real photos of their previous work.
                            </p>
                        </div>
                        <Link href="/portfolio">
                            <Button variant="outline" className="w-full text-xs">Manage Portfolio</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
