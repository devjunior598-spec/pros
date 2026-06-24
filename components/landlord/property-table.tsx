"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { PropertyEditForm } from "./property-edit-form"
import { Property } from "@/types"
import {
    Building2, MapPin, BedDouble, Bath, Ruler,
    User, Pencil, Trash2, Eye, ChevronLeft,
    ChevronRight, Loader2, Home, Search, SlidersHorizontal,
} from "lucide-react"

interface PropertyWithDetails extends Property {
    rentals: {
        id: string
        tenant_id: string
        status: string
        tenant: {
            name: string
        }
    }[]
}

interface PropertyTableProps {
    landlordId: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
    available: {
        label: "Available",
        color: "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20",
        dot: "bg-emerald-400",
    },
    rented: {
        label: "Rented",
        color: "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20",
        dot: "bg-blue-400",
    },
    pending: {
        label: "Pending",
        color: "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20",
        dot: "bg-amber-400",
    },
    maintenance: {
        label: "Maintenance",
        color: "bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20",
        dot: "bg-orange-400",
    },
}

const RENTAL_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    approved: { label: "Approved", color: "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20" },
    active:   { label: "Active",   color: "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20" },
    pending:  { label: "Pending",  color: "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20" },
    rejected: { label: "Rejected", color: "bg-red-500/10 text-red-400 ring-1 ring-red-500/20" },
}

const FILTER_TABS = [
    { value: "all",         label: "All" },
    { value: "available",   label: "Available" },
    { value: "rented",      label: "Rented" },
    { value: "pending",     label: "Pending" },
    { value: "maintenance", label: "Maintenance" },
]

// Deterministic placeholder gradient per property id
function placeholderGradient(id: string) {
    const gradients = [
        "from-violet-600/20 to-blue-600/20",
        "from-blue-600/20 to-cyan-600/20",
        "from-emerald-600/20 to-teal-600/20",
        "from-amber-600/20 to-orange-600/20",
        "from-pink-600/20 to-rose-600/20",
        "from-indigo-600/20 to-purple-600/20",
    ]
    const idx = id.charCodeAt(0) % gradients.length
    return gradients[idx]
}

export function PropertyTable({ landlordId }: PropertyTableProps) {
    const [properties, setProperties] = useState<PropertyWithDetails[]>([])
    const [loading, setLoading] = useState(true)
    const [editingProperty, setEditingProperty] = useState<Property | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [page, setPage] = useState(1)
    const pageSize = 9
    const [totalCount, setTotalCount] = useState(0)
    const [statusFilter, setStatusFilter] = useState("all")
    const [searchQuery, setSearchQuery] = useState("")
    const [deletingId, setDeletingId] = useState<string | null>(null)

    useEffect(() => {
        const controller = new AbortController()
        if (landlordId) {
            fetchProperties(controller.signal)

            const channel = supabase
                .channel("property-table-changes")
                .on("postgres_changes", { event: "*", schema: "public", table: "properties", filter: `landlord_id=eq.${landlordId}` }, () => fetchProperties(controller.signal))
                .on("postgres_changes", { event: "*", schema: "public", table: "rentals" }, () => fetchProperties(controller.signal))
                .subscribe()

            return () => {
                controller.abort()
                supabase.removeChannel(channel)
            }
        }
    }, [landlordId, page, statusFilter])

    const fetchProperties = async (signal?: AbortSignal) => {
        setLoading(true)
        try {
            let query = supabase
                .from("properties")
                .select(
                    `*, rentals ( id, tenant_id, status, tenant:profiles!rentals_tenant_id_fkey ( name ) )`,
                    { count: "exact" }
                )
                .eq("landlord_id", landlordId)
                .order("created_at", { ascending: false })

            if (statusFilter !== "all") query = query.eq("status", statusFilter)

            const from = (page - 1) * pageSize
            const to = from + pageSize - 1
            query = query.range(from, to)
            if (signal) query = query.abortSignal(signal)

            const { data, count, error } = await query
            if (error) { if (!signal?.aborted) console.error(error) }
            else if (!signal?.aborted) {
                setProperties(data as any)
                if (count !== null) setTotalCount(count)
            }
        } catch (err) {
            if (!(err as any)?.name?.includes("AbortError")) console.error(err)
        } finally {
            if (!signal?.aborted) setLoading(false)
        }
    }

    const handleEditSuccess = () => {
        setIsDialogOpen(false)
        setEditingProperty(null)
        fetchProperties()
    }

    const handleDeleteProperty = async (propertyId: string) => {
        if (!window.confirm("Are you sure you want to delete this property listing? This action cannot be undone.")) return
        setDeletingId(propertyId)
        try {
            const { error } = await supabase.from("properties").delete().eq("id", propertyId)
            if (error) throw error
            fetchProperties()
        } catch (error: any) {
            alert(`Failed to delete property: ${error.message}`)
        } finally {
            setDeletingId(null)
        }
    }

    // Client-side search filter
    const displayed = searchQuery.trim()
        ? properties.filter(p =>
            p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.area ?? "").toLowerCase().includes(searchQuery.toLowerCase())
        )
        : properties

    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

    return (
        <div className="space-y-6">
            {/* ── Header ───────────────────────────────────────────── */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 px-6 py-5 shadow-xl">
                {/* decorative blobs */}
                <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />

                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 border border-blue-500/20">
                            <Building2 className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-100 tracking-tight">Your Properties</h2>
                            <p className="text-xs text-slate-400">{totalCount} {totalCount === 1 ? "property" : "properties"} in portfolio</p>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search by name, city…"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full rounded-xl bg-slate-800/80 border border-slate-700/60 py-2.5 pl-9 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition min-h-[44px]"
                        />
                    </div>
                </div>

                {/* Filter tabs */}
                <div className="relative mt-4 flex gap-1 flex-wrap">
                    {FILTER_TABS.map(tab => (
                        <button
                            key={tab.value}
                            onClick={() => { setStatusFilter(tab.value); setPage(1) }}
                            className={[
                                "px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 min-h-[36px]",
                                statusFilter === tab.value
                                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/60",
                            ].join(" ")}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Loading skeleton ──────────────────────────────────── */}
            {loading && properties.length === 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="rounded-2xl overflow-hidden border border-slate-700/40 bg-slate-800/50 animate-pulse">
                            <div className="h-44 bg-slate-700/40" />
                            <div className="p-4 space-y-3">
                                <div className="h-4 w-2/3 rounded bg-slate-700/60" />
                                <div className="h-3 w-1/2 rounded bg-slate-700/40" />
                                <div className="flex gap-2 mt-4">
                                    <div className="h-3 w-10 rounded bg-slate-700/40" />
                                    <div className="h-3 w-10 rounded bg-slate-700/40" />
                                    <div className="h-3 w-12 rounded bg-slate-700/40" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Empty state ───────────────────────────────────────── */}
            {!loading && displayed.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center gap-4 rounded-2xl border border-slate-700/40 bg-slate-800/30">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 border border-slate-700/50">
                        <Home className="h-8 w-8 text-slate-500" />
                    </div>
                    <div>
                        <p className="text-slate-200 font-semibold">No properties found</p>
                        <p className="text-sm text-slate-500 mt-1">
                            {searchQuery ? "Try a different search term." : "Add your first property to get started."}
                        </p>
                    </div>
                </div>
            )}

            {/* ── Property Cards Grid ───────────────────────────────── */}
            {displayed.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {displayed.map(prop => {
                        const activeRental =
                            prop.rentals?.find(r => r.status === "approved" || r.status === "active") ||
                            prop.rentals?.[0]
                        const statusCfg = STATUS_CONFIG[prop.status] ?? STATUS_CONFIG.available
                        const rentalCfg = activeRental
                            ? (RENTAL_STATUS_CONFIG[activeRental.status] ?? RENTAL_STATUS_CONFIG.pending)
                            : null
                        const coverImage = prop.images?.[0]
                        const isDeleting = deletingId === prop.id

                        return (
                            <div
                                key={prop.id}
                                className="group relative flex flex-col rounded-2xl overflow-hidden border border-slate-700/40 bg-slate-800/60 backdrop-blur-sm shadow-lg hover:shadow-2xl hover:shadow-blue-900/10 hover:border-slate-600/60 transition-all duration-300 hover:-translate-y-0.5"
                            >
                                {/* ── Image / Placeholder ── */}
                                <div className="relative h-44 overflow-hidden flex-shrink-0">
                                    {coverImage ? (
                                        <img
                                            src={coverImage}
                                            alt={prop.title}
                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className={`h-full w-full bg-gradient-to-br ${placeholderGradient(prop.id)} flex items-center justify-center`}>
                                            <Building2 className="h-12 w-12 text-slate-600 opacity-60" />
                                        </div>
                                    )}
                                    {/* Status pill over image */}
                                    <div className="absolute top-3 left-3">
                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur-md ${statusCfg.color}`}>
                                            <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                                            {statusCfg.label}
                                        </span>
                                    </div>
                                    {/* Price pill */}
                                    <div className="absolute top-3 right-3">
                                        <span className="inline-flex items-center rounded-full bg-slate-900/80 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-slate-100 border border-slate-700/60">
                                            ₦{Number(prop.price).toLocaleString()}<span className="font-normal text-slate-400">/mo</span>
                                        </span>
                                    </div>
                                </div>

                                {/* ── Body ── */}
                                <div className="flex flex-col flex-1 p-4 gap-3">
                                    {/* Title + location */}
                                    <div>
                                        <h3 className="font-bold text-slate-100 text-[15px] leading-tight truncate group-hover:text-white transition-colors">
                                            {prop.title}
                                        </h3>
                                        <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                                            <MapPin className="h-3 w-3 flex-shrink-0" />
                                            <span className="truncate">{[prop.area, prop.city, prop.state].filter(Boolean).join(", ")}</span>
                                        </div>
                                    </div>

                                    {/* Quick stats */}
                                    <div className="flex items-center gap-3 text-xs text-slate-400 border-t border-slate-700/40 pt-3">
                                        {prop.bedrooms != null && (
                                            <span className="flex items-center gap-1">
                                                <BedDouble className="h-3.5 w-3.5 text-slate-500" />
                                                {prop.bedrooms} bed{prop.bedrooms !== 1 ? "s" : ""}
                                            </span>
                                        )}
                                        {prop.bathrooms != null && (
                                            <span className="flex items-center gap-1">
                                                <Bath className="h-3.5 w-3.5 text-slate-500" />
                                                {prop.bathrooms} bath{prop.bathrooms !== 1 ? "s" : ""}
                                            </span>
                                        )}
                                        {prop.square_footage != null && (
                                            <span className="flex items-center gap-1">
                                                <Ruler className="h-3.5 w-3.5 text-slate-500" />
                                                {Number(prop.square_footage).toLocaleString()} sqft
                                            </span>
                                        )}
                                        {!prop.bedrooms && !prop.bathrooms && !prop.square_footage && (
                                            <span className="capitalize text-slate-500">{prop.type}</span>
                                        )}
                                    </div>

                                    {/* Tenant row */}
                                    <div className="flex items-center justify-between min-h-[28px]">
                                        {activeRental ? (
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 border border-slate-600">
                                                    <User className="h-3 w-3 text-slate-400" />
                                                </div>
                                                <span className="text-xs text-slate-300 truncate max-w-[120px]">
                                                    {activeRental.tenant?.name || "Tenant"}
                                                </span>
                                                {rentalCfg && (
                                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${rentalCfg.color}`}>
                                                        {rentalCfg.label}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-600 italic">No active tenant</span>
                                        )}
                                    </div>

                                    {/* ── Actions ── */}
                                    <div className="flex items-center gap-2 pt-1 border-t border-slate-700/40">
                                        <a
                                            href={`/properties/${prop.id}`}
                                            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-700/50 hover:bg-slate-700 hover:text-white border border-slate-600/40 transition-all duration-150"
                                        >
                                            <Eye className="h-3.5 w-3.5" />
                                            View
                                        </a>
                                        <button
                                            onClick={() => { setEditingProperty(prop); setIsDialogOpen(true) }}
                                            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-blue-300 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 hover:border-blue-500/40 transition-all duration-150"
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteProperty(prop.id)}
                                            disabled={isDeleting}
                                            className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isDeleting
                                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                : <Trash2 className="h-3.5 w-3.5" />
                                            }
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* ── Pagination ────────────────────────────────────────── */}
            {totalCount > pageSize && (
                <div className="flex items-center justify-between rounded-xl border border-slate-700/40 bg-slate-800/40 px-5 py-3">
                    <p className="text-xs text-slate-400">
                        Showing <span className="text-slate-200 font-medium">{(page - 1) * pageSize + 1}</span>–
                        <span className="text-slate-200 font-medium">{Math.min(page * pageSize, totalCount)}</span> of{" "}
                        <span className="text-slate-200 font-medium">{totalCount}</span> properties
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-700/60 hover:bg-slate-700 border border-slate-600/40 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                            <ChevronLeft className="h-3.5 w-3.5" /> Prev
                        </button>
                        <span className="text-xs text-slate-400 px-1">{page} / {totalPages}</span>
                        <button
                            onClick={() => setPage(p => p + 1)}
                            disabled={page >= totalPages}
                            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-700/60 hover:bg-slate-700 border border-slate-600/40 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                            Next <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            )}

            {/* ── Edit Dialog ───────────────────────────────────────── */}
            <Dialog open={isDialogOpen} onOpenChange={open => { setIsDialogOpen(open); if (!open) setEditingProperty(null) }}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Edit Property</DialogTitle>
                        <DialogDescription>Make changes to your property listing here.</DialogDescription>
                    </DialogHeader>
                    {editingProperty && (
                        <PropertyEditForm property={editingProperty} onSuccess={handleEditSuccess} />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
