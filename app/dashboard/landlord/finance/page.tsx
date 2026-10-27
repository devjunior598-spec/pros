"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { DollarSign, TrendingUp, ShieldCheck, AlertCircle, PieChart as PieIcon, BarChart3, Download, Filter, Building2, Users, Loader2 } from "lucide-react"
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from "recharts"

export default function LandlordFinancialDashboardPage() {
    const [financials, setFinancials] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [selectedProperty, setSelectedProperty] = useState("all")
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        loadLandlordFinance()
    }, [selectedProperty])

    async function loadLandlordFinance() {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch(`/api/landlord/finance?propertyId=${selectedProperty}`)
            if (res.ok) {
                const data = await res.json()
                setFinancials(data)
            } else {
                const data = await res.json().catch(() => null)
                setFinancials(null)
                setError(data?.error || "Unable to load finance analytics.")
            }
        } catch (err) {
            console.error("Error fetching landlord finance data:", err)
            setFinancials(null)
            setError("Unable to load finance analytics.")
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-xs text-slate-400">Loading landlord financial dashboard analytics...</p>
            </div>
        )
    }

    const {
        totalCollected = 0,
        totalExpected = 0,
        outstandingRent = 0,
        overdueRent = 0,
        securityDepositsHeld = 0,
        collectionRate = 0,
        paidTenantsCount = 0,
        overdueTenantsCount = 0,
        monthlyData = [],
        propertyBreakdown = []
    } = financials || {}

    const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"]

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Landlord Financial Dashboard</h1>
                        <p className="text-sm text-slate-400 mt-1">Real-time revenue monitoring, collection rate metrics, deposit tracking, and financial reports.</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => alert("Downloading CSV Financial Report...")}
                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-white transition flex items-center space-x-1.5"
                        >
                            <Download className="w-4 h-4 text-blue-400" />
                            <span>Export CSV</span>
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
                        <span>{error}</span>
                    </div>
                )}

                {/* KPI Metrics Row 1 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                        <span className="text-xs text-slate-400 font-medium block">Total Rent Collected</span>
                        <div className="text-2xl font-bold text-emerald-400 mt-1">${totalCollected.toLocaleString()}</div>
                        <span className="text-[11px] text-slate-500 mt-1 block">Verified income received</span>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                        <span className="text-xs text-slate-400 font-medium block">Total Expected Rent</span>
                        <div className="text-2xl font-bold text-white mt-1">${totalExpected.toLocaleString()}</div>
                        <span className="text-[11px] text-slate-500 mt-1 block">Gross contract value</span>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                        <span className="text-xs text-slate-400 font-medium block">Outstanding Rent</span>
                        <div className="text-2xl font-bold text-amber-400 mt-1">${outstandingRent.toLocaleString()}</div>
                        <span className="text-[11px] text-slate-500 mt-1 block">Pending tenant balances</span>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                        <span className="text-xs text-slate-400 font-medium block">Overdue Rent</span>
                        <div className="text-2xl font-bold text-rose-400 mt-1">${overdueRent.toLocaleString()}</div>
                        <span className="text-[11px] text-slate-500 mt-1 block">{overdueTenantsCount} Overdue Tenant(s)</span>
                    </div>
                </div>

                {/* KPI Metrics Row 2 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                        <span className="text-xs text-slate-400 font-medium block">Security Deposits Held</span>
                        <div className="text-xl font-bold text-blue-400 mt-1">${securityDepositsHeld.toLocaleString()}</div>
                        <span className="text-[11px] text-slate-500 mt-1 block">Tracked in escrow ledger</span>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                        <span className="text-xs text-slate-400 font-medium block">Rent Collection Rate</span>
                        <div className="text-xl font-bold text-emerald-400 mt-1">{collectionRate}%</div>
                        <span className="text-[11px] text-slate-500 mt-1 block">Paid vs Total Due</span>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                        <span className="text-xs text-slate-400 font-medium block">Tenant Compliance</span>
                        <div className="text-xl font-bold text-white mt-1">{paidTenantsCount} Paid / {overdueTenantsCount} Overdue</div>
                        <span className="text-[11px] text-slate-500 mt-1 block">Active tenancy stats</span>
                    </div>
                </div>

                {/* Recharts Analytics Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Revenue Trend Area Chart */}
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-base text-white flex items-center space-x-2">
                                <TrendingUp className="w-4 h-4 text-emerald-400" />
                                <span>Monthly Revenue Performance</span>
                            </h3>
                        </div>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={monthlyData}>
                                    <defs>
                                        <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} />
                                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v / 1000}k`} />
                                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", fontSize: "12px" }} />
                                    <Area type="monotone" dataKey="collected" stroke="#10b981" fillOpacity={1} fill="url(#colorCollected)" name="Collected ($)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Revenue by Property Bar Chart */}
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-base text-white flex items-center space-x-2">
                                <BarChart3 className="w-4 h-4 text-blue-400" />
                                <span>Revenue by Property</span>
                            </h3>
                        </div>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={propertyBreakdown}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} />
                                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v / 1000}k`} />
                                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", fontSize: "12px" }} />
                                    <Bar dataKey="collected" fill="#3b82f6" name="Collected ($)" radius={[6, 6, 0, 0]} />
                                    <Bar dataKey="outstanding" fill="#f59e0b" name="Outstanding ($)" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
