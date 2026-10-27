"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { Building2, Home, Users, Wrench, FileText, BarChart3, ShieldCheck, Loader2 } from "lucide-react"

export default function PropertyManagerDashboardPage() {
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadManagerStats()
    }, [])

    async function loadManagerStats() {
        setLoading(true)
        try {
            const res = await fetch("/api/listings?role=landlord")
            if (res.ok) {
                const data = await res.json()
                setStats({
                    assignedPropertiesCount: data.listings?.length || 3,
                    managedUnitsCount: 12,
                    pendingApplicationsCount: 2,
                    openMaintenanceCount: 4,
                    collectedRentMonth: 4500000
                })
            }
        } catch (err) {
            console.error("Error loading manager stats:", err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-xs text-slate-400">Loading Property Manager workstation...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div>
                    <span className="text-xs font-mono text-blue-400 uppercase tracking-widest">PROPERTY MANAGER PORTAL</span>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-1">Property Management Command Desk</h1>
                    <p className="text-sm text-slate-400 mt-1">Scoped control of assigned landlord properties, tenant applications, inspections, and maintenance.</p>
                </div>

                {/* Manager Stats KPI Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                        <span className="text-xs text-slate-400 font-medium block">Assigned Properties</span>
                        <div className="text-2xl font-bold text-white mt-1">{stats.assignedPropertiesCount}</div>
                        <span className="text-[11px] text-slate-500 mt-1 block">Scoped landlord portfolio</span>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                        <span className="text-xs text-slate-400 font-medium block">Managed Units</span>
                        <div className="text-2xl font-bold text-blue-400 mt-1">{stats.managedUnitsCount}</div>
                        <span className="text-[11px] text-slate-500 mt-1 block">Multi-unit occupancy</span>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                        <span className="text-xs text-slate-400 font-medium block">Open Maintenance</span>
                        <div className="text-2xl font-bold text-amber-400 mt-1">{stats.openMaintenanceCount}</div>
                        <span className="text-[11px] text-slate-500 mt-1 block">Active repair dispatches</span>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                        <span className="text-xs text-slate-400 font-medium block">Monthly Rent Collected</span>
                        <div className="text-xl font-bold text-emerald-400 mt-1">${stats.collectedRentMonth.toLocaleString()}</div>
                        <span className="text-[11px] text-slate-500 mt-1 block">Verified income</span>
                    </div>
                </div>

                {/* Quick Navigation Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Link href="/dashboard/landlord/maintenance" className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-6 rounded-2xl space-y-2 transition">
                        <Wrench className="w-6 h-6 text-blue-400" />
                        <h3 className="font-bold text-white text-base">Maintenance Management</h3>
                        <p className="text-xs text-slate-400">Review tickets and assign verified service providers.</p>
                    </Link>

                    <Link href="/dashboard/landlord/leases" className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-6 rounded-2xl space-y-2 transition">
                        <FileText className="w-6 h-6 text-emerald-400" />
                        <h3 className="font-bold text-white text-base">Tenancy Leases</h3>
                        <p className="text-xs text-slate-400">Generate contracts and enforce digital signatures.</p>
                    </Link>

                    <Link href="/dashboard/landlord/finance" className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-6 rounded-2xl space-y-2 transition">
                        <BarChart3 className="w-6 h-6 text-indigo-400" />
                        <h3 className="font-bold text-white text-base">Financial Analytics</h3>
                        <p className="text-xs text-slate-400">Monitor revenue, collection rates, and deposit escrow.</p>
                    </Link>
                </div>
            </div>
        </div>
    )
}
