"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { generateRentReceipt } from "@/lib/rent-receipt-generator"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from "recharts"
import {
    CreditCard,
    DollarSign,
    Calendar,
    ArrowLeft,
    Download,
    Loader2,
    CheckCircle,
    XCircle,
    Building2,
    AlertCircle,
    Clock,
    History,
    FileCheck,
    HelpCircle,
    Banknote,
    TrendingUp,
    Users
} from "lucide-react"

// Custom premium dark tooltip for chart
function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-slate-950 dark:bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-2xl">
            <p className="text-xs font-bold text-slate-400 mb-1">{label}</p>
            <p className="text-sm font-black text-blue-500">
                ₦{Number(payload[0].value).toLocaleString()}
            </p>
        </div>
    )
}

export default function LandlordPaymentsPage() {
    const router = useRouter()
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState<any>(null)
    const [payments, setPayments] = useState<any[]>([])
    const [outstandingBills, setOutstandingBills] = useState<any[]>([])
    const [bankAccount, setBankAccount] = useState<any>(null)
    
    // Stats states
    const [stats, setStats] = useState({
        totalCollected: 0,
        outstandingBalances: 0,
        overdueCount: 0,
        paidCount: 0
    })

    // Chart Data
    const [chartData, setChartData] = useState<any[]>([])

    // Bank Account Modal Form
    const [isBankModalOpen, setIsBankModalOpen] = useState(false)
    const [bankForm, setBankForm] = useState({
        bank_name: "",
        account_number: "",
        account_name: ""
    })
    const [savingBank, setSavingBank] = useState(false)

    // Verification Modal Form
    const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false)
    const [selectedPayment, setSelectedPayment] = useState<any>(null)
    const [approvalAction, setApprovalAction] = useState<"approve" | "reject">("approve")
    const [rejectionReason, setRejectionReason] = useState("")
    const [submittingAction, setSubmittingAction] = useState(false)

    const fetchPageData = useCallback(async () => {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push("/login")
                return
            }

            // 1. Fetch Landlord Profile
            const { data: prof } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single()
            setProfile(prof)

            // 2. Fetch Rent Payments where landlord_id = user.id
            // We join property and tenant profiles
            const { data: payLogs, error: payError } = await supabase
                .from("rent_payments")
                .select("*, property:properties(title, address), tenant:profiles!tenant_id(name, email)")
                .eq("landlord_id", user.id)
                .order("created_at", { ascending: false })

            if (payError) {
                console.error("Rent payments fetch error:", payError)
            }
            const activePayments = payLogs || []
            setPayments(activePayments)

            // 3. Fetch Outstanding invoices (bills) for properties owned by this landlord
            const { data: bills, error: billsError } = await supabase
                .from("bills")
                .select("*, rental:rentals!inner(tenant:profiles(name, email), property:properties(title, landlord_id))")
                .eq("rental.property.landlord_id", user.id)
                .neq("status", "paid")
                .neq("status", "processing")
                .order("due_date", { ascending: true })

            if (billsError) {
                console.error("Bills fetch error:", billsError)
            }
            const activeBills = bills || []
            setOutstandingBills(activeBills)

            // 4. Fetch Landlord Bank account details
            const { data: bank, error: bankErr } = await supabase
                .from("bank_accounts")
                .select("*")
                .eq("landlord_id", user.id)
                .maybeSingle()

            if (bank && !bankErr) {
                setBankAccount(bank)
                setBankForm({
                    bank_name: bank.bank_name || "",
                    account_number: bank.account_number || "",
                    account_name: bank.account_name || ""
                })
            }

            // Calculate statistics
            const totalColl = activePayments
                .filter(p => p.payment_status === "Paid")
                .reduce((sum, p) => sum + Number(p.amount), 0)

            const outstandingBal = activeBills
                .reduce((sum, b) => sum + (Number(b.amount) - Number(b.amount_paid || 0)), 0)

            const todayStr = new Date().toISOString().split("T")[0]
            const overdueC = activeBills
                .filter(b => b.due_date < todayStr)
                .length

            const paidC = activePayments.filter(p => p.payment_status === "Paid").length

            setStats({
                totalCollected: totalColl,
                outstandingBalances: outstandingBal,
                overdueCount: overdueC,
                paidCount: paidC
            })

            // Aggregate Monthly Revenue for last 6 months
            const last6Months: any[] = []
            for (let i = 5; i >= 0; i--) {
                const date = new Date()
                date.setMonth(date.getMonth() - i)
                const monthName = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
                last6Months.push({
                    month: monthName,
                    monthIdx: date.getMonth(),
                    yearIdx: date.getFullYear(),
                    revenue: 0
                })
            }

            activePayments
                .filter(p => p.payment_status === "Paid" && p.payment_date)
                .forEach(p => {
                    const payDate = new Date(p.payment_date)
                    const mIdx = payDate.getMonth()
                    const yIdx = payDate.getFullYear()
                    const match = last6Months.find(m => m.monthIdx === mIdx && m.yearIdx === yIdx)
                    if (match) {
                        match.revenue += Number(p.amount)
                    }
                })

            setChartData(last6Months)

        } catch (error) {
            console.error("Error fetching landlord payments data:", error)
        } finally {
            setLoading(false)
        }
    }, [router])

    useEffect(() => {
        fetchPageData()
    }, [fetchPageData])

    // Save Bank account info
    const handleSaveBankAccount = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!profile) return

        if (!bankForm.bank_name || !bankForm.account_number || !bankForm.account_name) {
            alert("Please fill in all bank details.")
            return
        }

        setSavingBank(true)
        try {
            const { error } = await supabase
                .from("bank_accounts")
                .upsert({
                    landlord_id: profile.id,
                    bank_name: bankForm.bank_name,
                    account_number: bankForm.account_number,
                    account_name: bankForm.account_name,
                    updated_at: new Date().toISOString()
                }, { onConflict: "landlord_id" })

            if (error) throw error

            toast({ title: "Bank account updated!", description: "Landlord bank details saved successfully." })
            setIsBankModalOpen(false)
            fetchPageData()
        } catch (error: any) {
            console.error(error)
            alert(error.message || "Failed to save bank account details.")
        } finally {
            setSavingBank(false)
        }
    }

    // Open approval dialog
    const handleOpenApprovalModal = (payment: any, action: "approve" | "reject") => {
        setSelectedPayment(payment)
        setApprovalAction(action)
        setRejectionReason("")
        setIsApprovalModalOpen(true)
    }

    // Process Bank Transfer confirmation
    const handleProcessTransfer = async () => {
        if (!selectedPayment) return
        setSubmittingAction(true)

        try {
            const res = await fetch("/api/payments/approve-transfer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    paymentId: selectedPayment.id,
                    action: approvalAction,
                    rejectionReason: approvalAction === "reject" ? rejectionReason : undefined
                })
            })

            const result = await res.json()
            if (!res.ok) throw new Error(result.error || "Failed to process transfer request.")

            toast({
                title: approvalAction === "approve" ? "Payment Approved!" : "Payment Rejected",
                description: approvalAction === "approve" ? "Receipt generated and tenant notified." : "Tenant notified of payment decline."
            })
            setIsApprovalModalOpen(false)
            fetchPageData()
        } catch (error: any) {
            console.error(error)
            alert(error.message || "Error processing transfer action.")
        } finally {
            setSubmittingAction(false)
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
            toast({ title: "Export failed", description: "Failed to compile receipt PDF.", variant: "destructive" })
        }
    }

    const exportPaymentsCSV = () => {
        try {
            const headers = ["Date", "Tenant", "Property", "Amount", "Method", "Reference", "Status"]
            const rows = payments.map(p => [
                new Date(p.created_at).toLocaleDateString(),
                p.tenant?.name || p.tenant?.email || "N/A",
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
            link.setAttribute("download", `Rent_Payments_${profile?.name || "Landlord"}.csv`)
            link.style.visibility = "hidden"
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        } catch (error) {
            console.error(error)
            toast({ title: "CSV export failed", description: "Could not download payments data.", variant: "destructive" })
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            </div>
        )
    }

    const pendingTransfers = payments.filter(p => p.payment_status === "Pending" && p.payment_method === "Bank Transfer Reference")

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 pb-20">
            <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 p-4 sm:p-6 md:p-8">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
                            <DollarSign className="h-7 w-7 text-blue-500" /> Rent & Finance Tracker
                        </h1>
                        <p className="text-sm text-slate-550 dark:text-slate-400">
                            Monitor collected earnings, approve bank transfers, and audit outstanding balances.
                        </p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button 
                            variant="outline" 
                            onClick={exportPaymentsCSV} 
                            className="rounded-xl font-bold min-h-[44px] flex-1 sm:flex-none"
                        >
                            <Download className="h-4 w-4 mr-2" /> Export CSV
                        </Button>
                        <Button 
                            variant="ghost" 
                            onClick={() => router.push("/dashboard")} 
                            className="rounded-xl font-bold min-h-[44px]"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" /> Back
                        </Button>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid gap-4 sm:gap-6 grid-cols-2 md:grid-cols-4">
                    
                    <Card className="border border-blue-100/50 dark:border-blue-950/40 bg-blue-500/[0.01] dark:bg-blue-950/5 shadow-sm rounded-2xl">
                        <CardHeader className="pb-2">
                            <span className="text-[10px] text-blue-500 font-extrabold uppercase tracking-wider block">Total Collected</span>
                            <CardTitle className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                                ₦{stats.totalCollected.toLocaleString()}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-[10px] text-slate-400 font-semibold">{stats.paidCount} payments completed</p>
                        </CardContent>
                    </Card>

                    <Card className="border border-amber-100/50 dark:border-amber-950/40 bg-amber-500/[0.01] dark:bg-amber-950/5 shadow-sm rounded-2xl">
                        <CardHeader className="pb-2">
                            <span className="text-[10px] text-amber-500 font-extrabold uppercase tracking-wider block">Outstanding Bills</span>
                            <CardTitle className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                                ₦{stats.outstandingBalances.toLocaleString()}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-[10px] text-slate-400 font-semibold">{outstandingBills.length} unpaid invoices</p>
                        </CardContent>
                    </Card>

                    <Card className="border border-red-100/50 dark:border-red-950/40 bg-red-500/[0.01] dark:bg-red-950/5 shadow-sm rounded-2xl">
                        <CardHeader className="pb-2">
                            <span className="text-[10px] text-red-500 font-extrabold uppercase tracking-wider block">Overdue Invoices</span>
                            <CardTitle className="text-xl sm:text-2xl font-black text-red-600 dark:text-red-400 mt-1">
                                {stats.overdueCount}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-[10px] text-slate-400 font-semibold">Rent bills past due date</p>
                        </CardContent>
                    </Card>

                    <Card className="border border-purple-100/50 dark:border-purple-950/40 bg-purple-500/[0.01] dark:bg-purple-950/5 shadow-sm rounded-2xl">
                        <CardHeader className="pb-2">
                            <span className="text-[10px] text-purple-500 font-extrabold uppercase tracking-wider block">Pending Transfers</span>
                            <CardTitle className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
                                {pendingTransfers.length}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-[10px] text-slate-400 font-semibold">Bank transfers awaiting approval</p>
                        </CardContent>
                    </Card>

                </div>

                {/* Dashboard Subsections Grid */}
                <div className="grid gap-6 md:grid-cols-3">
                    
                    {/* Left Column: Analytics Chart & Payments Ledger */}
                    <div className="md:col-span-2 space-y-6">
                        
                        {/* Revenue Chart */}
                        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md rounded-2xl overflow-hidden">
                            <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
                                <CardTitle className="text-base font-extrabold flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-blue-500" /> Monthly Revenue Trend
                                </CardTitle>
                                <CardDescription>Collected rent trends over the last 6 months.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-6">
                                <div className="h-64 sm:h-72 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis 
                                                dataKey="month" 
                                                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                                                axisLine={false}
                                                tickLine={false} 
                                            />
                                            <YAxis 
                                                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                                                axisLine={false}
                                                tickFormatter={(v) => `₦${(v / 1000).toLocaleString()}k`} 
                                                tickLine={false}
                                            />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Area 
                                                type="monotone" 
                                                dataKey="revenue" 
                                                stroke="#3b82f6" 
                                                strokeWidth={3} 
                                                fillOpacity={1} 
                                                fill="url(#colorRevenue)" 
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Payments Ledger Tabs */}
                        <Tabs defaultValue="transactions" className="w-full">
                            <TabsList className="grid w-full grid-cols-3 bg-slate-100 dark:bg-slate-900 rounded-xl p-1 border">
                                <TabsTrigger value="transactions" className="text-xs font-bold py-2 rounded-lg">All Logs</TabsTrigger>
                                <TabsTrigger value="pending" className="text-xs font-bold py-2 rounded-lg relative">
                                    Awaiting Approval
                                    {pendingTransfers.length > 0 && (
                                        <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[8px] font-black leading-none">
                                            {pendingTransfers.length}
                                        </span>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="unpaid" className="text-xs font-bold py-2 rounded-lg">Unpaid Invoices</TabsTrigger>
                            </TabsList>

                            {/* Tab 1: All Transaction Logs */}
                            <TabsContent value="transactions" className="pt-3">
                                <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md rounded-2xl overflow-hidden">
                                    <CardContent className="p-0">
                                        {payments.length === 0 ? (
                                            <div className="text-center py-12 px-4 space-y-3">
                                                <History className="h-10 w-10 text-slate-300 mx-auto" />
                                                <p className="text-sm font-semibold text-slate-500">No rent payment transactions recorded.</p>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                                {payments.map((p) => {
                                                    const isPaid = p.payment_status === "Paid"
                                                    const isRefunded = p.payment_status === "Refunded"
                                                    const isFailed = p.payment_status === "Failed"
                                                    return (
                                                        <div key={p.id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                                                            <div className="space-y-1.5 flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <h4 className="font-extrabold text-sm truncate max-w-[220px]">
                                                                        {p.tenant?.name || p.tenant?.email || "Tenant"}
                                                                    </h4>
                                                                    <Badge className={`text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-lg border ${
                                                                        isPaid ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" :
                                                                        isRefunded ? "bg-blue-500/10 border-blue-500/20 text-blue-600" :
                                                                        isFailed ? "bg-red-500/10 border-red-500/20 text-red-600" :
                                                                        "bg-yellow-500/10 border-yellow-500/20 text-yellow-600"
                                                                    }`}>
                                                                        {p.payment_status}
                                                                    </Badge>
                                                                </div>
                                                                <p className="text-xs text-slate-450 dark:text-slate-500 font-semibold truncate">
                                                                    {p.property?.title || "Property Listing"}
                                                                </p>
                                                                <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono flex-wrap">
                                                                    <span>Ref: {p.transaction_reference.substring(0, 16)}</span>
                                                                    <span>•</span>
                                                                    <span>Channel: {p.payment_method}</span>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-5 justify-between w-full sm:w-auto">
                                                                <div className="text-left sm:text-right">
                                                                    <p className="text-base font-black text-slate-800 dark:text-slate-200">
                                                                        ₦{Number(p.amount).toLocaleString()}
                                                                    </p>
                                                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                                                        {new Date(p.created_at).toLocaleDateString()}
                                                                    </p>
                                                                </div>
                                                                {isPaid && (
                                                                    <Button 
                                                                        size="icon" 
                                                                        variant="outline" 
                                                                        onClick={() => handleDownloadReceipt(p)}
                                                                        className="h-9 w-9 rounded-xl hover:bg-slate-100"
                                                                        title="Download Receipt PDF"
                                                                    >
                                                                        <Download className="h-4 w-4 text-slate-500" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Tab 2: Pending approvals */}
                            <TabsContent value="pending" className="pt-3">
                                <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md rounded-2xl overflow-hidden">
                                    <CardContent className="p-0">
                                        {pendingTransfers.length === 0 ? (
                                            <div className="text-center py-12 px-4 space-y-3">
                                                <FileCheck className="h-10 w-10 text-slate-350 mx-auto" />
                                                <p className="text-sm font-semibold text-slate-500">No pending bank transfer verifications.</p>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                                {pendingTransfers.map((p) => (
                                                    <div key={p.id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                                                        <div className="space-y-1.5 flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                                                                    {p.tenant?.name || p.tenant?.email || "Tenant"}
                                                                </h4>
                                                                <Badge className="bg-orange-500/10 border border-orange-500/20 text-orange-600 text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-lg">
                                                                    Pending Verification
                                                                </Badge>
                                                            </div>
                                                            <p className="text-xs text-slate-450 dark:text-slate-500 font-semibold truncate">
                                                                Property: {p.property?.title}
                                                            </p>
                                                            <div className="p-2.5 rounded-lg bg-orange-500/[0.03] dark:bg-orange-950/10 border border-orange-500/10 text-[11px] text-orange-850 dark:text-orange-350">
                                                                <span className="font-bold">Submitted Reference:</span> <code className="font-mono bg-orange-500/5 px-1 py-0.5 rounded">{p.transaction_reference}</code>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-4 justify-between w-full sm:w-auto">
                                                            <div className="text-left sm:text-right">
                                                                <p className="text-lg font-black text-orange-600 dark:text-orange-400">
                                                                    ₦{Number(p.amount).toLocaleString()}
                                                                </p>
                                                                <p className="text-[9px] text-slate-400 font-bold tracking-wider mt-0.5">
                                                                    Submitted: {new Date(p.created_at).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <Button 
                                                                    onClick={() => handleOpenApprovalModal(p, "reject")}
                                                                    variant="outline"
                                                                    className="rounded-xl border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700 min-h-[38px] px-3 text-xs font-bold"
                                                                >
                                                                    Decline
                                                                </Button>
                                                                <Button 
                                                                    onClick={() => handleOpenApprovalModal(p, "approve")}
                                                                    className="rounded-xl bg-green-600 hover:bg-green-700 text-white min-h-[38px] px-4 text-xs font-bold shadow-md shadow-green-600/15"
                                                                >
                                                                    Confirm
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Tab 3: Outstanding Invoices */}
                            <TabsContent value="unpaid" className="pt-3">
                                <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md rounded-2xl overflow-hidden">
                                    <CardContent className="p-0">
                                        {outstandingBills.length === 0 ? (
                                            <div className="text-center py-12 px-4 space-y-3">
                                                <Building2 className="h-10 w-10 text-slate-350 mx-auto" />
                                                <p className="text-sm font-semibold text-slate-500">No unpaid rent invoices active.</p>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                                {outstandingBills.map((bill) => {
                                                    const isOverdue = new Date(bill.due_date).getTime() < Date.now()
                                                    const unpaidAmount = Number(bill.amount) - Number(bill.amount_paid || 0)
                                                    return (
                                                        <div key={bill.id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                                                            <div className="space-y-1 flex-1 min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 truncate">
                                                                        {bill.rental?.property?.title || "Rental Property"}
                                                                    </h4>
                                                                    <Badge variant={isOverdue ? "destructive" : "outline"} className="text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-lg border">
                                                                        {isOverdue ? "Overdue" : "Pending"}
                                                                    </Badge>
                                                                </div>
                                                                <p className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                                                                    Tenant: {bill.rental?.tenant?.name || bill.rental?.tenant?.email || "Unknown"}
                                                                </p>
                                                                <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5">
                                                                    <Calendar className="h-3.5 w-3.5 text-blue-500" /> Due Date: {new Date(bill.due_date).toLocaleDateString()}
                                                                </p>
                                                            </div>

                                                            <div className="text-left sm:text-right w-full sm:w-auto">
                                                                <p className="text-base font-black text-slate-850 dark:text-slate-200">
                                                                    ₦{unpaidAmount.toLocaleString()}
                                                                </p>
                                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                                                    Total Rent: ₦{Number(bill.amount).toLocaleString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>

                    </div>

                    {/* Right Column: Bank Details & Quick Action Panels */}
                    <div className="space-y-6">
                        
                        {/* Bank Account Settings Card */}
                        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md rounded-2xl overflow-hidden">
                            <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
                                <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                                    <Banknote className="h-4.5 w-4.5 text-blue-500" /> Payout & Bank Account
                                </CardTitle>
                                <CardDescription>Settlement details for direct manual bank references.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-5 space-y-4">
                                {bankAccount ? (
                                    <div className="p-4 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 space-y-2 text-xs">
                                        <div className="space-y-1 font-semibold text-slate-600 dark:text-slate-350">
                                            <p>Bank: <span className="font-extrabold text-slate-900 dark:text-white">{bankAccount.bank_name}</span></p>
                                            <p>Account Name: <span className="font-extrabold text-slate-900 dark:text-white">{bankAccount.account_name}</span></p>
                                            <p>Account Number: <span className="font-extrabold text-sm tracking-widest text-slate-900 dark:text-white">{bankAccount.account_number}</span></p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 rounded-xl border border-orange-100 dark:border-orange-950/50 bg-orange-500/[0.02] dark:bg-orange-950/10 space-y-2.5 text-xs text-orange-850 dark:text-orange-300">
                                        <p className="font-bold flex items-center gap-1"><AlertCircle className="h-4 w-4" /> No Custom Bank Details</p>
                                        <p className="leading-relaxed">
                                            Tenants will see GTBank PRMS Escrow details by default. Save your local account below to configure direct tenant payments.
                                        </p>
                                    </div>
                                )}
                                <Button 
                                    onClick={() => setIsBankModalOpen(true)}
                                    className="w-full rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white min-h-[44px]"
                                >
                                    {bankAccount ? "Modify Bank Details" : "Set Custom Account"}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Quick Metrics Card */}
                        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md rounded-2xl overflow-hidden p-5 space-y-4">
                            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Escrow Reminders</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-xs p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
                                    <span className="font-semibold text-slate-500">Reminder Scanning</span>
                                    <Badge className="bg-emerald-500/10 border-emerald-500/20 text-emerald-600 text-[9px] uppercase tracking-wider font-extrabold">Active</Badge>
                                </div>
                                <div className="flex justify-between items-center text-xs p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
                                    <span className="font-semibold text-slate-500">Auto Reminders Daily</span>
                                    <span className="font-bold text-[10px] text-slate-400">At 30, 14, 7 Days</span>
                                </div>
                            </div>
                        </Card>

                    </div>

                </div>

            </div>

            {/* Bank Settings Modal */}
            {isBankModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200 text-slate-900 dark:text-slate-100">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-black leading-none">Configure Bank Details</h3>
                                <p className="text-xs text-slate-400 mt-1.5">Configure the account details where tenants should pay rent.</p>
                            </div>
                            <button onClick={() => setIsBankModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 min-h-[44px] min-w-[44px] flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                            </button>
                        </div>

                        <form onSubmit={handleSaveBankAccount} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="bank_name" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bank Name</Label>
                                <Input 
                                    id="bank_name" 
                                    placeholder="e.g. GTBank, Zenith Bank"
                                    value={bankForm.bank_name}
                                    onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })}
                                    className="h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="account_name" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account Name</Label>
                                <Input 
                                    id="account_name" 
                                    placeholder="e.g. John Doe Properties"
                                    value={bankForm.account_name}
                                    onChange={(e) => setBankForm({ ...bankForm, account_name: e.target.value })}
                                    className="h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="account_number" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account Number</Label>
                                <Input 
                                    id="account_number" 
                                    placeholder="10-digit Account Number"
                                    maxLength={10}
                                    value={bankForm.account_number}
                                    onChange={(e) => setBankForm({ ...bankForm, account_number: e.target.value.replace(/\D/g, '') })}
                                    className="h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl tracking-widest text-sm font-bold"
                                />
                            </div>

                            <Button 
                                type="submit" 
                                disabled={savingBank}
                                className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm tracking-wide mt-2"
                            >
                                {savingBank ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    "Save Account Details"
                                )}
                            </Button>
                        </form>
                    </div>
                </div>
            )}

            {/* Approval / Rejection Action Modal */}
            {isApprovalModalOpen && selectedPayment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200 text-slate-900 dark:text-slate-100">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-black leading-none">
                                    {approvalAction === "approve" ? "Confirm Rent Payment" : "Decline Rent Payment"}
                                </h3>
                                <p className="text-xs text-slate-400 mt-1.5">
                                    {approvalAction === "approve" 
                                        ? "Verify that you have received value in your bank account." 
                                        : "State the reason for rejecting this bank transfer reference."}
                                </p>
                            </div>
                            <button onClick={() => setIsApprovalModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 min-h-[44px] min-w-[44px] flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                            </button>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border text-xs space-y-2">
                            <div className="flex justify-between font-bold">
                                <span>Tenant:</span>
                                <span>{selectedPayment.tenant?.name || selectedPayment.tenant?.email}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Property:</span>
                                <span className="truncate max-w-[150px]">{selectedPayment.property?.title}</span>
                            </div>
                            <div className="flex justify-between border-t pt-2 font-black text-sm text-slate-900 dark:text-white">
                                <span>Amount:</span>
                                <span>₦{Number(selectedPayment.amount).toLocaleString()}</span>
                            </div>
                        </div>

                        {approvalAction === "reject" && (
                            <div className="space-y-1.5">
                                <Label htmlFor="reason" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rejection Reason</Label>
                                <Input 
                                    id="reason" 
                                    placeholder="e.g. Reference not found on bank statement"
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    className="h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl"
                                />
                            </div>
                        )}

                        <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                onClick={() => setIsApprovalModalOpen(false)}
                                className="flex-1 rounded-xl font-bold min-h-[44px]"
                            >
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleProcessTransfer}
                                disabled={submittingAction || (approvalAction === "reject" && !rejectionReason.trim())}
                                className={`flex-1 rounded-xl font-bold min-h-[44px] text-white shadow-lg ${
                                    approvalAction === "approve" 
                                        ? "bg-green-600 hover:bg-green-700 shadow-green-600/10" 
                                        : "bg-red-600 hover:bg-red-700 shadow-red-600/10"
                                }`}
                            >
                                {submittingAction ? (
                                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                                ) : approvalAction === "approve" ? (
                                    "Approve Payment"
                                ) : (
                                    "Decline Payment"
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}
