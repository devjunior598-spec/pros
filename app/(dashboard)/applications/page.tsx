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
        pending: { label: "Pending", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
        approved: { label: "Approved", className: "bg-green-500/20 text-green-400 border-green-500/30" },
        active: { label: "Active", className: "bg-green-500/20 text-green-400 border-green-500/30" },
        rejected: { label: "Rejected", className: "bg-red-500/20 text-red-400 border-red-500/30" },
        withdrawn: { label: "Withdrawn", className: "bg-slate-500/20 text-slate-400 border-slate-500/30" },
    }
    const cfg = map[status] ?? { label: status, className: "bg-slate-500/20 text-slate-400 border-slate-500/30" }
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
                if (current && isWithdrawn && isLast) stepIcon = <AlertCircle className="w-4 h-4 text-slate-400" />
                if (current && (status === "approved" || status === "active") && isLast)
                    stepIcon = <CheckCircle2 className="w-4 h-4 text-green-400" />
                if (current && status === "pending") stepIcon = <Clock className="w-4 h-4 text-yellow-400 animate-pulse" />

                const circleClass = done
                    ? "bg-blue-600 text-white border-blue-600"
                    : current
                      ? isRejected
                          ? "bg-red-500/20 text-red-400 border-red-500"
                          : status === "approved" || status === "active"
                            ? "bg-green-500/20 text-green-400 border-green-500"
                            : status === "withdrawn"
                              ? "bg-slate-700 text-slate-400 border-slate-600"
                              : "bg-yellow-500/20 text-yellow-400 border-yellow-500"
                      : "bg-slate-800 text-slate-500 border-slate-700"

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
                                    done ? "text-blue-400" : current ? "text-slate-200" : "text-slate-600"
                                }`}
                            >
                                {labelText}
                            </span>
                        </div>
                        {!isLast && (
                            <div className={`flex-1 h-px mx-1 ${done ? "bg-blue-600" : "bg-slate-700"}`} />
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
        <div className="bg-slate-900/80 backdrop-blur border border-slate-800/60 rounded-2xl overflow-hidden hover:border-slate-700/70 transition-all duration-200 group">
            <div className="flex flex-col md:flex-row">
                <div className="md:w-56 h-40 md:h-auto flex-shrink-0 bg-slate-800 relative overflow-hidden">
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={app.property?.title ?? "Property"}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Home className="w-12 h-12 text-slate-600" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-slate-900/40" />
                </div>

                <div className="flex-1 p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
                            <div>
                                <h3 className="text-lg font-bold text-slate-100 leading-tight">
                                    {app.property?.title ?? "Unknown Property"}
                                </h3>
                                <div className="flex items-center gap-1 text-slate-400 text-sm mt-0.5">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {app.property?.city ?? "N/A"}
                                </div>
                            </div>
                            <StatusBadge status={app.status} />
                        </div>

                        <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-400">
                            <div className="flex items-center gap-1.5">
                                <DollarSign className="w-3.5 h-3.5 text-blue-400" />
                                <span className="text-slate-200 font-semibold">
                                    &#8358;{(app.rent_amount ?? app.property?.price ?? 0).toLocaleString()}
                                </span>
                                <span>/mo</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-slate-500" />
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
                                    <span className="text-slate-500">Landlord:</span>
                                    <span className="text-slate-300">
                                        {app.landlord.full_name || app.landlord.name || "N/A"}
                                    </span>
                                </div>
                            )}
                        </div>

                        <StatusStepper status={app.status} />
                    </div>

                    {app.status === "pending" && (
                        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-800">
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-red-500/40 text-red-400 hover:bg-red-500/10 hover:border-red-500/60 rounded-xl"
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
                                    className="text-slate-400 hover:text-slate-200 rounded-xl"
                                >
                                    View Property
                                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                                </Button>
                            </Link>
                        </div>
                    )}
                    {(app.status === "approved" || app.status === "active") && (
                        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-800">
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
        const controller = new AbortController()
        const init = async () => {
            try {
                const {
                    data: { user },
                } = await supabase.auth.getUser()
                if (!user || controller.signal.aborted) return

                const { data: profile } = await supabase
                    .from("profiles")
                    .select("role")
                    .eq("id", user.id)
                    .single()
                    .abortSignal(controller.signal)

                if (controller.signal.aborted) return
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
                        .abortSignal(controller.signal)

                    if (!controller.signal.aborted) {
                        setApplications((data as unknown as Application[]) || [])
                        setAppLoading(false)
                    }
                }
            } catch (err) {
                if (!controller.signal.aborted) console.error("Applications page init:", err)
            } finally {
                if (!controller.signal.aborted) setLoading(false)
            }
        }
        init()
        return () => controller.abort()
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
                                <ClipboardList className="w-4 h-4 text-blue-400" />
                            </div>
                            <h1 className="text-2xl font-bold text-slate-100">Rental Applications</h1>
                        </div>
                        <p className="text-slate-400 text-sm ml-10">
                            Review and manage incoming applications from potential tenants.
                        </p>
                    </div>
                </div>
                <div className="bg-slate-900/80 backdrop-blur border border-slate-800/60 rounded-2xl p-6">
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
                            <FileText className="w-4 h-4 text-blue-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-100">My Applications</h1>
                    </div>
                    <p className="text-slate-400 text-sm ml-10">Track the status of your rental applications.</p>
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
                                className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 capitalize"
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
                <div className="bg-slate-900/80 backdrop-blur border border-slate-800/60 rounded-2xl flex flex-col items-center justify-center py-20 px-6 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
                        <FileText className="w-8 h-8 text-slate-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-200 mb-2">No Applications Yet</h3>
                    <p className="text-slate-400 max-w-sm mb-6">
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
