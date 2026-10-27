"use client"

import React, { useState, useEffect } from "react"
import { Wrench, AlertOctagon, CheckCircle2, Clock, Users, UserCheck, MapPin, DollarSign, Filter, Search, Loader2, ExternalLink } from "lucide-react"

type TechnicianLocation = {
    latitude: number
    longitude: number
    updatedAt?: string | null
}

function getTechnicianLocation(ticket: any): TechnicianLocation | null {
    const rawLocation = ticket?.technician_location || ticket?.provider_location || ticket?.assigned_provider?.location
    if (!rawLocation || typeof rawLocation !== "object") return null

    const latitude = Number(rawLocation.latitude ?? rawLocation.lat)
    const longitude = Number(rawLocation.longitude ?? rawLocation.lng ?? rawLocation.lon)

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null

    return {
        latitude,
        longitude,
        updatedAt: rawLocation.updated_at || rawLocation.timestamp || rawLocation.recorded_at || null,
    }
}

export default function LandlordMaintenanceDashboardPage() {
    const [tickets, setTickets] = useState<any[]>([])
    const [providers, setProviders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState("all")

    // Assign modal state
    const [selectedTicket, setSelectedTicket] = useState<any | null>(null)
    const [selectedProviderId, setSelectedProviderId] = useState("")
    const [isAssigning, setIsAssigning] = useState(false)

    // Live Tracking modal state
    const [trackingTicket, setTrackingTicket] = useState<any | null>(null)

    useEffect(() => {
        loadMaintenanceData()
    }, [statusFilter])

    async function loadMaintenanceData() {
        setLoading(true)
        try {
            const ticketRes = await fetch(`/api/maintenance?role=landlord${statusFilter !== "all" ? `&status=${statusFilter}` : ""}`)
            if (ticketRes.ok) {
                const data = await ticketRes.json()
                setTickets(data.tickets || [])
            }

            const provRes = await fetch("/api/providers")
            if (provRes.ok) {
                const provData = await provRes.json()
                setProviders(provData.providers || [])
            }
        } catch (err) {
            console.error("Error loading maintenance tickets:", err)
        } finally {
            setLoading(false)
        }
    }

    const handleAssignProvider = async () => {
        if (!selectedTicket || !selectedProviderId) return
        setIsAssigning(true)

        try {
            const res = await fetch(`/api/maintenance/${selectedTicket.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "assign",
                    providerId: selectedProviderId
                })
            })

            if (res.ok) {
                setSelectedTicket(null)
                setSelectedProviderId("")
                loadMaintenanceData()
            }
        } catch (err) {
            console.error("Assignment error:", err)
        } finally {
            setIsAssigning(false)
        }
    }

    const openCount = tickets.filter(t => t.status === "Submitted" || t.status === "Reviewed").length
    const pendingCount = tickets.filter(t => t.status === "Assigned" || t.status === "Accepted" || t.status === "In Progress").length
    const completedCount = tickets.filter(t => t.status === "Completed").length
    const emergencyCount = tickets.filter(t => t.is_emergency && t.status !== "Completed").length
    const totalCost = tickets.reduce((sum, t) => sum + Number(t.total_cost || 0), 0)
    const trackingLocation = trackingTicket ? getTechnicianLocation(trackingTicket) : null

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Maintenance Command Desk</h1>
                    <p className="text-sm text-slate-400 mt-1">Review tenant repair tickets, dispatch verified service providers, and track live technician ETA.</p>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                        <span className="text-xs text-slate-400 font-medium block">Open Requests</span>
                        <div className="text-2xl font-bold text-amber-400 mt-1">{openCount}</div>
                        <span className="text-[11px] text-slate-500 mt-1 block">Awaiting provider dispatch</span>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                        <span className="text-xs text-slate-400 font-medium block">In Progress</span>
                        <div className="text-2xl font-bold text-blue-400 mt-1">{pendingCount}</div>
                        <span className="text-[11px] text-slate-500 mt-1 block">Technician working/en-route</span>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                        <span className="text-xs text-slate-400 font-medium block">Completed</span>
                        <div className="text-2xl font-bold text-emerald-400 mt-1">{completedCount}</div>
                        <span className="text-[11px] text-slate-500 mt-1 block">Signed off by tenant</span>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                        <span className="text-xs text-slate-400 font-medium block">Emergency Alerts</span>
                        <div className={`text-2xl font-bold mt-1 ${emergencyCount > 0 ? "text-rose-400 animate-pulse" : "text-slate-400"}`}>
                            {emergencyCount}
                        </div>
                        <span className="text-[11px] text-slate-500 mt-1 block">Immediate dispatch required</span>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                        <span className="text-xs text-slate-400 font-medium block">Total Maintenance Cost</span>
                        <div className="text-xl font-bold text-white mt-1">${totalCost.toLocaleString()}</div>
                        <span className="text-[11px] text-slate-500 mt-1 block">Verified repair bills</span>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center space-x-2 overflow-x-auto pb-1 bg-slate-900 border border-slate-800 p-2 rounded-2xl">
                    <Filter className="w-4 h-4 text-slate-400 ml-2 shrink-0" />
                    {[
                        { id: "all", label: "All Tickets" },
                        { id: "Submitted", label: "Submitted" },
                        { id: "Assigned", label: "Assigned" },
                        { id: "Technician On The Way", label: "En-Route" },
                        { id: "In Progress", label: "In Progress" },
                        { id: "Completed", label: "Completed" },
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => setStatusFilter(f.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ${statusFilter === f.id ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Tickets Grid */}
                {loading ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                        Loading maintenance tickets...
                    </div>
                ) : tickets.length === 0 ? (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs">
                        No maintenance requests found matching current filter.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {tickets.map((ticket) => (
                            <div key={ticket.id} className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition shadow-lg">
                                <div className="space-y-2 flex-1">
                                    <div className="flex items-center space-x-2">
                                        <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-full text-[11px] font-bold">
                                            {ticket.category}
                                        </span>
                                        {ticket.is_emergency && (
                                            <span className="px-2.5 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-full text-[11px] font-bold animate-pulse">
                                                🚨 EMERGENCY
                                            </span>
                                        )}
                                        <span className="text-xs text-slate-500 font-mono">#{ticket.ticket_number}</span>
                                    </div>

                                    <h3 className="font-bold text-white text-base">{ticket.title}</h3>
                                    <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">{ticket.description}</p>

                                    <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                                        <span>📍 {ticket.property?.title}</span>
                                        <span>👤 Tenant: <strong className="text-white">{ticket.tenant?.name}</strong></span>
                                        <span>🛠️ Tech: <strong className="text-blue-400">{ticket.assigned_provider?.name || "Unassigned"}</strong></span>
                                        <span>Status: <strong className="text-amber-400">{ticket.status}</strong></span>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2 shrink-0">
                                    {!ticket.assigned_provider_id && (
                                        <button
                                            onClick={() => setSelectedTicket(ticket)}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow transition flex items-center space-x-1.5"
                                        >
                                            <UserCheck className="w-4 h-4" />
                                            <span>Assign Provider</span>
                                        </button>
                                    )}

                                    {ticket.status === "Technician On The Way" || ticket.status === "In Progress" ? (
                                        <button
                                            onClick={() => setTrackingTicket(ticket)}
                                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow transition flex items-center space-x-1.5 animate-pulse"
                                        >
                                            <MapPin className="w-4 h-4" />
                                            <span>Track Live Location</span>
                                        </button>
                                    ) : null}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Assign Provider Modal */}
                {selectedTicket && (
                    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 text-slate-100 shadow-2xl">
                            <h3 className="font-bold text-base text-white">Assign Verified Technician</h3>
                            <p className="text-xs text-slate-400">Select an approved service provider for ticket #{selectedTicket.ticket_number} ({selectedTicket.category}):</p>

                            <select
                                value={selectedProviderId}
                                onChange={(e) => setSelectedProviderId(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">-- Select Verified Service Provider --</option>
                                {providers.map((p: any) => (
                                    <option key={p.id} value={p.id}>
                                        {p.profile?.name || 'Technician'} ({p.trade_category}) — Rating: ⭐{p.rating_average || 5.0}
                                    </option>
                                ))}
                            </select>

                            <div className="flex justify-end space-x-2 pt-2">
                                <button onClick={() => setSelectedTicket(null)} className="px-4 py-2 bg-slate-800 text-xs rounded-xl">Cancel</button>
                                <button
                                    onClick={handleAssignProvider}
                                    disabled={!selectedProviderId || isAssigning}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center space-x-1"
                                >
                                    {isAssigning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                                    <span>Dispatch Job</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Technician Location Modal */}
                {trackingTicket && (
                    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 text-slate-100">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                                <h3 className="font-bold text-base text-white flex items-center space-x-2">
                                    <MapPin className="w-4 h-4 text-emerald-400" />
                                    <span>Technician Location</span>
                                </h3>
                                <button onClick={() => setTrackingTicket(null)} className="text-slate-400 hover:text-white text-xs">Close [X]</button>
                            </div>

                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
                                <p className="text-slate-400">Technician: <strong className="text-white">{trackingTicket.assigned_provider?.name || 'Technician'}</strong></p>
                                <p className="text-slate-400">Status: <strong className="text-emerald-400">{trackingTicket.status}</strong></p>
                                {trackingLocation ? (
                                    <div className="space-y-3">
                                        <div className="rounded-lg border border-slate-800 bg-slate-900 p-3 text-slate-300">
                                            <p>Latitude: <strong className="text-white">{trackingLocation.latitude.toFixed(6)}</strong></p>
                                            <p>Longitude: <strong className="text-white">{trackingLocation.longitude.toFixed(6)}</strong></p>
                                            {trackingLocation.updatedAt && (
                                                <p className="text-slate-500 mt-1">Updated: {new Date(trackingLocation.updatedAt).toLocaleString()}</p>
                                            )}
                                        </div>
                                        <a
                                            href={`https://www.openstreetmap.org/?mlat=${trackingLocation.latitude}&mlon=${trackingLocation.longitude}#map=17/${trackingLocation.latitude}/${trackingLocation.longitude}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500"
                                        >
                                            <ExternalLink className="h-3.5 w-3.5" />
                                            Open Map
                                        </a>
                                    </div>
                                ) : (
                                    <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900 p-4 text-slate-400">
                                        No live technician location has been shared for this job yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
