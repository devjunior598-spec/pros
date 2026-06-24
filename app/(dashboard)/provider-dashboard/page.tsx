"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, Wrench, Briefcase, CheckCircle2, Star, TrendingUp } from "lucide-react"
import { AvailableJobsList } from "@/components/provider/available-jobs-list"
import { ActiveAssignments } from "@/components/provider/active-assignments"

export default function ProviderDashboardPage() {
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [providerProfile, setProviderProfile] = useState<any>(null)
    const [stats, setStats] = useState({
        totalJobs: 0,
        averageRating: 0,
        activeAssignments: 0,
        earnings: 0
    })

    useEffect(() => {
        const fetchProviderData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()

                if (user) {
                    setUser(user)

                    // 1. Get the provider profile
                    const { data: provider, error: providerError } = await supabase
                        .from('service_providers')
                        .select('*')
                        .eq('user_id', user.id)
                        .single()

                    if (providerError && providerError.code !== 'PGRST116') {
                        throw providerError
                    }

                    if (provider) {
                        setProviderProfile(provider)

                        // 2. Get active assignments count
                        const { count: activeCount } = await supabase
                            .from('repair_assignments')
                            .select('*', { count: 'exact', head: true })
                            .eq('provider_id', provider.id)
                            .in('status', ['assigned', 'in_progress'])

                        // 3. Optional: Get total earnings (sum of agreed_price for completed jobs)
                        const { data: completedJobs } = await supabase
                            .from('repair_assignments')
                            .select('agreed_price')
                            .eq('provider_id', provider.id)
                            .eq('status', 'completed')

                        const totalEarnings = completedJobs?.reduce((sum, job) => sum + (Number(job.agreed_price) || 0), 0) || 0

                        setStats({
                            totalJobs: provider.total_jobs_completed || 0,
                            averageRating: provider.rating || 0,
                            activeAssignments: activeCount || 0,
                            earnings: totalEarnings
                        })
                    }
                }
            } catch (error) {
                console.error("Error fetching provider data:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchProviderData()
    }, [])

    if (loading) {
        return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    }

    if (!providerProfile) {
        return (
            <div className="p-8 max-w-2xl mx-auto text-center mt-12 bg-white rounded-xl border shadow-sm">
                <Wrench className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Service Provider Profile Required</h2>
                <p className="text-muted-foreground mb-6">
                    You need to complete your Service Provider registration before accessing this dashboard.
                </p>
                {/* Normally we'd link to an onboarding flow here */}
            </div>
        )
    }

    if (providerProfile.approval_status !== 'approved') {
        return (
            <div className="p-8 max-w-2xl mx-auto text-center mt-12 bg-amber-50 rounded-xl border border-amber-200 shadow-sm">
                <Wrench className="h-16 w-16 text-amber-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2 text-amber-900">Application Pending</h2>
                <p className="text-amber-700/80 mb-6">
                    Your application to join the PRMS Service Provider Marketplace is currently under review by our team.
                    We will notify you once approved.
                </p>
            </div>
        )
    }

    return (
        <div className="flex-1 space-y-8 p-2 sm:p-4 md:p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Provider Dashboard</h2>
                    <p className="text-muted-foreground mt-1">
                        Welcome back, {providerProfile.full_name}. Manage your jobs and submit quotes.
                    </p>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="shadow-sm border-none bg-white transition-all hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Earnings</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-700">₦{stats.earnings.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">Total completed jobs</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-none bg-white transition-all hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Active Jobs</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <Briefcase className="h-4 w-4 text-blue-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeAssignments}</div>
                        <p className="text-xs text-muted-foreground mt-1">Currently in progress</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-none bg-white transition-all hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Completed</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                            <CheckCircle2 className="h-4 w-4 text-purple-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalJobs}</div>
                        <p className="text-xs text-muted-foreground mt-1">Total finished jobs</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-none bg-white transition-all hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Rating</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                            <Star className="h-4 w-4 text-yellow-600 fill-yellow-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Average customer rating</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="available" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="available">Available Jobs</TabsTrigger>
                    <TabsTrigger value="active">
                        My Assignments
                        {stats.activeAssignments > 0 && (
                            <span className="ml-2 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full">
                                {stats.activeAssignments}
                            </span>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="available" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Open Requests in {providerProfile.location_city || providerProfile.location_state}</CardTitle>
                            <CardDescription>
                                Maintenance requests matching your category ({providerProfile.category}). Submit competitive quotes to win jobs.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AvailableJobsList
                                providerId={providerProfile.id}
                                category={providerProfile.category}
                                locationState={providerProfile.location_state}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="active" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Current Status & Accepted Quotes</CardTitle>
                            <CardDescription>
                                Manage jobs you've been assigned. Mark them as 'In Progress' when you start, and 'Completed' when finished.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ActiveAssignments providerId={providerProfile.id} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
