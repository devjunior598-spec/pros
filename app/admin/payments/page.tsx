"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { generateRentReceipt } from "@/lib/rent-receipt-generator"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog"
import {
    CreditCard,
    Search,
    Filter,
    Loader2,
    CheckCircle,
    XCircle,
    Download,
    ArrowLeft,
    AlertTriangle,
    RefreshCcw,
    Building2,
    Users
} from "lucide-react"

export default function AdminPaymentsPage() {
    const { toast } = useToast()
    const [payments, setPayments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    
    // Filters and Search
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    
    // Refund Modal State
    const [isRefundModalOpen, setIsRefundModalOpen] = useState(false)
    const [selectedPayment, setSelectedPayment] = useState<any>(null)
    const [refunding, setRefunding] = useState(false)

    const fetchPayments = useCallback(async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from("rent_payments")
                .select("*, property:properties(title, address), tenant:profiles!tenant_id(name, email), landlord:profiles!landlord_id(name, email)")
                .order("created_at", { ascending: false })

            if (error) throw error
            setPayments(data || [])
        } catch (error: any) {
            console.error("Error fetching admin payments:", error)
            toast({ title: "Fetch Error", description: error.message || "Failed to load transactions list.", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }, [toast])

    useEffect(() => {
        fetchPayments()
    }, [fetchPayments])

    // Filtered Payments list
    const filteredPayments = payments.filter((p) => {
        const matchesStatus = statusFilter === "all" || p.payment_status.toLowerCase() === statusFilter.toLowerCase()
        
        const tenantName = (p.tenant?.name || "").toLowerCase()
        const tenantEmail = (p.tenant?.email || "").toLowerCase()
        const landlordName = (p.landlord?.name || "").toLowerCase()
        const landlordEmail = (p.landlord?.email || "").toLowerCase()
        const propTitle = (p.property?.title || "").toLowerCase()
        const ref = (p.transaction_reference || "").toLowerCase()
        const search = searchQuery.toLowerCase()

        const matchesSearch = 
            tenantName.includes(search) ||
            tenantEmail.includes(search) ||
            landlordName.includes(search) ||
            landlordEmail.includes(search) ||
            propTitle.includes(search) ||
            ref.includes(search)

        return matchesStatus && matchesSearch
    })

    const handleOpenRefundModal = (payment: any) => {
        setSelectedPayment(payment)
        setIsRefundModalOpen(true)
    }

    const handleProcessRefund = async () => {
        if (!selectedPayment) return
        setRefunding(true)

        try {
            const res = await fetch("/api/payments/refund", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentId: selectedPayment.id })
            })

            const result = await res.json()
            if (!res.ok) throw new Error(result.error || "Failed to execute refund request.")

            toast({ title: "Refund Complete!", description: `₦${Number(selectedPayment.amount).toLocaleString()} credited back to tenant wallet balance.` })
            setIsRefundModalOpen(false)
            fetchPayments()
        } catch (error: any) {
            console.error(error)
            alert(error.message || "Refund action failed.")
        } finally {
            setRefunding(false)
        }
    }

    const exportPaymentsCSV = () => {
        try {
            const headers = ["ID", "Date", "Tenant Name", "Tenant Email", "Landlord Name", "Landlord Email", "Property Name", "Amount", "Method", "Reference", "Status"]
            const rows = filteredPayments.map(p => [
                p.id,
                new Date(p.created_at).toLocaleDateString(),
                p.tenant?.name || "N/A",
                p.tenant?.email || "N/A",
                p.landlord?.name || "N/A",
                p.landlord?.email || "N/A",
                p.property?.title || "N/A",
                p.amount,
                p.payment_method,
                p.transaction_reference,
                p.payment_status
            ])
            const csvContent = [headers.join(","), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n")
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
            const url = URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.setAttribute("href", url)
            link.setAttribute("download", "PRMS_All_Rent_Payments.csv")
            link.style.visibility = "hidden"
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        } catch (error) {
            console.error(error)
            toast({ title: "Export Failed", description: "Failed to download transactions CSV.", variant: "destructive" })
        }
    }

    const handleDownloadReceipt = (payment: any) => {
        try {
            const doc = generateRentReceipt({
                receiptNumber: payment.receipt_number || "N/A",
                datePaid: new Date(payment.payment_date || payment.created_at).toLocaleDateString(),
                tenantName: payment.tenant?.name || payment.tenant?.email || "Tenant",
                tenantEmail: payment.tenant?.email || "",
                propertyName: payment.property?.title || "Property",
                propertyAddress: payment.property?.address || "Lagos, Nigeria",
                paymentMethod: payment.payment_method,
                transactionReference: payment.transaction_reference,
                amountPaid: Number(payment.amount),
                status: payment.payment_status
            })
            doc.save(`Receipt-${payment.receipt_number || "prms"}.pdf`)
        } catch (error) {
            console.error(error)
            toast({ title: "Download Failed", description: "Failed to compile receipt PDF.", variant: "destructive" })
        }
    }

    return (
        <div className="space-y-6 pb-20 max-w-6xl mx-auto">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <CreditCard className="h-8 w-8 text-blue-600" /> Rent Transactions Audit
                    </h1>
                    <p className="text-muted-foreground">Monitor and manage rent payments, execute wallet refunds, and export history.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchPayments} className="h-10 rounded-xl" title="Refresh Logs">
                        <RefreshCcw className="h-4 w-4" />
                    </Button>
                    <Button onClick={exportPaymentsCSV} disabled={filteredPayments.length === 0} className="bg-blue-600 hover:bg-blue-700 h-10 rounded-xl font-bold">
                        <Download className="h-4 w-4 mr-2" /> Export CSV
                    </Button>
                </div>
            </div>

            {/* Filter controls */}
            <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 rounded-2xl shadow-sm">
                <CardContent className="p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute inset-y-0 left-3 flex items-center h-full w-4 text-slate-400" />
                        <Input 
                            placeholder="Search by tenant, landlord, property or reference code..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-slate-400" />
                        <div className="flex bg-slate-100 dark:bg-slate-900 border rounded-xl p-1 gap-1">
                            {["all", "paid", "pending", "failed", "refunded"].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setStatusFilter(s)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                                        statusFilter === s 
                                            ? "bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white" 
                                            : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-250"
                                    }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Main Ledger card */}
            <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-950 rounded-2xl shadow-sm overflow-hidden">
                <CardHeader className="border-b">
                    <CardTitle className="text-base font-extrabold">All Ledger Logs ({filteredPayments.length})</CardTitle>
                    <CardDescription>Comprehensive payments logs in system scope.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="relative overflow-x-auto w-full">
                        
                        {/* Mobile stack list */}
                        <div className="md:hidden divide-y">
                            {loading ? (
                                <div className="py-12 flex justify-center"><Loader2 className="h-7 w-7 animate-spin text-blue-600" /></div>
                            ) : filteredPayments.length === 0 ? (
                                <div className="py-12 text-center text-slate-400 font-semibold">No payments matching filters found.</div>
                            ) : (
                                filteredPayments.map((p) => {
                                    const isPaid = p.payment_status === "Paid"
                                    const isRefunded = p.payment_status === "Refunded"
                                    const isFailed = p.payment_status === "Failed"
                                    return (
                                        <div key={p.id} className="p-4 space-y-3 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Tenant</span>
                                                    <p className="text-sm font-extrabold">{p.tenant?.name || p.tenant?.email || "N/A"}</p>
                                                </div>
                                                <Badge className={`text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-lg border ${
                                                    isPaid ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" :
                                                    isRefunded ? "bg-blue-500/10 border-blue-500/20 text-blue-600" :
                                                    isFailed ? "bg-red-500/10 border-red-500/20 text-red-600" :
                                                    "bg-yellow-500/10 border-yellow-500/20 text-yellow-600"
                                                }`}>
                                                    {p.payment_status}
                                                </Badge>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div>
                                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Landlord</span>
                                                    <p className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{p.landlord?.name || p.landlord?.email || "N/A"}</p>
                                                </div>
                                                <div>
                                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Property</span>
                                                    <p className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{p.property?.title}</p>
                                                </div>
                                                <div>
                                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Date</span>
                                                    <p className="font-semibold">{new Date(p.created_at).toLocaleDateString()}</p>
                                                </div>
                                                <div>
                                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Amount</span>
                                                    <p className="font-extrabold text-blue-600 dark:text-blue-400">₦{Number(p.amount).toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 justify-end border-t pt-2.5">
                                                {isPaid && (
                                                    <>
                                                        <Button 
                                                            size="sm" 
                                                            variant="outline" 
                                                            onClick={() => handleDownloadReceipt(p)}
                                                            className="h-8 text-[11px] rounded-lg"
                                                        >
                                                            Receipt
                                                        </Button>
                                                        <Button 
                                                            size="sm" 
                                                            variant="outline" 
                                                            onClick={() => handleOpenRefundModal(p)}
                                                            className="h-8 text-[11px] text-red-600 border-red-200 hover:bg-red-50 rounded-lg font-bold"
                                                        >
                                                            Refund
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>

                        {/* Desktop Table view */}
                        <table className="hidden md:table w-full text-sm text-left border-collapse">
                            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 uppercase text-[10px] tracking-wider font-extrabold border-b">
                                <tr>
                                    <th className="px-6 py-4">Status / Date</th>
                                    <th className="px-6 py-4">Tenant</th>
                                    <th className="px-6 py-4">Landlord</th>
                                    <th className="px-6 py-4">Property</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4">Reference / Method</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-800">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center">
                                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                                        </td>
                                    </tr>
                                ) : filteredPayments.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-slate-400 font-semibold italic">
                                            No payments logs found matching criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPayments.map((p) => {
                                        const isPaid = p.payment_status === "Paid"
                                        const isRefunded = p.payment_status === "Refunded"
                                        const isFailed = p.payment_status === "Failed"
                                        return (
                                            <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <Badge className={`w-fit text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-lg border ${
                                                            isPaid ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" :
                                                            isRefunded ? "bg-blue-500/10 border-blue-500/20 text-blue-600" :
                                                            isFailed ? "bg-red-500/10 border-red-500/20 text-red-600" :
                                                            "bg-yellow-500/10 border-yellow-500/20 text-yellow-600"
                                                        }`}>
                                                            {p.payment_status}
                                                        </Badge>
                                                        <span className="text-[10px] text-slate-400 font-bold">{new Date(p.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold">{p.tenant?.name || "N/A"}</span>
                                                        <span className="text-[10px] text-slate-400">{p.tenant?.email}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold">{p.landlord?.name || "N/A"}</span>
                                                        <span className="text-[10px] text-slate-400">{p.landlord?.email}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 max-w-[150px] truncate">
                                                    <span className="font-semibold text-slate-700 dark:text-slate-350">{p.property?.title}</span>
                                                </td>
                                                <td className="px-6 py-4 font-black text-blue-600 dark:text-blue-400">
                                                    ₦{Number(p.amount).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 font-mono text-[10px] text-slate-500">
                                                    <div>{p.transaction_reference}</div>
                                                    <div className="text-[9px] font-bold text-slate-400 tracking-wider uppercase mt-0.5">{p.payment_method}</div>
                                                </td>
                                                <td className="px-6 py-4 text-right space-x-1.5">
                                                    {isPaid && (
                                                        <>
                                                            <Button 
                                                                size="sm" 
                                                                variant="outline" 
                                                                onClick={() => handleDownloadReceipt(p)}
                                                                className="h-8 rounded-lg"
                                                            >
                                                                Receipt
                                                            </Button>
                                                            <Button 
                                                                size="sm" 
                                                                variant="outline" 
                                                                onClick={() => handleOpenRefundModal(p)}
                                                                className="h-8 text-red-600 border-red-200 hover:bg-red-50 rounded-lg font-bold"
                                                            >
                                                                Refund
                                                            </Button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>

                    </div>
                </CardContent>
            </Card>

            {/* Refund Confirm Modal */}
            {isRefundModalOpen && selectedPayment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200 text-slate-900 dark:text-slate-100">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2 text-red-600">
                                <AlertTriangle className="h-5 w-5" />
                                <h3 className="text-lg font-black leading-none">Confirm Rent Refund</h3>
                            </div>
                            <button onClick={() => setIsRefundModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 min-h-[44px] min-w-[44px] flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                            </button>
                        </div>

                        <div className="space-y-3 text-xs leading-relaxed text-slate-550 dark:text-slate-400">
                            <p>
                                You are initiating a full refund of <span className="font-black text-slate-900 dark:text-white">₦{Number(selectedPayment.amount).toLocaleString()}</span> for property <span className="font-black text-slate-900 dark:text-white">"{selectedPayment.property?.title}"</span>.
                            </p>
                            <div className="p-3 rounded-xl border border-red-100 dark:border-red-950 bg-red-500/[0.01] dark:bg-red-950/10 text-red-700 dark:text-red-400 space-y-1">
                                <p className="font-bold uppercase tracking-wider text-[10px]">Critical Effects:</p>
                                <ul className="list-disc pl-3.5 space-y-0.5">
                                    <li>Marks the rent transaction status as Refunded.</li>
                                    <li>Credits ₦{Number(selectedPayment.amount).toLocaleString()} directly back to the tenant's wallet.</li>
                                    <li>Reverts the tenant's invoice status back to Unpaid (pending or overdue).</li>
                                </ul>
                            </div>
                            <p className="font-semibold text-slate-500">This action cannot be undone. Are you sure you want to proceed?</p>
                        </div>

                        <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                onClick={() => setIsRefundModalOpen(false)}
                                className="flex-1 rounded-xl font-bold min-h-[44px]"
                            >
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleProcessRefund}
                                disabled={refunding}
                                className="flex-1 rounded-xl bg-red-650 hover:bg-red-750 text-white font-bold min-h-[44px] shadow-lg shadow-red-600/10"
                            >
                                {refunding ? (
                                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                                ) : (
                                    "Confirm Refund"
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}
