"use client"

import React, { useState, useEffect } from "react"
import { DollarSign, TrendingUp, Building2, Users, ShieldCheck, Activity, Star, BarChart3, Loader2 } from "lucide-react"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts"

export default function CEODashboardPage() {
    const [metrics, setMetrics] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadCEOMetrics()
    }, [])

    async function loadCEOMetrics() {
        setLoading(true)
        try {
            const res = await fetch("/api/ceo/metrics")
            if (res.ok) {
                const data = await res.json()
                setMetrics(data)
            }
        } catch (err) {
            console.error("Error loading CEO metrics:", err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-xs text-slate-400">Loading Executive Leadership Metrics...</p>
            </div>
        )
    }

    const {
        grossRevenue = 0,
        prmsCommission = 0,
        expenses = 0,
        netProfit = 0,
        propertiesCount = 0,
        tenantsCount = 0,
        landlordsCount = 0,
        activeMaintenanceCount = 0,
        supportTicketsCount = 0,
        csatScore = 4.8
    } = metrics?.metrics || {}

    const monthlyGrowth = metrics?.monthlyGrowth || []

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <div>
                    <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest">EXECUTIVE COMMAND CENTER</span>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-1">PRMS Enterprise CEO Dashboard</h1>
                    <p className="text-sm text-slate-400 mt-1">High-level financial performance, growth trends, operational workload, and CSAT customer satisfaction index.</p>
                </div>

                {/* Executive KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                        <span className="text-xs text-slate-400 font-medium block">Gross Platform Volume</span>
                        <div className="text-2xl font-bold text-emerald-400 mt-1">${grossRevenue.toLocaleString()}</div>
                        <span className="text-[11px] text-slate-500 mt-1 block">Total rent & fee volume</span>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                        <span className="text-xs text-slate-400 font-medium block">PRMS Net Revenue</span>
                        <div className="text-2xl font-bold text-blue-400 mt-1">${prmsCommission.toLocaleString()}</div>
                        <span className="text-[11px] text-slate-500 mt-1 block">Platform commissions</span>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                        <span className="text-xs text-slate-400 font-medium block">Net Operating Profit</span>
                        <div className="text-2xl font-bold text-white mt-1">${netProfit.toLocaleString()}</div>
                        <span className="text-[11px] text-slate-500 mt-1 block">After operating expenses</span>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                        <span className="text-xs text-slate-400 font-medium block">Customer Satisfaction (CSAT)</span>
                        <div className="text-2xl font-bold text-amber-400 mt-1">⭐ {csatScore} / 5.0</div>
                        <span className="text-[11px] text-slate-500 mt-1 block">Tenant & Landlord score</span>
                    </div>
                </div>

                {/* Portfolio Ecosystem Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center">
                        <span className="text-xs text-slate-400 block">Total Properties</span>
                        <span className="text-xl font-bold text-white mt-1 block">{propertiesCount}</span>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center">
                        <span className="text-xs text-slate-400 block">Active Tenants</span>
                        <span className="text-xl font-bold text-blue-400 mt-1 block">{tenantsCount}</span>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center">
                        <span className="text-xs text-slate-400 block">Registered Landlords</span>
                        <span className="text-xl font-bold text-emerald-400 mt-1 block">{landlordsCount}</span>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center">
                        <span className="text-xs text-slate-400 block">Active Workload</span>
                        <span className="text-xl font-bold text-amber-400 mt-1 block">{activeMaintenanceCount} Repair / {supportTicketsCount} Support</span>
                    </div>
                </div>

                {/* Growth Recharts */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                    <h3 className="font-bold text-base text-white flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        <span>Platform Revenue & Profit Expansion Trend</span>
                    </h3>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthlyGrowth}>
                                <defs>
                                    <linearGradient id="ceoRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} />
                                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v / 1000}k`} />
                                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", fontSize: "12px" }} />
                                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#ceoRev)" name="Gross Revenue ($)" />
                                <Area type="monotone" dataKey="profit" stroke="#10b981" fillOpacity={0} name="Net Profit ($)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    )
}
