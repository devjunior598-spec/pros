"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { LandlordApplicationsList } from "@/components/landlord/landlord-applications-list"
import { Button } from "@/components/ui/button"
import {
    Loader2,
    FileText,
    Home,
    MapPin,
    Calendar,
    CheckCircle2,
    Clock,
    XCircle,
    AlertCircle,
    ChevronRight,
    DollarSign,
    ClipboardList,
} from "lucide-react"
import Link from "next/link"

type ApplicationStatus = "pending" | "approved" | "rejected" | "withdrawn" | "active"

interface Application {
    id: string
    status: ApplicationStatus
    created_at: string
    rent_amount: number
    rent_start_date: string | null
    property_id: string
    property: {
        title: string
        city: string
        address: string
        price: number
        images: string[] | null
        landlord_id: string
    } | null
    landlord: {
        full_name: string | null
        name: string | null
    } | null
}

const STEPS = ["Submitted", "Under Review", "Decision"]

function getStepIndex(status: ApplicationStatus) {
    if (status === "pending") return 1
    if (status === "approved" || status === "rejected" || status === "withdrawn" || status === "active") return 2
    return 0
}

function StatusBadge({ status }: { status: ApplicationStatus }) {
    const map: Record<ApplicationStatus, { label: string; className: string }> = {
        pending:   { label: "Pending",   className: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30" },
        approved:  { label: "Approved",  className: "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30" },
        active:    { label: "Active",    className: "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30" },
        rejected:  { label: "Rejected",  className: "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30" },
        withdrawn: { label: "Withdrawn", className: "bg-muted text-muted-foreground border-border" },
    }
    const cfg = map[status] ?? { label: status, className: "bg-muted text-muted-foreground border-border" }
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.className}`}>
            {cfg.label}
        </span>
    )
}

function StatusStepper({ status }: { status: ApplicationStatus }) {
    const activeStep = getStepIndex(status)
    const isRejected = status === "rejected"
    const isWithdrawn = status === "withdrawn"

    return (
        <div className="flex items-center gap-0 w-full mt-4 mb-2">
            {STEPS.map((step, i) => {
                const done = i < activeStep
                const current = i === activeStep
                const isLast = i === STEPS.length - 1

                let stepIcon: React.ReactNode = <span className="text-xs font-bold">{i + 1}</span>
                if (done) stepIcon = <CheckCircle2 className="w-4 h-4" />
                if (current && isRejected && isLast) stepIcon = <XCircle className="w-4 h-4 text-red-400" />
                if (current && isWithdrawn && isLast) stepIcon = <AlertCircle className="w-4 h-4 text-muted-foreground" />
                if (current && (status === "approved" || status === "active") && isLast)
                    stepIcon = <CheckCircle2 className="w-4 h-4 text-green-500" />
                if (current && status === "pending") stepIcon = <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />

                const circleClass = done
                    ? "bg-blue-600 text-white border-blue-600"
                    : current
                      ? isRejected
                          ? "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500"
                          : status === "approved" || status === "active"
                            ? "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500"
                            : status === "withdrawn"
                              ? "bg-muted text-muted-foreground border-border"
                              : "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500"
                      : "bg-muted text-muted-foreground border-border"

                const labelText =
                    isLast && (status === "approved" || status === "active")
                        ? "Approved"
                        : isLast && isRejected
                          ? "Rejected"
                          : isLast && isWithdrawn
                            ? "Withdrawn"
                            : step

                return (
                    <div key={step} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center gap-1 min-w-[56px]">
                            <div
                                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${circleClass}`}
                            >
                                {stepIcon}
                            </div>
                            <span
                                className={`text-[10px] font-semibold text-center leading-tight ${
                                    done ? "text-blue-500" : current ? "text-foreground" : "text-muted-foreground"
                                }`}
                            >
                                {labelText}
                            </span>
                        </div>
                        {!isLast && (
                            <div className={`flex-1 h-px mx-1 ${done ? "bg-blue-600" : "bg-border"}`} />
                        )}
                    </div>
                )
            })}
        </div>
    )
}

function TenantApplicationCard({
    app,
    onWithdraw,
    withdrawing,
}: {
    app: Application
    onWithdraw: (id: string) => void
    withdrawing: boolean
}) {
    const imageUrl = app.property?.images?.[0] ?? null

    return (
        <div className="bg-card border border-border rounded-2xl overflow-hidden hover:border-blue-500/40 transition-all duration-200 group shadow-sm">
            <div className="flex flex-col md:flex-row">
                <div className="md:w-56 h-40 md:h-auto flex-shrink-0 bg-muted relative overflow-hidden">
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={app.property?.title ?? "Property"}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Home className="w-12 h-12 text-muted-foreground/40" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background/20 dark:to-slate-900/40" />
                </div>

                <div className="flex-1 p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
                            <div>
                                <h3 className="text-lg font-bold text-foreground leading-tight">
                                    {app.property?.title ?? "Unknown Property"}
                                </h3>
                                <div className="flex items-center gap-1 text-muted-foreground text-sm mt-0.5">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {app.property?.city ?? "N/A"}
                                </div>
                            </div>
                            <StatusBadge status={app.status} />
                        </div>

                        <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                                <DollarSign className="w-3.5 h-3.5 text-blue-500" />
                                <span className="text-foreground font-semibold">
                                    &#8358;{(app.rent_amount ?? app.property?.price ?? 0).toLocaleString()}
                                </span>
                                <span>/mo</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>
                                    Submitted{" "}
                                    {new Date(app.created_at).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                    })}
                                </span>
                            </div>
                            {app.landlord && (
                                <div className="flex items-center gap-1.5">
                                    <span className="text-muted-foreground/60">Landlord:</span>
                                    <span className="text-foreground">
                                        {app.landlord.full_name || app.landlord.name || "N/A"}
                                    </span>
                                </div>
                            )}
                        </div>

                        <StatusStepper status={app.status} />
                    </div>

                    {app.status === "pending" && (
                        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border">
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-red-500/40 text-red-600 dark:text-red-400 hover:bg-red-500/10 hover:border-red-500/60 rounded-xl"
                                disabled={withdrawing}
                                onClick={() => onWithdraw(app.id)}
                            >
                                {withdrawing ? (
                                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                ) : (
                                    <XCircle className="w-3.5 h-3.5 mr-1.5" />
                                )}
                                Withdraw Application
                            </Button>
                            <Link href={`/properties/${app.property_id}`}>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-muted-foreground hover:text-foreground rounded-xl"
                                >
                                    View Property
                                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                                </Button>
                            </Link>
                        </div>
                    )}
                    {(app.status === "approved" || app.status === "active") && (
                        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border">
                            <Link href="/my-property">
                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 rounded-xl font-bold">
                                    View My Rental
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function ApplicationsPage() {
    const [role, setRole] = useState<"tenant" | "landlord" | null>(null)
    const [userId, setUserId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [applications, setApplications] = useState<Application[]>([])
    const [appLoading, setAppLoading] = useState(false)
    const [withdrawingId, setWithdrawingId] = useState<string | null>(null)

    useEffect(() => {
        let mounted = true
        const init = async () => {
            try {
                const {
                    data: { user },
                } = await supabase.auth.getUser()
                if (!user || !mounted) return

                const { data: profile } = await supabase
                    .from("profiles")
                    .select("role")
                    .eq("id", user.id)
                    .single()

                if (!mounted) return
                const userRole = profile?.role as "tenant" | "landlord"
                setRole(userRole)
                setUserId(user.id)

                if (userRole === "tenant") {
                    setAppLoading(true)
                    const { data } = await supabase
                        .from("rentals")
                        .select(`
                            id,
                            status,
                            created_at,
                            rent_amount,
                            rent_start_date,
                            property_id,
                            property:properties (
                                title,
                                city,
                                address,
                                price,
                                images,
                                landlord_id
                            ),
                            landlord:profiles!rentals_landlord_id_fkey (
                                full_name,
                                name
                            )
                        `)
                        .eq("tenant_id", user.id)
                        .order("created_at", { ascending: false })

                    if (mounted) {
                        setApplications((data as unknown as Application[]) || [])
                        setAppLoading(false)
                    }
                }
            } catch (err) {
                if (mounted) console.error("Applications page init:", err)
            } finally {
                if (mounted) setLoading(false)
            }
        }
        init()
        return () => mounted = false
    }, [])

    const handleWithdraw = async (id: string) => {
        setWithdrawingId(id)
        try {
            const { error } = await supabase
                .from("rentals")
                .update({ status: "withdrawn" })
                .eq("id", id)
            if (!error) {
                setApplications((prev) =>
                    prev.map((a) =>
                        a.id === id ? { ...a, status: "withdrawn" as ApplicationStatus } : a
                    )
                )
            }
        } catch (err) {
            console.error("Withdraw error:", err)
        } finally {
            setWithdrawingId(null)
        }
    }

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    if (role === "landlord" && userId) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center">
                                <ClipboardList className="w-4 h-4 text-blue-500" />
                            </div>
                            <h1 className="text-2xl font-bold text-foreground">Rental Applications</h1>
                        </div>
                        <p className="text-muted-foreground text-sm ml-10">
                            Review and manage incoming applications from potential tenants.
                        </p>
                    </div>
                </div>
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <LandlordApplicationsList landlordId={userId} />
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center">
                            <FileText className="w-4 h-4 text-blue-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-foreground">My Applications</h1>
                    </div>
                    <p className="text-muted-foreground text-sm ml-10">Track the status of your rental applications.</p>
                </div>
                <Link href="/listings">
                    <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl font-bold">Browse Listings</Button>
                </Link>
            </div>

            {applications.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {(["pending", "approved", "active", "rejected", "withdrawn"] as ApplicationStatus[]).map((s) => {
                        const count = applications.filter((a) => a.status === s).length
                        if (!count) return null
                        return (
                            <span
                                key={s}
                                className="px-3 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border capitalize"
                            >
                                {count} {s}
                            </span>
                        )
                    })}
                </div>
            )}

            {appLoading ? (
                <div className="flex h-[300px] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            ) : applications.length === 0 ? (
                <div className="bg-card border border-border rounded-2xl flex flex-col items-center justify-center py-20 px-6 text-center shadow-sm">
                    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                        <FileText className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">No Applications Yet</h3>
                    <p className="text-muted-foreground max-w-sm mb-6">
                        You haven&apos;t applied for any properties yet. Browse available listings and submit your first
                        application.
                    </p>
                    <Link href="/listings">
                        <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl font-bold px-8">
                            Browse Available Properties
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {applications.map((app) => (
                        <TenantApplicationCard
                            key={app.id}
                            app={app}
                            onWithdraw={handleWithdraw}
                            withdrawing={withdrawingId === app.id}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
