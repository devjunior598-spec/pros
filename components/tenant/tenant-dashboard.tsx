"use client"

import { useState, useEffect, Suspense, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DollarSign, Home, Activity, MessageSquare, PlusCircle, Loader2, MapPin, Calendar, AlertCircle, ShieldAlert, Wallet, CreditCard, History as HistoryIcon } from "lucide-react"
import { MaintenanceRequestList } from "@/components/tenant/maintenance-request-list"
import { MaintenanceRequestForm } from "@/components/tenant/maintenance-request-form"
import { TenantChatPanel } from "@/components/tenant/tenant-chat-panel"
import { TenantBillsTable } from "@/components/tenant/bills-table"
import { DocumentManager } from "@/components/document-manager"
import { ProfileSettings } from "@/components/profile-settings"
import { SummaryCard } from "@/components/dashboard/summary-cards"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

// Refined MyRentals component to show real data
function MyRentals({ rentals, loading }: { rentals: any[], loading: boolean }) {
    if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>

    return (
        <Card>
            <CardHeader>
                <CardTitle>My Rentals</CardTitle>
                <CardDescription>View and manage your current rental properties and applications.</CardDescription>
            </CardHeader>
            <CardContent>
                {rentals.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-muted-foreground">You have no active rentals or applications.</p>
                        <Link href="/listings">
                            <Button className="mt-4" variant="outline">Browse Properties</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {rentals.map((rental) => (
                            <div key={rental.id} className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-semibold text-lg">{rental.property.title}</h4>
                                        <Badge variant={
                                            rental.status === 'approved' || rental.status === 'active' ? 'default' :
                                                rental.status === 'pending' ? 'outline' : 'destructive'
                                        }>
                                            {rental.status}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground flex items-center mt-1">
                                        <MapPin className="h-3 w-3 mr-1" />
                                        {rental.property.address}, {rental.property.city}
                                    </p>
                                    <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
                                        <div className="flex items-center text-muted-foreground">
                                            <DollarSign className="h-3 w-3 mr-1" />
                                            ₦{rental.property.price?.toLocaleString()} / month
                                        </div>
                                        {rental.rent_start_date && (
                                            <div className="flex items-center text-muted-foreground">
                                                <Calendar className="h-3 w-3 mr-1" />
                                                {rental.status === 'pending' ? 'Target Move-in:' : 'Started:'} {new Date(rental.rent_start_date).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <Link href={`/properties/${rental.property.id}`}>
                                        <Button variant="outline" size="sm">View Property</Button>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function MaintenanceRequests({ userId }: { userId: string }) {
    const [refreshKey, setRefreshKey] = useState(0)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const handleSuccess = () => {
        setRefreshKey(prev => prev + 1)
        setIsDialogOpen(false)
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Maintenance Requests</h3>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            New Request
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Submit Maintenance Request</DialogTitle>
                            <DialogDescription>
                                Describe the issue with your property. We'll notify your landlord.
                            </DialogDescription>
                        </DialogHeader>
                        <MaintenanceRequestForm tenantId={userId} onSuccess={handleSuccess} />
                    </DialogContent>
                </Dialog>
            </div>
            <MaintenanceRequestList tenantId={userId} refreshKey={refreshKey} />
        </div>
    )
}

interface TenantDashboardProps {
    userId: string
}

function TenantDashboardContent({ userId }: TenantDashboardProps) {
    const router = useRouter()
    const [stats, setStats] = useState({
        rentDue: 0,
        activeLeases: 0,
        maintenanceCount: 0,
        walletBalance: 0
    })
    const [rentals, setRentals] = useState<any[]>([])
    const [recentPayments, setRecentPayments] = useState<any[]>([])
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true)
            try {
                // Fetch rentals
                const { data: rentalsData } = await supabase
                    .from('rentals')
                    .select('*, property:properties(*)')
                    .eq('tenant_id', userId)

                setRentals(rentalsData || [])
                const activeCount = rentalsData?.filter(r => r.status === 'approved' || r.status === 'active').length || 0

                // Fetch profile
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single()
                setProfile(profileData)

                // Fetch bills (outstanding)
                const { data: billsData } = await supabase
                    .from('bills')
                    .select(`amount, rental:rentals!inner(tenant_id)`)
                    .eq('rental.tenant_id', userId)
                    .neq('status', 'paid')

                const totalDue = billsData?.reduce((sum, b) => sum + (Number(b.amount) || 0), 0) || 0

                // Fetch maintenance requests count
                const { count: mCount } = await supabase
                    .from('maintenance_requests')
                    .select('*', { count: 'exact', head: true })
                    .eq('tenant_id', userId)
                    .not('status', 'eq', 'resolved')

                // Fetch wallet balance
                const { data: walletData } = await supabase
                    .from('wallets')
                    .select('balance')
                    .eq('tenant_id', userId)
                    .maybeSingle()

                // Fetch recent payments (simplified)
                const { data: paymentsData } = await supabase
                    .from('bills')
                    .select('*, rental:rentals!inner(property:properties(title))')
                    .eq('rental.tenant_id', userId)
                    .eq('status', 'paid')
                    .order('updated_at', { ascending: false })
                    .limit(3)

                setRecentPayments(paymentsData || [])

                setStats({
                    rentDue: totalDue,
                    activeLeases: activeCount,
                    maintenanceCount: mCount || 0,
                    walletBalance: walletData?.balance || 0
                })
            } catch (error) {
                console.error("Error fetching dashboard data:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchDashboardData()
    }, [userId])

    if (loading) {
        return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold tracking-tight">Welcome, {profile?.name?.split(' ')[0] || 'Tenant'}</h2>
                <p className="text-muted-foreground">Here&apos;s a summary of your property and payments.</p>
            </div>

            {/* Verification Alert */}
            {!profile?.is_verified && (
                <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 dark:border-orange-900 shadow-sm transition-all hover:bg-orange-50">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                            <div className="rounded-full bg-orange-100 dark:bg-orange-900 p-2 inset-0">
                                <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-lg font-semibold text-orange-800 dark:text-orange-300">Identity Verification Required</h4>
                                <p className="text-orange-700 dark:text-orange-400/80 text-sm mb-4">
                                    Please complete your identity verification (KYC) to unlock full wallet features and pay bills.
                                </p>
                                <Link href="/kyc">
                                    <Button variant="default" className="bg-orange-600 hover:bg-orange-700 text-white border-none shadow-md">
                                        Verify Identity Now
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="shadow-sm border-none bg-white dark:bg-gray-950 transition-all hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Rent Due</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <DollarSign className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₦{stats.rentDue.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">Outstanding balance</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-none bg-white dark:bg-gray-950 transition-all hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Wallet Balance</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Wallet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₦{stats.walletBalance.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">Available funds</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-none bg-white dark:bg-gray-950 transition-all hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Active Leases</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <Home className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeLeases}</div>
                        <p className="text-xs text-muted-foreground mt-1">Current properties</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-none bg-white dark:bg-gray-950 transition-all hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Maintenance</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <Activity className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.maintenanceCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">Open requests</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-8 md:grid-cols-7">
                {/* Left Column: Quick Actions & Property Summary */}
                <div className="md:col-span-4 space-y-8">
                    {/* Quick Actions */}
                    {/* Quick Actions - Only for Tenants */}
                    {profile?.role === 'tenant' && (
                        <Card className="shadow-sm border-none bg-white dark:bg-gray-950">
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                                <CardDescription>Commonly used actions for your convenience.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                                <Link href="/wallet">
                                    <Button className="w-full h-20 flex-col gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-none dark:bg-blue-900/20 dark:text-blue-300">
                                        <PlusCircle className="h-6 w-6" />
                                        <span>Fund Wallet</span>
                                    </Button>
                                </Link>
                                <Link href="/pay-bills">
                                    <Button className="w-full h-20 flex-col gap-2 bg-green-50 hover:bg-green-100 text-green-700 border-none dark:bg-green-900/20 dark:text-green-300">
                                        <CreditCard className="h-6 w-6" />
                                        <span>Pay Rent</span>
                                    </Button>
                                </Link>
                                <Link href="/requests">
                                    <Button className="w-full h-20 flex-col gap-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border-none dark:bg-purple-900/20 dark:text-purple-300">
                                        <Activity className="h-6 w-6" />
                                        <span>New Request</span>
                                    </Button>
                                </Link>
                                <Link href="/dashboard/inspections">
                                    <Button className="w-full h-20 flex-col gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-none dark:bg-indigo-900/20 dark:text-indigo-300">
                                        <Calendar className="h-6 w-6" />
                                        <span>Inspections</span>
                                    </Button>
                                </Link>
                                <Link href="/messages">
                                    <Button className="w-full h-20 flex-col gap-2 bg-orange-50 hover:bg-orange-100 text-orange-700 border-none dark:bg-orange-900/20 dark:text-orange-300">
                                        <MessageSquare className="h-6 w-6" />
                                        <span>Message Landlord</span>
                                    </Button>
                                </Link>
                            </CardContent>

                        </Card>
                    )}

                    {/* Property Summary */}
                    <Card className="shadow-sm border-none bg-white dark:bg-gray-950">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>My Property Summary</CardTitle>
                                <CardDescription>Key details about your current residence.</CardDescription>
                            </div>
                            <Link href="/my-property">
                                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">View Full Detail</Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            {rentals.length === 0 ? (
                                <div className="text-center py-8 bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed">
                                    <Home className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                                    <p className="text-muted-foreground">You don&apos;t have any active rentals.</p>
                                    <Link href="/listings">
                                        <Button variant="outline" className="mt-4">Browse Properties</Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {rentals.slice(0, 2).map((rental) => (
                                        <div key={rental.id} className="flex gap-4 p-4 rounded-xl border bg-gray-50/50 dark:bg-gray-900/30 transition-all hover:bg-gray-50">
                                            <div className="h-20 w-20 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                                                {rental.property.image_url ? (
                                                    <img src={rental.property.image_url} alt={rental.property.title} className="h-full w-full object-cover" />
                                                ) : (
                                                    <Home className="h-10 w-10 text-gray-300 m-auto mt-5" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="font-semibold text-gray-900 dark:text-white truncate">{rental.property.title}</h4>
                                                    <Badge variant="outline" className="capitalize">{rental.status}</Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground flex items-center mb-2">
                                                    <MapPin className="h-3 w-3 mr-1" />
                                                    {rental.property.city}
                                                </p>
                                                <div className="flex items-center text-sm font-semibold text-blue-600 dark:text-blue-400">
                                                    ₦{rental.property.price?.toLocaleString()} / month
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Recent Payments & Wallet */}
                <div className="md:col-span-3 space-y-8">
                    {/* Recent Payments */}
                    <Card className="shadow-sm border-none bg-white dark:bg-gray-950">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Recent Payments</CardTitle>
                                <CardDescription>Your latest transactions.</CardDescription>
                            </div>
                            <Link href="/history">
                                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">View All</Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {recentPayments.length === 0 ? (
                                    <div className="text-center py-6 text-muted-foreground text-sm italic">No recent payments.</div>
                                ) : (
                                    recentPayments.map((payment) => (
                                        <div key={payment.id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-950/50 flex items-center justify-center">
                                                    <HistoryIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold capitalize">{payment.type}</p>
                                                    <p className="text-[10px] text-muted-foreground">{new Date(payment.updated_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="text-sm font-bold text-gray-900 dark:text-white">
                                                + ₦{payment.amount?.toLocaleString()}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Wallet Card */}
                    <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none shadow-lg overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                            <Wallet className="h-32 w-32" />
                        </div>
                        <CardHeader>
                            <CardTitle className="text-blue-100 font-medium">My PRMS Wallet</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 relative z-10">
                            <div>
                                <p className="text-sm text-blue-100/80 mb-1">Available Balance</p>
                                <h3 className="text-4xl font-bold tracking-tight">₦{stats.walletBalance.toLocaleString()}</h3>
                            </div>
                            <div className="flex gap-3">
                                <Link href="/wallet" className="flex-1">
                                    <Button className="w-full bg-white text-blue-700 hover:bg-blue-50 border-none shadow-sm font-bold">
                                        Fund Now
                                    </Button>
                                </Link>
                                <Link href="/pay-bills" className="flex-1">
                                    <Button variant="outline" className="w-full border-white/30 text-white hover:bg-white/10 font-bold">
                                        History
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export function TenantDashboard({ userId }: TenantDashboardProps) {
    return (
        <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
            <TenantDashboardContent userId={userId} />
        </Suspense>
    )
}
