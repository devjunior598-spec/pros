"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { generateRentReceipt } from "@/lib/rent-receipt-generator"
import {
    CreditCard,
    DollarSign,
    Calendar,
    ArrowLeft,
    Download,
    Mail,
    Loader2,
    CheckCircle,
    XCircle,
    Building2,
    Wallet,
    AlertCircle,
    Clock,
    FileText,
    History
} from "lucide-react"

export default function TenantRentPaymentsPage() {
    const router = useRouter()
    const { toast } = useToast()
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [outstandingRent, setOutstandingRent] = useState(0)
    const [nextDueDate, setNextDueDate] = useState<string | null>(null)
    const [walletBalance, setWalletBalance] = useState(0)
    const [activeRentals, setActiveRentals] = useState<any[]>([])
    const [unpaidBills, setUnpaidBills] = useState<any[]>([])
    const [paymentHistory, setPaymentHistory] = useState<any[]>([])
    
    // Checkout Modal State
    const [isPayModalOpen, setIsPayModalOpen] = useState(false)
    const [selectedBill, setSelectedBill] = useState<any>(null)
    const [paymentAmount, setPaymentAmount] = useState<number>(0)
    const [amountType, setAmountType] = useState<string>("full")
    const [customAmount, setCustomAmount] = useState<string>("")
    const [paymentMethod, setPaymentMethod] = useState<string>("paystack")
    const [bankReference, setBankReference] = useState<string>("")
    const [landlordBank, setLandlordBank] = useState<any>(null)
    const [processing, setProcessing] = useState(false)
    const [emailingReceiptId, setEmailingReceiptId] = useState<string | null>(null)

    const fetchPageData = useCallback(async () => {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push("/login")
                return
            }

            // 1. Fetch Tenant Profile
            const { data: prof } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single()
            setProfile(prof)

            // 2. Fetch Active rentals
            const { data: rentals } = await supabase
                .from("rentals")
                .select("*, property:properties(*)")
                .eq("tenant_id", user.id)
                .eq("status", "active")
            setActiveRentals(rentals || [])

            // 3. Fetch Outstanding rent bills (type = rent/light/water where status is pending/overdue)
            const { data: bills } = await supabase
                .from("bills")
                .select("*, rental:rentals(*, property:properties(*))")
                .neq("status", "paid")
                .neq("status", "processing")
                .order("due_date", { ascending: true })

            // Filter only rent type bills for this page
            const rentBills = (bills || []).filter(
                (b: any) => b.rental?.tenant_id === user.id && b.type === "rent"
            )
            setUnpaidBills(rentBills)

            const totalOutstanding = rentBills.reduce((sum: number, b: any) => sum + (Number(b.amount) - Number(b.amount_paid || 0)), 0)
            setOutstandingRent(totalOutstanding)

            if (rentBills.length > 0) {
                setNextDueDate(rentBills[0].due_date)
            } else {
                setNextDueDate(null)
            }

            // 4. Fetch Wallet balance
            const { data: wallet } = await supabase
                .from("wallets")
                .select("balance")
                .eq("tenant_id", user.id)
                .maybeSingle()
            setWalletBalance(wallet?.balance || 0)

            // 5. Fetch payment history from rent_payments
            const { data: history } = await supabase
                .from("rent_payments")
                .select("*, property:properties(title, address)")
                .eq("tenant_id", user.id)
                .order("created_at", { ascending: false })
            setPaymentHistory(history || [])

        } catch (error) {
            console.error("Error fetching payment data:", error)
        } finally {
            setLoading(false)
        }
    }, [router])

    useEffect(() => {
        fetchPageData()
    }, [fetchPageData])

    // Load Landlord Bank details when pay modal opens
    const handleOpenPayModal = async (bill: any) => {
        setSelectedBill(bill)
        setPaymentAmount(Number(bill.amount) - Number(bill.amount_paid || 0))
        setAmountType("full")
        setCustomAmount("")
        setPaymentMethod("paystack")
        setBankReference("")
        setIsPayModalOpen(true)

        if (bill.rental?.property?.landlord_id) {
            const { data: bank } = await supabase
                .from("bank_accounts")
                .select("*")
                .eq("landlord_id", bill.rental.property.landlord_id)
                .maybeSingle()
            setLandlordBank(bank)
        }
    }

    useEffect(() => {
        if (!selectedBill) return
        const outstanding = Number(selectedBill.amount) - Number(selectedBill.amount_paid || 0)
        if (amountType === "full") {
            setPaymentAmount(outstanding)
        } else {
            setPaymentAmount(parseFloat(customAmount) || 0)
        }
    }, [amountType, customAmount, selectedBill])

    const handleProcessPayment = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedBill || !profile) return

        const outstanding = Number(selectedBill.amount) - Number(selectedBill.amount_paid || 0)
        if (paymentAmount <= 0 || paymentAmount > outstanding) {
            alert("Invalid payment amount.")
            return
        }

        setProcessing(true)
        const reference = `rent-${selectedBill.id}-${Date.now()}`
        const meta = {
            bill_id: selectedBill.id,
            tenant_id: profile.id,
            landlord_id: selectedBill.rental.property.landlord_id,
            property_id: selectedBill.rental.property.id,
            due_date: selectedBill.due_date
        }

        try {
            // Option 1: Paystack / Flutterwave Online Payments
            if (paymentMethod === "paystack" || paymentMethod === "flutterwave") {
                const initRes = await fetch("/api/payments/initiate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        amount: paymentAmount,
                        email: profile.email,
                        reference,
                        paymentMethod: paymentMethod,
                        metadata: meta
                    })
                })
                const initData = await initRes.json()
                if (!initRes.ok || !initData.payment_url) {
                    throw new Error(initData.error || "Failed to initialize payment gateway")
                }
                
                // Insert a pending record in rent_payments
                await supabase.from("rent_payments").insert({
                    tenant_id: profile.id,
                    landlord_id: selectedBill.rental.property.landlord_id,
                    property_id: selectedBill.rental.property.id,
                    bill_id: selectedBill.id,
                    amount: paymentAmount,
                    payment_method: paymentMethod === "paystack" ? "Paystack" : "Flutterwave",
                    transaction_reference: reference,
                    payment_status: "Pending",
                    due_date: selectedBill.due_date
                })

                toast({ title: "Redirecting...", description: "Taking you to secure checkout gateway." })
                window.location.href = initData.payment_url
                return
            }

            // Option 2: Wallet Payments
            else if (paymentMethod === "wallet") {
                if (walletBalance < paymentAmount) {
                    alert("Insufficient wallet balance.")
                    setProcessing(false)
                    return
                }

                const { data: rpcRes, error: rpcError } = await supabase.rpc("process_wallet_payment", {
                    p_bill_id: selectedBill.id,
                    p_amount: paymentAmount,
                    p_tenant_id: profile.id,
                    p_reference: reference
                })

                if (rpcError) throw rpcError
                if (rpcRes && (rpcRes as any).success === false) {
                    throw new Error((rpcRes as any).message || "Wallet processing failed")
                }

                // Insert Paid record directly
                const receiptNo = `RCP-${new Date().toISOString().substring(0,10).replace(/-/g, '')}-${reference.substring(reference.length - 4)}`.toUpperCase()
                
                await supabase.from("rent_payments").insert({
                    tenant_id: profile.id,
                    landlord_id: selectedBill.rental.property.landlord_id,
                    property_id: selectedBill.rental.property.id,
                    bill_id: selectedBill.id,
                    amount: paymentAmount,
                    payment_method: "Wallet",
                    transaction_reference: reference,
                    payment_status: "Paid",
                    due_date: selectedBill.due_date,
                    payment_date: new Date().toISOString(),
                    receipt_number: receiptNo
                })

                toast({ title: "Payment Successful!", description: `₦${paymentAmount.toLocaleString()} paid from wallet balance.` })
                setIsPayModalOpen(false)
                fetchPageData()
            }

            // Option 3: Manual Bank Transfer
            else if (paymentMethod === "transfer") {
                if (!bankReference.trim()) {
                    alert("Please enter transaction transfer reference code.")
                    setProcessing(false)
                    return
                }

                const res = await fetch("/api/payments/bank-transfer", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        propertyId: selectedBill.rental.property.id,
                        tenantId: profile.id,
                        landlordId: selectedBill.rental.property.landlord_id,
                        amount: paymentAmount,
                        reference: bankReference,
                        dueDate: selectedBill.due_date,
                        billId: selectedBill.id
                    })
                })

                const result = await res.json()
                if (!res.ok) throw new Error(result.error || "Failed to submit bank transfer reference")

                toast({
                    title: "Reference Submitted!",
                    description: "Manual verification is pending landlord approval."
                })
                setIsPayModalOpen(false)
                fetchPageData()
            }

        } catch (error: any) {
            console.error(error)
            alert(error.message || "An error occurred while processing payment.")
        } finally {
            setProcessing(false)
        }
    }

    const handleDownloadPDF = (payment: any) => {
        try {
            toast({ title: "Generating PDF...", description: "Preparing your receipt download." })
            const doc = generateRentReceipt({
                receiptNumber: payment.receipt_number || "N/A",
                datePaid: new Date(payment.payment_date || payment.created_at).toLocaleDateString(),
                tenantName: profile?.name || profile?.email || "Tenant",
                tenantEmail: profile?.email || "",
                propertyName: payment.property?.title || "Rental Property",
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

    const handleEmailReceipt = async (payment: any) => {
        setEmailingReceiptId(payment.id)
        try {
            const res = await fetch("/api/receipts/email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    receiptNumber: payment.receipt_number,
                    email: profile.email,
                    tenantName: profile.name || profile.email,
                    amountPaid: payment.amount,
                    datePaid: new Date(payment.payment_date || payment.created_at).toLocaleDateString(),
                    propertyName: payment.property?.title || "Property",
                    paymentMethod: payment.payment_method,
                    transactionReference: payment.transaction_reference
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed to send email")

            toast({ title: "Receipt Emailed!", description: `PDF copy has been sent to ${profile.email}.` })
        } catch (error: any) {
            alert(error.message || "Email request failed.")
        } finally {
            setEmailingReceiptId(null)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            </div>
        )
    }

    const nextDueFormatted = nextDueDate 
        ? new Date(nextDueDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
        : "No upcoming rent"

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 pb-20">
            <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 p-4 sm:p-6 md:p-8">
                
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
                            <CreditCard className="h-7 w-7 text-blue-500" /> Rent Payments
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Manage online payments, track balances, and download receipts.
                        </p>
                    </div>
                    <Button variant="ghost" onClick={() => router.push("/dashboard")} className="rounded-xl font-bold min-h-[44px]">
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-3">
                    
                    <Card className="border border-red-200/50 dark:border-red-950 bg-red-500/[0.02] dark:bg-red-950/10 shadow-sm rounded-2xl overflow-hidden">
                        <CardHeader className="pb-2">
                            <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider block">Current Rent Balance</span>
                            <CardTitle className="text-3xl font-black text-red-600 dark:text-red-400 mt-1">
                                ₦{outstandingRent.toLocaleString()}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-slate-400 font-semibold">Total unpaid rent amount outstanding</p>
                        </CardContent>
                    </Card>

                    <Card className="border border-blue-200/50 dark:border-blue-950 bg-blue-500/[0.02] dark:bg-blue-950/10 shadow-sm rounded-2xl overflow-hidden">
                        <CardHeader className="pb-2">
                            <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider block">Due Date</span>
                            <CardTitle className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-2">
                                {nextDueFormatted}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-slate-400 font-semibold">Next rent billing target date</p>
                        </CardContent>
                    </Card>

                    <Card className="border border-green-200/50 dark:border-green-950 bg-green-500/[0.02] dark:bg-green-950/10 shadow-sm rounded-2xl overflow-hidden">
                        <CardHeader className="pb-2">
                            <span className="text-[10px] text-green-500 font-bold uppercase tracking-wider block">Wallet Balance</span>
                            <CardTitle className="text-3xl font-black text-green-600 dark:text-green-400 mt-1">
                                ₦{walletBalance.toLocaleString()}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-slate-400 font-semibold">Funded wallet ledger balance</p>
                        </CardContent>
                    </Card>

                </div>

                {/* Main Content Layout */}
                <div className="grid gap-6 md:grid-cols-3">
                    
                    {/* Left: Active Bills & Checkout Portal */}
                    <div className="md:col-span-2 space-y-6">
                        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md rounded-2xl overflow-hidden">
                            <CardHeader className="border-b border-slate-100 dark:border-slate-800/80">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-blue-500" /> Active Rent Invoices
                                </CardTitle>
                                <CardDescription>Outstanding rent bills available to pay.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                {unpaidBills.length === 0 ? (
                                    <div className="text-center py-12 px-4 space-y-3">
                                        <Building2 className="h-10 w-10 text-slate-350 mx-auto" />
                                        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">All caught up! No unpaid rent invoices.</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                        {unpaidBills.map((bill) => {
                                            const isOverdue = new Date(bill.due_date).getTime() < Date.now()
                                            const unpaidAmount = Number(bill.amount) - Number(bill.amount_paid || 0)
                                            return (
                                                <div key={bill.id} className="p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                                                    <div className="space-y-1.5 flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 truncate">
                                                                {bill.rental?.property?.title || "Property Rent"}
                                                            </h4>
                                                            <Badge variant={isOverdue ? "destructive" : "outline"} className="text-[10px] font-bold px-2 py-0.5 rounded-lg border">
                                                                {isOverdue ? "Overdue" : "Pending"}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-xs text-slate-450 dark:text-slate-500 font-semibold flex items-center gap-1.5">
                                                            <Calendar className="h-3.5 w-3.5 text-blue-500" /> Due Date: {new Date(bill.due_date).toLocaleDateString()}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-5 justify-between w-full sm:w-auto">
                                                        <div className="text-left sm:text-right">
                                                            <p className="text-lg font-black text-blue-600 dark:text-blue-400">
                                                                ₦{unpaidAmount.toLocaleString()}
                                                            </p>
                                                            {Number(bill.amount_paid || 0) > 0 && (
                                                                <p className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                                                                    ₦{Number(bill.amount_paid).toLocaleString()} Paid
                                                                </p>
                                                            )}
                                                        </div>
                                                        <Button 
                                                            onClick={() => handleOpenPayModal(bill)}
                                                            className="rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white min-h-[44px] shadow-lg shadow-blue-600/15"
                                                        >
                                                            Pay Now
                                                        </Button>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right: Payment History Queue */}
                    <div className="md:col-span-1 space-y-6">
                        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md rounded-2xl overflow-hidden">
                            <CardHeader className="border-b border-slate-100 dark:border-slate-800/80">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <History className="h-5 w-5 text-blue-500" /> Payment History
                                </CardTitle>
                                <CardDescription>Your ledger transaction logs.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                {paymentHistory.length === 0 ? (
                                    <div className="text-center py-10 px-4">
                                        <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">No payment logs recorded.</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                        {paymentHistory.map((p) => {
                                            const isPaid = p.payment_status === "Paid"
                                            return (
                                                <div key={p.id} className="p-4 space-y-3 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
                                                                {p.property?.title || "Rental Property"}
                                                            </p>
                                                            <span className="text-[10px] font-mono text-slate-400 block mt-0.5">{p.transaction_reference.substring(0,12)}</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-xs font-black text-slate-900 dark:text-slate-100">₦{Number(p.amount).toLocaleString()}</p>
                                                            <span className="text-[9px] text-slate-400 mt-0.5 block">{new Date(p.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100/50 dark:border-slate-800/50">
                                                        <Badge className={`text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-lg border ${
                                                            isPaid ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" : "bg-yellow-500/10 border-yellow-500/20 text-yellow-600"
                                                        }`}>
                                                            {p.payment_status}
                                                        </Badge>

                                                        {isPaid && (
                                                            <div className="flex gap-1">
                                                                <Button 
                                                                    size="icon" 
                                                                    variant="ghost" 
                                                                    onClick={() => handleDownloadPDF(p)}
                                                                    className="h-7 w-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                                                                    title="Download PDF"
                                                                >
                                                                    <Download className="h-3.5 w-3.5" />
                                                                </Button>
                                                                <Button 
                                                                    size="icon" 
                                                                    variant="ghost" 
                                                                    disabled={emailingReceiptId === p.id}
                                                                    onClick={() => handleEmailReceipt(p)}
                                                                    className="h-7 w-7 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-slate-100"
                                                                    title="Email PDF Copy"
                                                                >
                                                                    {emailingReceiptId === p.id ? (
                                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                    ) : (
                                                                        <Mail className="h-3.5 w-3.5" />
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                </div>

            </div>

            {/* Interactive Checkout Modal */}
            {isPayModalOpen && selectedBill && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200 text-slate-900 dark:text-slate-100 scrollbar-thin">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-black leading-none">Process Rent Payment</h3>
                                <p className="text-xs text-slate-400 mt-1.5">Select a payment option and amount to proceed.</p>
                            </div>
                            <button onClick={() => setIsPayModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 min-h-[44px] min-w-[44px] flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                            </button>
                        </div>

                        <form onSubmit={handleProcessPayment} className="space-y-4">
                            
                            {/* Invoice details */}
                            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 space-y-2 text-xs">
                                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                                    <span>Property Name</span>
                                    <span>{selectedBill.rental?.property?.title || "Rental Unit"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Base Period</span>
                                    <span className="capitalize">{selectedBill.billing_period || "Monthly"}</span>
                                </div>
                                <div className="flex justify-between border-t border-slate-200/50 dark:border-slate-800/50 pt-2 font-black text-sm text-blue-600 dark:text-blue-400">
                                    <span>Outstanding Balance</span>
                                    <span>₦{(Number(selectedBill.amount) - Number(selectedBill.amount_paid || 0)).toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Choose channels tabs */}
                            <Tabs value={paymentMethod} onValueChange={setPaymentMethod} className="w-full">
                                <TabsList className="grid w-full grid-cols-4 bg-slate-100 dark:bg-slate-950 rounded-xl p-1">
                                    <TabsTrigger value="paystack" className="text-xs font-bold py-1.5 rounded-lg">Paystack</TabsTrigger>
                                    <TabsTrigger value="flutterwave" className="text-xs font-bold py-1.5 rounded-lg">FWave</TabsTrigger>
                                    <TabsTrigger value="wallet" className="text-xs font-bold py-1.5 rounded-lg">Wallet</TabsTrigger>
                                    <TabsTrigger value="transfer" className="text-xs font-bold py-1.5 rounded-lg">Transfer</TabsTrigger>
                                </TabsList>

                                <TabsContent value="paystack" className="pt-3 text-xs text-slate-400 space-y-1.5">
                                    <p className="font-semibold leading-relaxed">
                                        🔗 You will be redirected to secure Paystack transaction portal to complete payment with card, bank, or USSD.
                                    </p>
                                </TabsContent>

                                <TabsContent value="flutterwave" className="pt-3 text-xs text-slate-400 space-y-1.5">
                                    <p className="font-semibold leading-relaxed">
                                        🔗 You will be redirected to secure Flutterwave checkout form to complete payment using cards, transfer, or mobile money.
                                    </p>
                                </TabsContent>

                                <TabsContent value="wallet" className="pt-3 space-y-3">
                                    <div className="flex items-center justify-between p-4 rounded-xl border border-blue-100 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
                                        <div>
                                            <p className="text-xs text-slate-400 font-semibold">Wallet balance</p>
                                            <p className="text-xl font-black text-blue-600 dark:text-blue-400 mt-0.5">₦{walletBalance.toLocaleString()}</p>
                                        </div>
                                        {walletBalance < paymentAmount && (
                                            <Badge variant="destructive" className="text-[9px] uppercase tracking-wider font-extrabold flex items-center gap-1 rounded-lg">
                                                <AlertCircle className="h-3 w-3" /> Insufficient Funds
                                            </Badge>
                                        )}
                                    </div>
                                </TabsContent>

                                <TabsContent value="transfer" className="pt-3 space-y-3">
                                    <div className="p-4 rounded-xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900 space-y-2 text-xs">
                                        <p className="font-bold text-orange-850 dark:text-orange-300">Landlord Bank Details:</p>
                                        {landlordBank ? (
                                            <div className="space-y-1 font-semibold text-slate-655 dark:text-slate-300">
                                                <p>Bank Name: <span className="font-extrabold">{landlordBank.bank_name}</span></p>
                                                <p>Account Number: <span className="font-extrabold text-sm tracking-wider text-slate-900 dark:text-white">{landlordBank.account_number}</span></p>
                                                <p>Account Name: <span className="font-extrabold">{landlordBank.account_name}</span></p>
                                            </div>
                                        ) : (
                                            <div className="space-y-1 font-semibold text-slate-600 dark:text-slate-350">
                                                <p>Bank Name: <span className="font-extrabold">PRMS Escrow Bank (GTBank)</span></p>
                                                <p>Account Number: <span className="font-extrabold text-sm tracking-wider text-slate-900 dark:text-white">0123456789</span></p>
                                                <p>Account Name: <span className="font-extrabold">PRMS Rent Escrow Account</span></p>
                                            </div>
                                        )}
                                        <p className="text-[10px] text-slate-400 italic pt-1 leading-normal">
                                            Transfer rent to account details above, then enter the transaction reference details below.
                                        </p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="bank-ref" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Transaction Reference</Label>
                                        <Input 
                                            id="bank-ref" 
                                            placeholder="Enter your transfer Reference/ID code"
                                            value={bankReference}
                                            onChange={(e) => setBankReference(e.target.value)}
                                            className="h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl"
                                        />
                                    </div>
                                </TabsContent>
                            </Tabs>

                            {/* Payment Amount selection */}
                            <div className="space-y-3">
                                <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Payment Amount</Label>
                                <Select value={amountType} onValueChange={setAmountType}>
                                    <SelectTrigger className="h-11 rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="full">Full Outstanding Amount</SelectItem>
                                        <SelectItem value="partial">Partial Payment</SelectItem>
                                    </SelectContent>
                                </Select>

                                {amountType === "partial" && (
                                    <div className="space-y-1">
                                        <Input 
                                            type="number" 
                                            placeholder="Enter amount to pay"
                                            value={customAmount}
                                            onChange={(e) => setCustomAmount(e.target.value)}
                                            className="h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl"
                                        />
                                        {customAmount && paymentAmount <= 0 && (
                                            <p className="text-[10px] text-red-500 font-semibold">Payment must be greater than zero.</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Terms Checkbox */}
                            <p className="text-[10px] text-center text-slate-400 leading-normal">
                                Secure payments are verification audited server-side. PDF Receipts are generated upon gateway callback confirmation.
                            </p>

                            <Button 
                                type="submit" 
                                disabled={processing || (paymentMethod === "wallet" && walletBalance < paymentAmount) || paymentAmount <= 0}
                                className="w-full h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm tracking-wide mt-2 shadow-lg shadow-green-600/10"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Redirecting to secure gateway...
                                    </>
                                ) : (
                                    `Confirm Rent Payment (₦${paymentAmount.toLocaleString()})`
                                )}
                            </Button>
                        </form>
                    </div>
                </div>
            )}

        </div>
    )
}
