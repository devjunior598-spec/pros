"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { FileText, CheckCircle2, Clock, AlertCircle, ExternalLink, Download, MessageSquare, Loader2 } from "lucide-react"

export default function TenantLeasesPage() {
    const [leases, setLeases] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchTenantLeases()
    }, [])

    async function fetchTenantLeases() {
        setLoading(true)
        try {
            const res = await fetch("/api/leases?role=tenant")
            if (res.ok) {
                const data = await res.json()
                setLeases(data.leases || [])
            }
        } catch (err) {
            console.error("Error fetching tenant leases:", err)
        } finally {
            setLoading(false)
        }
    }

    const calculateDaysLeft = (endDateStr: string) => {
        if (!endDateStr) return 0
        const end = new Date(endDateStr)
        const diff = end.getTime() - new Date().getTime()
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">My Digital Lease Agreements</h1>
                    <p className="text-sm text-slate-400 mt-1">Review active and pending tenancy contracts, provide digital signatures, and view payment schedules.</p>
                </div>

                {loading ? (
                    <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-3">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        <p className="text-xs text-slate-400">Loading your lease contracts...</p>
                    </div>
                ) : leases.length === 0 ? (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
                        <FileText className="w-12 h-12 text-slate-600 mx-auto" />
                        <h3 className="text-base font-semibold text-white">No Lease Contracts Available</h3>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">Once a landlord approves your rental application and issues a lease agreement, it will appear here for review and digital signature.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {leases.map((lease) => {
                            const daysLeft = calculateDaysLeft(lease.end_date)
                            const isPendingSignature = lease.status === "Sent" || lease.status === "Viewed" || lease.status === "Landlord Signed"

                            return (
                                <div
                                    key={lease.id}
                                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 flex flex-col justify-between transition shadow-lg"
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-2 mb-3">
                                            {isPendingSignature ? (
                                                <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-xs font-semibold animate-pulse">
                                                    Action Required: Sign Lease
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-semibold">
                                                    {lease.status}
                                                </span>
                                            )}
                                            <span className="text-xs text-slate-500 font-mono">#{lease.id.substring(0, 8)}</span>
                                        </div>

                                        <h3 className="font-bold text-white text-lg">{lease.title}</h3>
                                        <p className="text-xs text-slate-400 mt-1">📍 {lease.property?.title} — {lease.property?.address}</p>

                                        <div className="mt-4 pt-3 border-t border-slate-800 space-y-2 text-xs text-slate-300">
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Landlord:</span>
                                                <span className="font-medium text-white">{lease.landlord?.name}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Rent Amount:</span>
                                                <span className="font-bold text-emerald-400">${Number(lease.rent_amount).toLocaleString()} / {lease.payment_frequency}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Days Until Expiration:</span>
                                                <span className="font-semibold text-blue-400">{daysLeft} Days</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                                        <Link
                                            href={`/dashboard/tenant/leases/${lease.id}`}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition flex items-center space-x-1.5"
                                        >
                                            <span>{isPendingSignature ? "Review & Sign Lease" : "View Contract"}</span>
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </Link>

                                        <Link
                                            href={`/messages?recipientId=${lease.landlord_id}`}
                                            className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition"
                                            title="Message Landlord"
                                        >
                                            <MessageSquare className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
