"use client"

import React, { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, FileText, CheckCircle2, ShieldCheck, Download, Calendar, DollarSign, User, AlertCircle, Loader2, XCircle, RefreshCw, MessageSquare } from "lucide-react"
import { DigitalSignaturePad } from "@/components/digital-signature-pad"

export default function LandlordLeaseDetailsPage({ params }: { params: Promise<{ leaseId: string }> }) {
    const { leaseId } = use(params)
    const router = useRouter()

    const [lease, setLease] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showSignatureModal, setShowSignatureModal] = useState(false)
    const [isSigning, setIsSigning] = useState(false)

    useEffect(() => {
        fetchLeaseDetails()
    }, [leaseId])

    async function fetchLeaseDetails() {
        setLoading(true)
        try {
            const res = await fetch(`/api/leases/${leaseId}`)
            if (!res.ok) {
                const errData = await res.json()
                throw new Error(errData.error || "Failed to load lease details")
            }
            const data = await res.json()
            setLease(data.lease)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleSign = async (sigData: any) => {
        setIsSigning(true)
        setError(null)
        try {
            const res = await fetch(`/api/leases/${leaseId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "sign",
                    ...sigData
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed to execute signature")

            setShowSignatureModal(false)
            fetchLeaseDetails()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsSigning(false)
        }
    }

    const handleAction = async (action: "terminate" | "renew" | "cancel") => {
        if (!confirm(`Are you sure you want to perform action: ${action.toUpperCase()}?`)) return
        try {
            const res = await fetch(`/api/leases/${leaseId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action })
            })
            if (res.ok) {
                fetchLeaseDetails()
            }
        } catch (err) {
            console.error("Action error:", err)
        }
    }

    if (loading) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-xs text-slate-400">Loading lease details...</p>
            </div>
        )
    }

    if (error || !lease) {
        return (
            <div className="min-h-screen bg-slate-950 p-8 text-center">
                <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Lease Not Found</h2>
                <p className="text-xs text-slate-400 mb-6">{error || "Could not retrieve lease details."}</p>
                <Link href="/dashboard/landlord/leases" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold">
                    Return to Leases
                </Link>
            </div>
        )
    }

    const landlordSig = lease.signatures?.find((s: any) => s.role === "landlord")
    const tenantSig = lease.signatures?.find((s: any) => s.role === "tenant")

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header Navigation */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center space-x-2 text-slate-400 hover:text-white text-xs font-medium transition"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Leases</span>
                    </button>
                    <div className="flex items-center space-x-2">
                        {lease.status === "Active" || lease.status === "Fully Signed" ? (
                            <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-semibold">
                                Fully Executed & Active
                            </span>
                        ) : (
                            <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full text-xs font-semibold">
                                {lease.status}
                            </span>
                        )}
                    </div>
                </div>

                {/* Contract Summary Banner */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <span className="text-xs font-mono text-blue-400 uppercase tracking-widest">{lease.template_type} LEASE</span>
                        <h1 className="text-2xl font-bold text-white mt-1">{lease.title}</h1>
                        <p className="text-xs text-slate-400 mt-1">📍 {lease.property?.title} — {lease.property?.address}</p>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                        {!landlordSig && (lease.status === "Draft" || lease.status === "Sent" || lease.status === "Tenant Signed") && (
                            <button
                                onClick={() => setShowSignatureModal(true)}
                                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg transition flex items-center space-x-2"
                            >
                                <ShieldCheck className="w-4 h-4" />
                                <span>Sign Lease as Landlord</span>
                            </button>
                        )}
                        {lease.pdf_path && (
                            <a
                                href={`/api/leases/${lease.id}/download`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl border border-slate-700 transition flex items-center space-x-2"
                            >
                                <Download className="w-4 h-4 text-blue-400" />
                                <span>Download PDF</span>
                            </a>
                        )}
                    </div>
                </div>

                {/* Signature Modal */}
                {showSignatureModal && (
                    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="w-full max-w-xl">
                            <div className="flex justify-end mb-2">
                                <button onClick={() => setShowSignatureModal(false)} className="text-slate-400 hover:text-white text-xs">Close [X]</button>
                            </div>
                            <DigitalSignaturePad onSign={handleSign} isSubmitting={isSigning} roleLabel="Landlord (Lessor)" />
                        </div>
                    </div>
                )}

                {/* Main 2-Column Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left 2 Cols: Details & Terms */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Financial Overview */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                                <DollarSign className="w-4 h-4 text-emerald-400" />
                                <span>Financial Terms & Fees</span>
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                                    <span className="text-slate-400 block mb-0.5">Rent Amount</span>
                                    <span className="font-bold text-white text-sm">${Number(lease.rent_amount).toLocaleString()}</span>
                                    <span className="text-[10px] text-slate-500 block">/ {lease.payment_frequency}</span>
                                </div>
                                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                                    <span className="text-slate-400 block mb-0.5">Security Deposit</span>
                                    <span className="font-bold text-white text-sm">${Number(lease.security_deposit).toLocaleString()}</span>
                                </div>
                                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                                    <span className="text-slate-400 block mb-0.5">Service Charge</span>
                                    <span className="font-bold text-white text-sm">${Number(lease.service_charge || 0).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Tenancy Terms */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 text-xs">
                            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                                <Calendar className="w-4 h-4 text-blue-400" />
                                <span>Tenancy Dates & Rules</span>
                            </h3>
                            <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                                <div>
                                    <span className="text-slate-400 block mb-1">Start Date</span>
                                    <span className="font-semibold text-white">{lease.start_date}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block mb-1">End Date</span>
                                    <span className="font-semibold text-white">{lease.end_date}</span>
                                </div>
                            </div>
                            {lease.property_rules && (
                                <div>
                                    <span className="text-slate-400 font-medium block mb-1">Property Rules</span>
                                    <p className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-300 leading-relaxed">{lease.property_rules}</p>
                                </div>
                            )}
                            {lease.maintenance_terms && (
                                <div>
                                    <span className="text-slate-400 font-medium block mb-1">Maintenance Responsibilities</span>
                                    <p className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-300 leading-relaxed">{lease.maintenance_terms}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Col: Signatures & Lifecycle Actions */}
                    <div className="space-y-6">
                        {/* Signature Status Box */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                                <span>Digital Signatures</span>
                            </h3>

                            {/* Landlord Signature Status */}
                            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                                <div>
                                    <span className="font-semibold text-white block">Landlord (Lessor)</span>
                                    <span className="text-slate-400">{lease.landlord?.name}</span>
                                </div>
                                {landlordSig ? (
                                    <span className="text-emerald-400 font-medium flex items-center space-x-1">
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>Signed</span>
                                    </span>
                                ) : (
                                    <span className="text-amber-400 text-[11px] font-medium">Pending</span>
                                )}
                            </div>

                            {/* Tenant Signature Status */}
                            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                                <div>
                                    <span className="font-semibold text-white block">Tenant (Lessee)</span>
                                    <span className="text-slate-400">{lease.tenant?.name || 'Unassigned'}</span>
                                </div>
                                {tenantSig ? (
                                    <span className="text-emerald-400 font-medium flex items-center space-x-1">
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>Signed</span>
                                    </span>
                                ) : (
                                    <span className="text-amber-400 text-[11px] font-medium">Pending</span>
                                )}
                            </div>
                        </div>

                        {/* Lifecycle Actions */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
                            <h3 className="text-sm font-semibold text-white mb-2">Contract Controls</h3>
                            <button
                                onClick={() => handleAction("renew")}
                                className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition"
                            >
                                <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                                <span>Request Renewal</span>
                            </button>
                            <button
                                onClick={() => handleAction("terminate")}
                                className="w-full py-2.5 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition"
                            >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Terminate Tenancy</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
