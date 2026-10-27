"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { Plus, Search, Filter, FileText, CheckCircle2, Clock, AlertTriangle, XCircle, FileSignature, MessageSquare, ExternalLink, Download, Loader2 } from "lucide-react"

export default function LandlordLeasesPage() {
    const [leases, setLeases] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState("all")
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        fetchLeases()
    }, [statusFilter])

    async function fetchLeases() {
        setLoading(true)
        try {
            const url = `/api/leases?role=landlord${statusFilter !== "all" ? `&status=${statusFilter}` : ""}`
            const res = await fetch(url)
            if (res.ok) {
                const data = await res.json()
                setLeases(data.leases || [])
            }
        } catch (err) {
            console.error("Error fetching landlord leases:", err)
        } finally {
            setLoading(false)
        }
    }

    const filteredLeases = leases.filter(lease => {
        const matchesSearch =
            lease.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lease.tenant?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lease.property?.title?.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesSearch
    })

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "Draft":
                return <span className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-full text-xs font-semibold">Draft</span>
            case "Sent":
            case "Viewed":
                return <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-full text-xs font-semibold">Sent to Tenant</span>
            case "Tenant Signed":
                return <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-xs font-semibold">Awaiting Your Signature</span>
            case "Landlord Signed":
                return <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-full text-xs font-semibold">Awaiting Tenant Signature</span>
            case "Fully Signed":
            case "Active":
                return <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-semibold">Active & Signed</span>
            case "Expiring Soon":
                return <span className="px-2.5 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-full text-xs font-semibold">Expiring Soon</span>
            case "Expired":
            case "Terminated":
            case "Cancelled":
                return <span className="px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-full text-xs font-semibold">{status}</span>
            default:
                return <span className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-full text-xs font-semibold">{status}</span>
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header Title & CTA */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Lease Agreements</h1>
                        <p className="text-sm text-slate-400 mt-1">Manage digital tenancy contracts, track signature status, and initiate renewals.</p>
                    </div>
                    <Link
                        href="/dashboard/landlord/leases/new"
                        className="inline-flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Create New Lease</span>
                    </Link>
                </div>

                {/* Search & Filters */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-2xl">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search leases by title, tenant, or property..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0">
                        <Filter className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
                        {[
                            { id: "all", label: "All Leases" },
                            { id: "Draft", label: "Drafts" },
                            { id: "Sent", label: "Awaiting Signature" },
                            { id: "Active", label: "Active" },
                            { id: "Expiring Soon", label: "Expiring Soon" },
                            { id: "Terminated", label: "Terminated" },
                        ].map((f) => (
                            <button
                                key={f.id}
                                onClick={() => setStatusFilter(f.id)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ${statusFilter === f.id
                                        ? "bg-blue-600 text-white shadow-md"
                                        : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Leases Grid / List */}
                {loading ? (
                    <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-3">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        <p className="text-xs text-slate-400">Loading lease contracts...</p>
                    </div>
                ) : filteredLeases.length === 0 ? (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
                        <FileText className="w-12 h-12 text-slate-600 mx-auto" />
                        <div>
                            <h3 className="text-base font-semibold text-white">No Lease Contracts Found</h3>
                            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">You haven't created any leases matching the current filter.</p>
                        </div>
                        <Link
                            href="/dashboard/landlord/leases/new"
                            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Create First Lease</span>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredLeases.map((lease) => (
                            <div
                                key={lease.id}
                                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition shadow-lg group"
                            >
                                <div>
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        {getStatusBadge(lease.status)}
                                        <span className="text-xs text-slate-500 font-mono">#{lease.id.substring(0, 8)}</span>
                                    </div>
                                    <h3 className="font-bold text-white text-base group-hover:text-blue-400 transition line-clamp-1">
                                        {lease.title}
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                                        📍 {lease.property?.title || 'Property'} — {lease.property?.address || ''}
                                    </p>
                                    <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-300">
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Tenant:</span>
                                            <span className="font-semibold text-white">{lease.tenant?.name || 'Unassigned'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Rent Amount:</span>
                                            <span className="font-semibold text-emerald-400">${Number(lease.rent_amount).toLocaleString()} / {lease.payment_frequency}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Duration:</span>
                                            <span>{lease.start_date} to {lease.end_date}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                                    <Link
                                        href={`/dashboard/landlord/leases/${lease.id}`}
                                        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition"
                                    >
                                        <span>View Details & Sign</span>
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </Link>
                                    <div className="flex items-center space-x-2">
                                        {lease.tenant_id && (
                                            <Link
                                                href={`/messages?recipientId=${lease.tenant_id}`}
                                                className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
                                                title="Message Tenant"
                                            >
                                                <MessageSquare className="w-4 h-4" />
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
