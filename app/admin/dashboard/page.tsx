"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import {
    ArrowRight, Building2, CheckCircle2, ClipboardCheck, FileWarning,
    Home, RefreshCw, ShieldCheck, Users, UserRoundCheck,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type MetricSet = {
    users: number
    tenants: number
    landlords: number
    properties: number
    activeRentals: number
    pendingApplications: number
    pendingVerification: number
}

type RecentUser = {
    id: string
    name: string | null
    full_name: string | null
    email: string | null
    role: "tenant" | "landlord"
    is_verified: boolean | null
    status: string | null
    created_at: string
}

type PendingApplication = {
    id: string
    status: string
    rent_amount: number | null
    created_at: string
    property: { title: string } | null
    tenant: { name: string | null; full_name: string | null; email: string | null } | null
}

type DashboardData = {
    metrics: MetricSet
    recentUsers: RecentUser[]
    pendingApplications: PendingApplication[]
}

const emptyMetrics: MetricSet = {
    users: 0, tenants: 0, landlords: 0, properties: 0,
    activeRentals: 0, pendingApplications: 0, pendingVerification: 0,
}

function displayName(user: { name: string | null; full_name: string | null; email: string | null }) {
    return user.full_name || user.name || user.email || "Unnamed user"
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value))
}

function MetricCard({ title, value, description, icon: Icon, tone }: {
    title: string
    value: number
    description: string
    icon: typeof Users
    tone: string
}) {
    return (
        <Card className="border-border/70 shadow-sm">
            <CardContent className="flex items-start justify-between p-5">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight">{value.toLocaleString()}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{description}</p>
                </div>
                <div className={`rounded-xl p-2.5 ${tone}`}><Icon className="h-5 w-5" /></div>
            </CardContent>
        </Card>
    )
}

export default function AdminDashboardPage() {
    const [data, setData] = useState<DashboardData>({ metrics: emptyMetrics, recentUsers: [], pendingApplications: [] })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const loadDashboard = useCallback(async () => {
        setError(null)
        try {
            const response = await fetch("/api/admin/dashboard", { cache: "no-store" })
            const result = await response.json()
            if (!response.ok) throw new Error(result.error || "Unable to load the admin dashboard")
            setData(result as DashboardData)
        } catch (requestError: unknown) {
            setError(requestError instanceof Error ? requestError.message : "Unable to load the admin dashboard")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadDashboard()
    }, [loadDashboard])

    const metrics = data.metrics
    const reviewCount = metrics.pendingApplications + metrics.pendingVerification

    return (
        <div className="space-y-7 pb-10">
            <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6 text-white shadow-lg md:p-8">
                <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
                    <div>
                        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-blue-200"><ShieldCheck className="h-4 w-4" /> Administration console</div>
                        <h1 className="text-3xl font-semibold tracking-tight">Platform control center</h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Manage tenant and landlord accounts, review onboarding, and monitor active rental operations from one protected workspace.</p>
                    </div>
                    <Button onClick={loadDashboard} disabled={loading} variant="secondary" className="gap-2 self-start bg-white text-slate-900 hover:bg-slate-100">
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh data
                    </Button>
                </div>
                <div className="mt-6 flex flex-wrap gap-3 text-sm">
                    <div className="rounded-lg bg-white/10 px-3 py-2"><span className="font-semibold">{reviewCount}</span> item{reviewCount === 1 ? "" : "s"} awaiting review</div>
                    <div className="rounded-lg bg-white/10 px-3 py-2"><span className="font-semibold">{metrics.activeRentals}</span> active rental relationships</div>
                    <div className="rounded-lg bg-emerald-400/15 px-3 py-2 text-emerald-100"><CheckCircle2 className="mr-1 inline h-4 w-4" /> Admin-only access enforced</div>
                </div>
            </section>

            {error && (
                <Card className="border-red-200 bg-red-50 text-red-900"><CardContent className="flex items-center justify-between gap-4 p-4"><span className="text-sm">{error}</span><Button size="sm" variant="outline" onClick={loadDashboard}>Try again</Button></CardContent></Card>
            )}

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard title="All platform users" value={metrics.users} description="Tenant and landlord accounts" icon={Users} tone="bg-blue-100 text-blue-700" />
                <MetricCard title="Tenants" value={metrics.tenants} description="Accounts seeking or renting homes" icon={UserRoundCheck} tone="bg-emerald-100 text-emerald-700" />
                <MetricCard title="Landlords" value={metrics.landlords} description="Property-owner accounts" icon={Home} tone="bg-violet-100 text-violet-700" />
                <MetricCard title="Properties" value={metrics.properties} description="Listings across the platform" icon={Building2} tone="bg-amber-100 text-amber-700" />
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2 border-border/70 shadow-sm">
                    <CardHeader className="flex flex-row items-start justify-between gap-4">
                        <div><CardTitle>New tenants and landlords</CardTitle><CardDescription>Recently created accounts that may need monitoring or verification.</CardDescription></div>
                        <Button asChild variant="ghost" size="sm" className="gap-1"><Link href="/admin/users">Manage users <ArrowRight className="h-4 w-4" /></Link></Button>
                    </CardHeader>
                    <CardContent>
                        <div className="divide-y divide-border">
                            {loading ? <p className="py-8 text-center text-sm text-muted-foreground">Loading account activity…</p> : data.recentUsers.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No tenant or landlord accounts yet.</p> : data.recentUsers.map((user) => (
                                <div key={user.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                                    <div className="min-w-0"><p className="truncate text-sm font-medium">{displayName(user)}</p><p className="truncate text-xs text-muted-foreground">{user.email || "No email on profile"} · Joined {formatDate(user.created_at)}</p></div>
                                    <div className="flex shrink-0 items-center gap-2"><Badge variant="secondary" className="capitalize">{user.role}</Badge><Badge className={user.is_verified ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" : "bg-amber-100 text-amber-800 hover:bg-amber-100"}>{user.is_verified ? "Verified" : "Review"}</Badge></div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border/70 shadow-sm">
                    <CardHeader><CardTitle>Priority review queue</CardTitle><CardDescription>Items requiring an administrator decision.</CardDescription></CardHeader>
                    <CardContent className="space-y-3">
                        <Link href="/admin/kyc" className="block rounded-xl border border-border p-4 transition-colors hover:bg-muted/50"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-blue-600" /><div><p className="text-sm font-medium">Identity verification</p><p className="text-xs text-muted-foreground">Tenant and landlord KYC</p></div></div><span className="text-lg font-semibold">{metrics.pendingVerification}</span></div></Link>
                        <Link href="/applications" className="block rounded-xl border border-border p-4 transition-colors hover:bg-muted/50"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><ClipboardCheck className="h-5 w-5 text-violet-600" /><div><p className="text-sm font-medium">Pending applications</p><p className="text-xs text-muted-foreground">Awaiting landlord review</p></div></div><span className="text-lg font-semibold">{metrics.pendingApplications}</span></div></Link>
                        <Link href="/admin/properties" className="block rounded-xl border border-border p-4 transition-colors hover:bg-muted/50"><div className="flex items-center gap-3"><FileWarning className="h-5 w-5 text-amber-600" /><div><p className="text-sm font-medium">Property oversight</p><p className="text-xs text-muted-foreground">Review listings and availability</p></div></div></Link>
                    </CardContent>
                </Card>
            </section>

            <Card className="border-border/70 shadow-sm">
                <CardHeader className="flex flex-row items-start justify-between gap-4"><div><CardTitle>Latest pending rental applications</CardTitle><CardDescription>Platform-level visibility for escalation and support.</CardDescription></div><Button asChild variant="ghost" size="sm" className="gap-1"><Link href="/admin/users">Open user management <ArrowRight className="h-4 w-4" /></Link></Button></CardHeader>
                <CardContent>
                    <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="border-b text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-2 py-3 font-medium">Applicant</th><th className="px-2 py-3 font-medium">Property</th><th className="px-2 py-3 font-medium">Submitted</th><th className="px-2 py-3 text-right font-medium">Monthly rent</th><th className="px-2 py-3 text-right font-medium">Status</th></tr></thead><tbody className="divide-y">{loading ? <tr><td colSpan={5} className="px-2 py-8 text-center text-muted-foreground">Loading applications…</td></tr> : data.pendingApplications.length === 0 ? <tr><td colSpan={5} className="px-2 py-8 text-center text-muted-foreground">No pending applications.</td></tr> : data.pendingApplications.map((application) => (<tr key={application.id}><td className="px-2 py-3"><p className="font-medium">{displayName(application.tenant || { name: null, full_name: null, email: null })}</p><p className="text-xs text-muted-foreground">{application.tenant?.email || "No email"}</p></td><td className="px-2 py-3">{application.property?.title || "Property unavailable"}</td><td className="px-2 py-3 text-muted-foreground">{formatDate(application.created_at)}</td><td className="px-2 py-3 text-right">${Number(application.rent_amount || 0).toLocaleString()}</td><td className="px-2 py-3 text-right"><Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 capitalize">{application.status}</Badge></td></tr>))}</tbody></table></div>
                </CardContent>
            </Card>
        </div>
    )
}
