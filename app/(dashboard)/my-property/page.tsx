"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import {
    Loader2,
    Home,
    MapPin,
    Calendar,
    DollarSign,
    Phone,
    MessageSquare,
    Wrench,
    CreditCard,
    User,
    ChevronRight,
    Clock,
    CheckCircle2,
    XCircle,
    Building2,
} from "lucide-react"
import Link from "next/link"

interface RentalData {
    id: string
    status: string
    rent_amount: number
    rent_start_date: string | null
    rent_end_date: string | null
    property_id: string
    property: {
        id: string
        title: string
        address: string
        city: string
        price: number
        images: string[] | null
        landlord_id: string
    } | null
    landlord: {
        full_name: string | null
        name: string | null
        phone: string | null
    } | null
}

interface Bill {
    id: string
    type: string
    amount: number
    due_date: string
    status: "paid" | "unpaid" | "overdue"
    created_at: string
}

function BillStatusIcon({ status }: { status: string }) {
    if (status === "paid") return <CheckCircle2 className="w-4 h-4 text-green-400" />
    if (status === "overdue") return <XCircle className="w-4 h-4 text-red-400" />
    return <Clock className="w-4 h-4 text-yellow-400" />
}

function BillStatusBadge({ status }: { status: string }) {
    const cfg =
        status === "paid"
            ? "bg-green-500/20 text-green-400 border-green-500/30"
            : status === "overdue"
              ? "bg-red-500/20 text-red-400 border-red-500/30"
              : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${cfg}`}>
            {status}
        </span>
    )
}

export default function MyPropertyPage() {
    const [loading, setLoading] = useState(true)
    const [rental, setRental] = useState<RentalData | null>(null)
    const [bills, setBills] = useState<Bill[]>([])
    const [billsLoading, setBillsLoading] = useState(false)

    useEffect(() => {
        const controller = new AbortController()
        const fetchData = async () => {
            try {
                const {
                    data: { user },
                } = await supabase.auth.getUser()
                if (!user || controller.signal.aborted) return

                const { data: rentalData } = await supabase
                    .from("rentals")
                    .select(`
                        id,
                        status,
                        rent_amount,
                        rent_start_date,
                        rent_end_date,
                        property_id,
                        property:properties (
                            id,
                            title,
                            address,
                            city,
                            price,
                            images,
                            landlord_id
                        ),
                        landlord:profiles!rentals_landlord_id_fkey (
                            full_name,
                            name,
                            phone
                        )
                    `)
                    .eq("tenant_id", user.id)
                    .in("status", ["approved", "active"])
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .abortSignal(controller.signal)

                if (controller.signal.aborted) return
                const activeRental = (rentalData?.[0] as unknown as RentalData) ?? null
                setRental(activeRental)

                if (activeRental) {
                    setBillsLoading(true)
                    const { data: billsData } = await supabase
                        .from("bills")
                        .select("id, type, amount, due_date, status, created_at")
                        .eq("rental_id", activeRental.id)
                        .order("created_at", { ascending: false })
                        .limit(5)
                        .abortSignal(controller.signal)

                    if (!controller.signal.aborted) {
                        setBills((billsData as Bill[]) || [])
                        setBillsLoading(false)
                    }
                }
            } catch (err) {
                if (!controller.signal.aborted) console.error("My Property fetch error:", err)
            } finally {
                if (!controller.signal.aborted) setLoading(false)
            }
        }
        fetchData()
        return () => controller.abort()
    }, [])

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    /* ─── EMPTY STATE ─── */
    if (!rental) {
        return (
            <div className="space-y-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-blue-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-100">My Rental</h1>
                    </div>
                    <p className="text-slate-400 text-sm ml-10">Your current rental property and lease details.</p>
                </div>
                <div className="bg-slate-900/80 backdrop-blur border border-slate-800/60 rounded-2xl flex flex-col items-center justify-center py-24 px-6 text-center">
                    <div className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center mb-5">
                        <Home className="w-10 h-10 text-slate-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-200 mb-2">No Active Rental</h3>
                    <p className="text-slate-400 max-w-sm mb-8 leading-relaxed">
                        You don&apos;t have an active rental yet. Browse available properties and submit an application
                        to get started.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Link href="/listings">
                            <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl font-bold px-8">
                                Browse Listings
                            </Button>
                        </Link>
                        <Link href="/applications">
                            <Button
                                variant="outline"
                                className="border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl"
                            >
                                View My Applications
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    const property = rental.property
    const landlord = rental.landlord
    const heroImage = property?.images?.[0] ?? null
    const monthlyRent = rental.rent_amount || property?.price || 0

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-blue-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-100">My Rental</h1>
                </div>
                <p className="text-slate-400 text-sm ml-10">Your current rental property and lease details.</p>
            </div>

            {/* Hero Banner */}
            <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden bg-slate-800">
                {heroImage ? (
                    <img
                        src={heroImage}
                        alt={property?.title ?? "Property"}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Home className="w-16 h-16 text-slate-600" />
                    </div>
                )}
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />

                {/* Property info overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="flex items-end justify-between flex-wrap gap-3">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
                                {property?.title ?? "Your Property"}
                            </h2>
                            <div className="flex items-center gap-1.5 text-slate-300 mt-1">
                                <MapPin className="w-4 h-4" />
                                <span>{property?.address}, {property?.city}</span>
                            </div>
                        </div>
                        <span className="px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/40 text-green-400 text-sm font-semibold backdrop-blur">
                            Active Lease
                        </span>
                    </div>
                </div>
            </div>

            {/* Key Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Monthly Rent */}
                <div className="bg-slate-900/80 backdrop-blur border border-slate-800/60 rounded-2xl p-5">
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
                        <DollarSign className="w-3.5 h-3.5 text-blue-400" />
                        Monthly Rent
                    </div>
                    <p className="text-2xl font-bold text-blue-400">
                        &#8358;{monthlyRent.toLocaleString()}
                    </p>
                    <p className="text-slate-500 text-xs mt-1">per month</p>
                </div>

                {/* Lease Start */}
                <div className="bg-slate-900/80 backdrop-blur border border-slate-800/60 rounded-2xl p-5">
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        Lease Start
                    </div>
                    <p className="text-lg font-bold text-slate-100">
                        {rental.rent_start_date
                            ? new Date(rental.rent_start_date).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                              })
                            : "Not Set"}
                    </p>
                    <p className="text-slate-500 text-xs mt-1">start date</p>
                </div>

                {/* Lease End */}
                <div className="bg-slate-900/80 backdrop-blur border border-slate-800/60 rounded-2xl p-5">
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        Lease End
                    </div>
                    <p className="text-lg font-bold text-slate-100">
                        {rental.rent_end_date
                            ? new Date(rental.rent_end_date).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                              })
                            : "Ongoing"}
                    </p>
                    <p className="text-slate-500 text-xs mt-1">end date</p>
                </div>

                {/* Landlord */}
                <div className="bg-slate-900/80 backdrop-blur border border-slate-800/60 rounded-2xl p-5">
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        Landlord
                    </div>
                    <p className="text-lg font-bold text-slate-100 truncate">
                        {landlord?.full_name || landlord?.name || "N/A"}
                    </p>
                    {landlord?.phone && (
                        <p className="text-slate-500 text-xs mt-1 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {landlord.phone}
                        </p>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-900/80 backdrop-blur border border-slate-800/60 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Quick Actions</h3>
                <div className="flex flex-wrap gap-3">
                    <Link href="/pay-bills">
                        <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl font-bold gap-2">
                            <CreditCard className="w-4 h-4" />
                            Pay Rent
                        </Button>
                    </Link>
                    <Link href="/messages">
                        <Button
                            variant="outline"
                            className="border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl gap-2"
                        >
                            <MessageSquare className="w-4 h-4" />
                            Message Landlord
                        </Button>
                    </Link>
                    <Link href="/maintenance">
                        <Button
                            variant="outline"
                            className="border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl gap-2"
                        >
                            <Wrench className="w-4 h-4" />
                            Request Maintenance
                        </Button>
                    </Link>
                    <Link href={`/properties/${property?.id}`}>
                        <Button
                            variant="ghost"
                            className="text-slate-400 hover:text-slate-200 rounded-xl gap-2"
                        >
                            View Listing
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Recent Payment History */}
            <div className="bg-slate-900/80 backdrop-blur border border-slate-800/60 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                    <h3 className="text-base font-bold text-slate-100">Recent Payments</h3>
                    <Link href="/pay-bills">
                        <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 rounded-xl text-xs gap-1">
                            View All
                            <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                    </Link>
                </div>

                {billsLoading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    </div>
                ) : bills.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                        <CreditCard className="w-8 h-8 mb-3 opacity-40" />
                        <p className="text-sm">No payment records yet.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-800/60">
                        {bills.map((bill) => (
                            <div key={bill.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-800/30 transition-colors">
                                <div className="flex items-center gap-3">
                                    <BillStatusIcon status={bill.status} />
                                    <div>
                                        <p className="text-sm font-semibold text-slate-200 capitalize">{bill.type}</p>
                                        <p className="text-xs text-slate-500">
                                            Due{" "}
                                            {new Date(bill.due_date).toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-base font-bold text-slate-100">
                                        &#8358;{bill.amount.toLocaleString()}
                                    </span>
                                    <BillStatusBadge status={bill.status} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
