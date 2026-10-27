"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { DollarSign, Calendar, Clock, ShieldAlert, CreditCard, Download, ExternalLink, RefreshCw, AlertCircle, CheckCircle2, Loader2, Filter, FileText, MessageCircleWarning } from "lucide-react"

function TenantPaymentContent() {
    const searchParams = useSearchParams()
    const queryRef = searchParams.get("reference")

    const [schedules, setSchedules] = useState<any[]>([])
    const [payments, setPayments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState("all")
    const [verifyingRef, setVerifyingRef] = useState<string | null>(queryRef)
    const [verifyMessage, setVerifyMessage] = useState<string | null>(null)

    // Pay Modal State
    const [selectedSchedule, setSelectedSchedule] = useState<any | null>(null)
    const [customPayAmount, setCustomPayAmount] = useState<string>("")
    const [isInitializing, setIsInitializing] = useState(false)
    const [payError, setPayError] = useState<string | null>(null)

    // Dispute Modal State
    const [disputePayment, setDisputePayment] = useState<any | null>(null)
    const [disputeCategory, setDisputeCategory] = useState("deducted_not_reflected")
    const [disputeDesc, setDisputeDesc] = useState("")

    useEffect(() => {
        if (queryRef) {
            verifyPaymentServerSide(queryRef)
        }
        loadTenantFinancials()
    }, [])

    async function verifyPaymentServerSide(ref: string) {
        setVerifyMessage("Checking payment status...")
        try {
            const res = await fetch(`/api/payments/verify?reference=${encodeURIComponent(ref)}`)
            const data = await res.json()
            if (res.ok && data.success) {
                setVerifyMessage(`Payment verified! Receipt #${data.receiptNumber || 'generated'} issued.`)
            } else {
                setVerifyMessage(`Verification status: ${data.error || 'Pending'}`)
            }
        } catch (err) {
            console.error("Verification error:", err)
        } finally {
            loadTenantFinancials()
        }
    }

    async function loadTenantFinancials() {
        setLoading(true)
        try {
            // Fetch payment schedules
            const schedRes = await fetch("/api/payments/schedules?role=tenant")
            if (schedRes.ok) {
                const schedData = await schedRes.json()
                setSchedules(schedData.schedules || [])
            } else {
                // Fallback mock fetch if schedules endpoint not yet ready
                const mockRes = await fetch("/api/leases?role=tenant")
                if (mockRes.ok) {
                    const lData = await mockRes.json()
                    const mockSchedules = lData.leases?.flatMap((l: any) => l.payment_schedules || []) || []
                    setSchedules(mockSchedules)
                }
            }

            // Fetch payment history
            const payRes = await fetch("/api/payments/history?role=tenant")
            if (payRes.ok) {
                const payData = await payRes.json()
                setPayments(payData.payments || [])
            }
        } catch (err) {
            console.error("Error loading tenant payments:", err)
        } finally {
            setLoading(false)
        }
    }

    const totalOutstanding = schedules.reduce((sum, s) => sum + Number(s.outstanding_amount || 0), 0)
    const overdueSchedules = schedules.filter(s => s.status === "Overdue")
    const totalOverdue = overdueSchedules.reduce((sum, s) => sum + Number(s.outstanding_amount || 0), 0)
    const nextDueSchedule = schedules.find(s => s.status === "Due" || s.status === "Upcoming")

    const filteredSchedules = schedules.filter(s => {
        if (statusFilter === "all") return true
        return s.status.toLowerCase() === statusFilter.toLowerCase()
    })

    const handlePayNowClick = (schedule: any) => {
        setSelectedSchedule(schedule)
        setCustomPayAmount(schedule.outstanding_amount ? schedule.outstanding_amount.toString() : schedule.amount.toString())
        setPayError(null)
    }

    const handleExecutePayment = async () => {
        setPayError("U.S. payment processing is not configured yet. No payment was taken.")
    }

    const handleOpenDispute = async () => {
        if (!disputeDesc.trim()) return
        try {
            await fetch("/api/disputes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    paymentId: disputePayment?.id,
                    category: disputeCategory,
                    description: disputeDesc
                })
            })
            setDisputePayment(null)
            setDisputeDesc("")
            alert("Dispute submitted to admin support.")
        } catch (err) {
            console.error("Dispute error:", err)
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 pb-24">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Verification Notice Banner */}
                {verifyMessage && (
                    <div className="p-4 bg-blue-600/10 border border-blue-500/30 rounded-2xl flex items-center justify-between text-xs text-blue-300">
                        <div className="flex items-center space-x-2">
                            <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                            <span>{verifyMessage}</span>
                        </div>
                        <button onClick={() => setVerifyMessage(null)} className="text-slate-400 hover:text-white">Dismiss</button>
                    </div>
                )}

                {/* Page Title */}
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Tenant Payment Center</h1>
                    <p className="text-sm text-slate-400 mt-1">Manage rent payments, view outstanding bills, download receipts, and review rent activity.</p>
                </div>

                {/* Financial Summary KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                        <span className="text-xs text-slate-400 font-medium block">Total Balance Due</span>
                        <div className="text-2xl font-bold text-white mt-1">${totalOutstanding.toLocaleString()}</div>
                        <span className="text-[11px] text-slate-500 mt-1 block">Includes rent & service charges</span>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                        <span className="text-xs text-slate-400 font-medium block">Overdue Amount</span>
                        <div className={`text-2xl font-bold mt-1 ${totalOverdue > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                            ${totalOverdue.toLocaleString()}
                        </div>
                        <span className="text-[11px] text-slate-500 mt-1 block">{overdueSchedules.length} Overdue Item(s)</span>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                        <span className="text-xs text-slate-400 font-medium block">Next Due Date</span>
                        <div className="text-lg font-bold text-blue-400 mt-1.5">
                            {nextDueSchedule ? nextDueSchedule.due_date : "No Due Bills"}
                        </div>
                        <span className="text-[11px] text-slate-500 mt-1 block">{nextDueSchedule?.description || "All caught up"}</span>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
                        <span className="text-xs text-slate-400 font-medium">Quick Action</span>
                        {nextDueSchedule ? (
                            <button
                                onClick={() => handlePayNowClick(nextDueSchedule)}
                                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition flex items-center justify-center space-x-1.5 mt-2"
                            >
                                <CreditCard className="w-4 h-4" />
                                <span>Pay Next Due Now</span>
                            </button>
                        ) : (
                            <span className="text-xs text-emerald-400 font-medium mt-2">Zero Balance Pending</span>
                        )}
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center space-x-2 overflow-x-auto pb-1 bg-slate-900 border border-slate-800 p-2 rounded-2xl">
                    <Filter className="w-4 h-4 text-slate-400 ml-2 shrink-0" />
                    {[
                        { id: "all", label: "All Charges" },
                        { id: "due", label: "Due" },
                        { id: "overdue", label: "Overdue" },
                        { id: "partially paid", label: "Partially Paid" },
                        { id: "paid", label: "Paid History" },
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

                {/* Payment Schedules List */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-white">Payment Schedules & Charges</h2>

                    {loading ? (
                        <div className="p-8 text-center text-slate-400 text-xs">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                            Loading schedules...
                        </div>
                    ) : filteredSchedules.length === 0 ? (
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs">
                            No payment items found matching "{statusFilter}".
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {filteredSchedules.map((item) => (
                                <div
                                    key={item.id}
                                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition"
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center space-x-2">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${item.status === "Paid"
                                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                                    : item.status === "Overdue"
                                                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                                                        : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                                                }`}>
                                                {item.status}
                                            </span>
                                            <span className="text-xs text-slate-400 font-mono">Due: {item.due_date}</span>
                                        </div>
                                        <h4 className="font-bold text-white text-base">{item.description}</h4>
                                        <p className="text-xs text-slate-400">
                                            Total: ${Number(item.amount).toLocaleString()} | Paid: ${Number(item.paid_amount || 0).toLocaleString()} | Outstanding: <span className="text-amber-400 font-medium">${Number(item.outstanding_amount || 0).toLocaleString()}</span>
                                        </p>
                                    </div>

                                    <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
                                        {Number(item.outstanding_amount) > 0 && (
                                            <button
                                                onClick={() => handlePayNowClick(item)}
                                                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition flex items-center space-x-1.5"
                                            >
                                                <CreditCard className="w-3.5 h-3.5" />
                                                <span>Pay Now</span>
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setDisputePayment(item)}
                                            className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition"
                                            title="Report Payment Issue"
                                        >
                                            <MessageCircleWarning className="w-4 h-4 text-amber-400" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Payment Modal */}
                {selectedSchedule && (
                    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 text-slate-100 shadow-2xl">
                            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                                <h3 className="font-bold text-base text-white">Online payment setup</h3>
                                <button onClick={() => setSelectedSchedule(null)} className="text-slate-400 hover:text-white text-xs">Close [X]</button>
                            </div>

                            {payError && (
                                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
                                    {payError}
                                </div>
                            )}

                            <div>
                                <span className="text-xs text-slate-400 block mb-1">Item to Pay</span>
                                <p className="font-semibold text-white text-sm">{selectedSchedule.description}</p>
                                <p className="text-xs text-slate-400">Total Outstanding Balance: ${Number(selectedSchedule.outstanding_amount).toLocaleString()}</p>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                                    Amount to Pay Now ($)
                                </label>
                                <input
                                    type="number"
                                    value={customPayAmount}
                                    onChange={(e) => setCustomPayAmount(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold text-emerald-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <p className="text-[11px] text-slate-500 mt-1">Supports full or partial payment if allowed by landlord lease terms.</p>
                            </div>

                            <div className="pt-2">
                                <button
                                    onClick={handleExecutePayment} disabled
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-blue-600/25 flex items-center justify-center space-x-2 transition disabled:opacity-50"
                                >
                                    {isInitializing ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Checking payment setup...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CreditCard className="w-4 h-4" />
                                            <span>Payment processing is not configured</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Dispute Modal */}
                {disputePayment && (
                    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 text-slate-100">
                            <h3 className="font-bold text-base text-white">Report Payment Issue / Dispute</h3>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Issue Category</label>
                                <select
                                    value={disputeCategory}
                                    onChange={(e) => setDisputeCategory(e.target.value)}
                                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100"
                                >
                                    <option value="deducted_not_reflected">Payment Deducted but Not Reflected</option>
                                    <option value="wrong_amount">Wrong Amount Charged</option>
                                    <option value="duplicate_charge">Duplicate Charge</option>
                                    <option value="missing_receipt">Missing Receipt</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Description / Details</label>
                                <textarea
                                    rows={3}
                                    value={disputeDesc}
                                    onChange={(e) => setDisputeDesc(e.target.value)}
                                    placeholder="Explain the problem..."
                                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100"
                                />
                            </div>
                            <div className="flex justify-end space-x-2">
                                <button onClick={() => setDisputePayment(null)} className="px-4 py-2 bg-slate-800 text-xs rounded-xl">Cancel</button>
                                <button onClick={handleOpenDispute} className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl">Submit Dispute</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Sticky Pay Action Bar */}
            {nextDueSchedule && (
                <div className="md:hidden fixed bottom-0 left-0 right-0 p-3 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 flex items-center justify-between z-40">
                    <div>
                        <span className="text-[10px] text-slate-400 block">Next Due Payment</span>
                        <span className="text-xs font-bold text-white">${Number(nextDueSchedule.outstanding_amount).toLocaleString()}</span>
                    </div>
                    <button
                        onClick={() => handlePayNowClick(nextDueSchedule)}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg"
                    >
                        Pay Now
                    </button>
                </div>
            )}
        </div>
    )
}

export default function TenantPaymentDashboardPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8 text-slate-400 text-xs">
                <Loader2 className="w-6 h-6 animate-spin mr-2 text-blue-500" />
                <span>Loading tenant payments...</span>
            </div>
        }>
            <TenantPaymentContent />
        </Suspense>
    )
}

