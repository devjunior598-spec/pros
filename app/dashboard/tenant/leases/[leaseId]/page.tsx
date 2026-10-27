"use client"

import React, { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, FileText, CheckCircle2, ShieldCheck, Download, Calendar, DollarSign, User, AlertCircle, Loader2, MessageSquare, CreditCard } from "lucide-react"
import { DigitalSignaturePad } from "@/components/digital-signature-pad"

export default function TenantLeaseDetailsPage({ params }: { params: Promise<{ leaseId: string }> }) {
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
            if (!res.ok) throw new Error(data.error || "Failed to execute digital signature")

            setShowSignatureModal(false)
            fetchLeaseDetails()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsSigning(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-xs text-slate-400">Retrieving contract details...</p>
            </div>
        )
    }

    if (error || !lease) {
        return (
            <div className="min-h-screen bg-slate-950 p-8 text-center">
                <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Lease Contract Unavailable</h2>
                <p className="text-xs text-slate-400 mb-6">{error || "Could not retrieve contract details."}</p>
                <Link href="/dashboard/tenant/leases" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold">
                    Return to My Leases
                </Link>
            </div>
        )
    }

    const tenantSig = lease.signatures?.find((s: any) => s.role === "tenant")
    const landlordSig = lease.signatures?.find((s: any) => s.role === "landlord")

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Top Navigation */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center space-x-2 text-slate-400 hover:text-white text-xs font-medium transition"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to My Leases</span>
                    </button>

                    <div className="flex items-center space-x-2">
                        {tenantSig ? (
                            <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-semibold flex items-center space-x-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>You Have Signed</span>
                            </span>
                        ) : (
                            <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full text-xs font-semibold animate-pulse">
                                Signature Required
                            </span>
                        )}
                    </div>
                </div>

                {/* Banner Summary */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <span className="text-xs font-mono text-blue-400 uppercase tracking-widest">{lease.template_type} AGREEMENT</span>
                        <h1 className="text-2xl font-bold text-white mt-1">{lease.title}</h1>
                        <p className="text-xs text-slate-400 mt-1">📍 {lease.property?.title} — {lease.property?.address}</p>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                        {!tenantSig && (
                            <button
                                onClick={() => setShowSignatureModal(true)}
                                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/25 transition flex items-center space-x-2"
                            >
                                <ShieldCheck className="w-4 h-4" />
                                <span>Sign Lease Agreement</span>
                            </button>
                        )}
                        <Link
                            href="/dashboard/tenant/payments"
                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition flex items-center space-x-1.5"
                        >
                            <CreditCard className="w-4 h-4" />
                            <span>View Payment Schedule</span>
                        </Link>
                    </div>
                </div>

                {/* Signature Modal Overlay */}
                {showSignatureModal && (
                    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="w-full max-w-xl">
                            <div className="flex justify-end mb-2">
                                <button onClick={() => setShowSignatureModal(false)} className="text-slate-400 hover:text-white text-xs">Close [X]</button>
                            </div>
                            <DigitalSignaturePad onSign={handleSign} isSubmitting={isSigning} roleLabel="Tenant (Lessee)" />
                        </div>
                    </div>
                )}

                {/* Contract Body Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                        {/* Financial Overview */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                                <DollarSign className="w-4 h-4 text-emerald-400" />
                                <span>Financial Obligations</span>
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

                        {/* Terms & Clauses */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 text-xs">
                            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                                <FileText className="w-4 h-4 text-blue-400" />
                                <span>Terms & Regulations</span>
                            </h3>
                            {lease.property_rules && (
                                <div>
                                    <span className="text-slate-400 font-medium block mb-1">House Rules</span>
                                    <p className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-300 leading-relaxed">{lease.property_rules}</p>
                                </div>
                            )}
                            {lease.maintenance_terms && (
                                <div>
                                    <span className="text-slate-400 font-medium block mb-1">Maintenance & Utility Responsibilities</span>
                                    <p className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-300 leading-relaxed">{lease.maintenance_terms}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Side: Signatures & Landlord Details */}
                    <div className="space-y-6">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                                <span>Execution Status</span>
                            </h3>

                            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                                <div>
                                    <span className="font-semibold text-white block">Tenant Signature</span>
                                    <span className="text-slate-400">Your Signature</span>
                                </div>
                                {tenantSig ? (
                                    <span className="text-emerald-400 font-medium flex items-center space-x-1">
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>Signed</span>
                                    </span>
                                ) : (
                                    <button onClick={() => setShowSignatureModal(true)} className="text-blue-400 text-xs font-semibold underline">Sign Now</button>
                                )}
                            </div>

                            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                                <div>
                                    <span className="font-semibold text-white block">Landlord Signature</span>
                                    <span className="text-slate-400">{lease.landlord?.name}</span>
                                </div>
                                {landlordSig ? (
                                    <span className="text-emerald-400 font-medium flex items-center space-x-1">
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>Signed</span>
                                    </span>
                                ) : (
                                    <span className="text-amber-400 text-[11px] font-medium">Pending Countersignature</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
