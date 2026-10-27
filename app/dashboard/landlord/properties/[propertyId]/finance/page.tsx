"use client"

import React, { useState, useEffect, use } from "react"
import Link from "next/link"
import { ArrowLeft, Building2, DollarSign, Users, AlertCircle, CheckCircle2, Clock, Loader2, Home } from "lucide-react"

export default function PropertyFinancialsPage({ params }: { params: Promise<{ propertyId: string }> }) {
    const { propertyId } = use(params)
    const [propertyData, setPropertyData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        loadPropertyFinance()
    }, [propertyId])

    async function loadPropertyFinance() {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch(`/api/landlord/properties/${propertyId}/finance`)
            if (res.ok) {
                const data = await res.json()
                setPropertyData(data)
            } else {
                const data = await res.json().catch(() => null)
                setPropertyData(null)
                setError(data?.error || "Unable to load property finance.")
            }
        } catch (err) {
            console.error("Error loading property finance:", err)
            setPropertyData(null)
            setError("Unable to load property finance.")
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-xs text-slate-400">Loading property financial breakdown...</p>
            </div>
        )
    }

    const {
        propertyTitle = "Property Financials",
        expectedRevenue = 0,
        collectedRevenue = 0,
        outstandingAmount = 0,
        occupancyRate = 0,
        units = []
    } = propertyData || {}

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-6">
            <div className="max-w-6xl mx-auto space-y-6">
                <button
                    onClick={() => window.history.back()}
                    className="flex items-center space-x-2 text-slate-400 hover:text-white text-xs font-medium transition"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Portfolio</span>
                </button>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                    <div>
                        <span className="text-xs text-blue-400 font-mono uppercase tracking-widest">PROPERTY FINANCIAL REPORT</span>
                        <h1 className="text-2xl font-bold text-white mt-1">{propertyTitle}</h1>
                    </div>
                    <div className="flex items-center space-x-2 text-xs">
                        <span className="px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-xl font-semibold">
                            Occupancy: {occupancyRate}%
                        </span>
                    </div>
                </div>

                {error && (
                    <div className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Summary Financial Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                        <span className="text-xs text-slate-400 block mb-1">Expected Revenue</span>
                        <div className="text-xl font-bold text-white">${expectedRevenue.toLocaleString()}</div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                        <span className="text-xs text-slate-400 block mb-1">Collected Revenue</span>
                        <div className="text-xl font-bold text-emerald-400">${collectedRevenue.toLocaleString()}</div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                        <span className="text-xs text-slate-400 block mb-1">Outstanding Balance</span>
                        <div className="text-xl font-bold text-amber-400">${outstandingAmount.toLocaleString()}</div>
                    </div>
                </div>

                {/* Multi-Unit Financial Breakdown Table / Cards */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                    <h3 className="font-bold text-base text-white flex items-center space-x-2">
                        <Home className="w-4 h-4 text-blue-400" />
                        <span>Unit-by-Unit Financial Ledger</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {units.map((unit: any) => (
                            <div key={unit.id} className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold text-white text-sm">{unit.name}</h4>
                                    <p className="text-xs text-slate-400 mt-0.5">{unit.tenantName}</p>
                                    <p className="text-xs text-slate-500 mt-1">Rent: ${Number(unit.rent).toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    {unit.status === "Paid" && (
                                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-semibold">
                                            Paid
                                        </span>
                                    )}
                                    {unit.status === "Overdue" && (
                                        <div className="text-right space-y-0.5">
                                            <span className="px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-full text-xs font-semibold">
                                                Overdue
                                            </span>
                                            <span className="text-xs text-rose-300 block font-medium">${Number(unit.overdueAmount).toLocaleString()}</span>
                                        </div>
                                    )}
                                    {unit.status === "Partially Paid" && (
                                        <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-xs font-semibold">
                                            Partially Paid
                                        </span>
                                    )}
                                    {unit.status === "Vacant" && (
                                        <span className="px-2.5 py-1 bg-slate-800 text-slate-400 rounded-full text-xs font-semibold">
                                            Vacant
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
