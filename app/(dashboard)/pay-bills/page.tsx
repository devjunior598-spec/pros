"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Bill, PaymentTransaction } from "@/types"
import { PaymentModal } from "@/components/tenant/payment-modal"
import { formatCurrency } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { generateReceipt } from "@/lib/receipt-generator"
import Link from "next/link"
import {
    ArrowLeft, CreditCard, AlertCircle, CalendarDays, Wallet,
    TrendingDown, Home, Zap, Droplets, Wrench, Settings,
    ChevronDown, ChevronUp, Download, Loader2, Clock, CheckCircle2,
    RefreshCw, Receipt
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

// ─── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric'
    })
}

function getDueDateStatus(dueDate: string): 'overdue' | 'soon' | 'future' {
    const diff = new Date(dueDate).getTime() - Date.now()
    const days = diff / (1000 * 60 * 60 * 24)
    if (days < 0) return 'overdue'
    if (days <= 7) return 'soon'
    return 'future'
}

function getDaysLabel(dueDate: string) {
    const diff = new Date(dueDate).getTime() - Date.now()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    if (days < 0) return `${Math.abs(days)}d overdue`
    if (days === 0) return 'Due today'
    return `${days}d left`
}

const BILL_TYPE_ICONS: Record<string, React.ReactNode> = {
    rent: <Home className="h-4 w-4" />,
    electricity: <Zap className="h-4 w-4" />,
    light: <Zap className="h-4 w-4" />,
    water: <Droplets className="h-4 w-4" />,
    gas: <Wrench className="h-4 w-4" />,
    service: <Settings className="h-4 w-4" />,
    custom: <CreditCard className="h-4 w-4" />,
}

const BILL_TYPE_COLORS: Record<string, string> = {
    rent: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    electricity: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    light: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    water: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    gas: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    service: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    custom: "bg-slate-500/10 text-slate-400 border-slate-500/20",
}

// ─── Summary Card ──────────────────────────────────────────────────────────────
function SummaryCard({
    label, value, subtext, icon, accent
}: {
    label: string
    value: string
    subtext?: string
    icon: React.ReactNode
    accent: 'red' | 'orange' | 'green' | 'blue'
}) {
    const accentMap = {
        red: { border: "border-red-500/20", icon: "bg-red-500/10 text-red-400", text: "text-red-400" },
        orange: { border: "border-orange-500/20", icon: "bg-orange-500/10 text-orange-400", text: "text-orange-400" },
        green: { border: "border-green-500/20", icon: "bg-green-500/10 text-green-400", text: "text-green-400" },
        blue: { border: "border-blue-500/20", icon: "bg-blue-500/10 text-blue-400", text: "text-blue-400" },
    }
    const a = accentMap[accent]

    return (
        <div className={cn(
            "relative overflow-hidden rounded-2xl border p-5",
            "bg-white/5 dark:bg-slate-900/80 backdrop-blur",
            a.border
        )}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</p>
                    <p className={cn("text-2xl font-bold mt-1.5", a.text)}>{value}</p>
                    {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
                </div>
                <div className={cn("p-2.5 rounded-xl", a.icon)}>
                    {icon}
                </div>
            </div>
        </div>
    )
}

// ─── Bill Card ─────────────────────────────────────────────────────────────────
function BillCard({ bill, walletBalance, onPayClick }: {
    bill: Bill
    walletBalance: number
    onPayClick: (bill: Bill) => void
}) {
    const dueSt = getDueDateStatus(bill.due_date)
    const outstanding = bill.amount - (bill.amount_paid || 0)

    const dueDateColor = {
        overdue: "text-red-400",
        soon: "text-orange-400",
        future: "text-green-400",
    }[dueSt]

    const dueBg = {
        overdue: "bg-red-500/10 border-red-500/20",
        soon: "bg-orange-500/10 border-orange-500/20",
        future: "bg-slate-800/60 border-slate-700/40",
    }[dueSt]

    const statusVariant: Record<string, string> = {
        paid: "bg-green-500/10 text-green-400 border-green-500/20",
        overdue: "bg-red-500/10 text-red-400 border-red-500/20",
        partially_paid: "bg-orange-500/10 text-orange-400 border-orange-500/20",
        pending: "bg-slate-500/10 text-slate-400 border-slate-500/20",
        processing: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        unpaid: "bg-red-500/10 text-red-400 border-red-500/20",
    }

    const typeColor = BILL_TYPE_COLORS[bill.type] || BILL_TYPE_COLORS.custom
    const typeIcon = BILL_TYPE_ICONS[bill.type] || <CreditCard className="h-4 w-4" />

    return (
        <div className={cn(
            "group rounded-2xl border transition-all duration-200",
            "bg-white/5 dark:bg-slate-900/80 backdrop-blur",
            "border-slate-800/60 hover:border-slate-700/60",
            bill.status === 'overdue' && "border-red-500/20 hover:border-red-500/30"
        )}>
            <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                    {/* Left */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            {/* Type badge */}
                            <span className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border capitalize",
                                typeColor
                            )}>
                                {typeIcon}
                                {bill.type}
                            </span>
                            {/* Status badge */}
                            <span className={cn(
                                "inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border capitalize",
                                statusVariant[bill.status] || statusVariant.pending
                            )}>
                                {bill.status.replace('_', ' ')}
                            </span>
                        </div>

                        {bill.billing_period && (
                            <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {bill.billing_period}
                            </p>
                        )}
                    </div>

                    {/* Amount */}
                    <div className="text-right flex-shrink-0">
                        <p className="text-xl font-bold text-slate-100">
                            ₦{bill.amount.toLocaleString()}
                        </p>
                        {(bill.amount_paid || 0) > 0 && (
                            <p className="text-xs text-slate-500 mt-0.5">
                                ₦{(bill.amount_paid || 0).toLocaleString()} paid
                            </p>
                        )}
                    </div>
                </div>

                {/* Due date row */}
                <div className="mt-3 flex items-center justify-between gap-3">
                    <div className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium",
                        dueBg
                    )}>
                        <CalendarDays className={cn("h-3.5 w-3.5", dueDateColor)} />
                        <span className={dueDateColor}>
                            Due {formatDate(bill.due_date)}
                        </span>
                        <span className={cn("font-bold ml-1", dueDateColor)}>
                            · {getDaysLabel(bill.due_date)}
                        </span>
                    </div>

                    {/* Pay button */}
                    {bill.status !== 'paid' && (
                        <button
                            onClick={() => onPayClick(bill)}
                            className={cn(
                                "flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-sm font-bold transition-all",
                                "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20",
                                "hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98]"
                            )}
                        >
                            <CreditCard className="h-3.5 w-3.5" />
                            Pay Now
                        </button>
                    )}
                </div>

                {/* Progress bar for partial payments */}
                {(bill.amount_paid || 0) > 0 && bill.status !== 'paid' && (
                    <div className="mt-3">
                        <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                            <span>Progress</span>
                            <span>{Math.round(((bill.amount_paid || 0) / bill.amount) * 100)}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-800">
                            <div
                                className="h-full rounded-full bg-orange-500 transition-all"
                                style={{ width: `${((bill.amount_paid || 0) / bill.amount) * 100}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── Payment History Row ────────────────────────────────────────────────────────
function HistoryRow({ tx, onDownload }: {
    tx: PaymentTransaction
    onDownload: (tx: PaymentTransaction) => void
}) {
    const statusColors: Record<string, string> = {
        success: "bg-green-500/10 text-green-400 border-green-500/20",
        failed: "bg-red-500/10 text-red-400 border-red-500/20",
        pending: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    }

    return (
        <div className="flex items-center gap-4 px-4 py-3 border-b border-slate-800/40 last:border-0 hover:bg-slate-800/20 transition-colors">
            <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Receipt className="h-4 w-4 text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">
                    {tx.payment_method.charAt(0).toUpperCase() + tx.payment_method.slice(1)} Payment
                </p>
                <p className="text-xs text-slate-500 font-mono">{tx.reference.substring(0, 12)}...</p>
            </div>
            <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-slate-100">₦{tx.amount.toLocaleString()}</p>
                <p className="text-[10px] text-slate-500">{formatDate(tx.created_at)}</p>
            </div>
            <span className={cn(
                "text-xs px-2.5 py-1 rounded-lg border font-medium",
                statusColors[tx.status] || statusColors.pending
            )}>
                {tx.status}
            </span>
            {tx.status === 'success' && (
                <button
                    onClick={() => onDownload(tx)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-700/50 transition-colors"
                    title="Download Receipt"
                >
                    <Download className="h-4 w-4" />
                </button>
            )}
        </div>
    )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function PayBillsPage() {
    const [summaryStats, setSummaryStats] = useState({
        totalOutstanding: 0,
        nextDueDate: null as string | null,
        walletBalance: 0,
        overdueCount: 0,
    })
    const [bills, setBills] = useState<Bill[]>([])
    const [transactions, setTransactions] = useState<PaymentTransaction[]>([])
    const [loading, setLoading] = useState(true)
    const [historyOpen, setHistoryOpen] = useState(false)
    const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const { toast } = useToast()

    const fetchPageData = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // 1. Bills
        const { data: billsData } = await supabase
            .from('bills')
            .select('*')
            .order('due_date', { ascending: true })

        if (billsData) {
            const typed = billsData as any as Bill[]
            setBills(typed)
            const unpaid = typed.filter(b => b.status !== 'paid' && b.status !== 'processing')
            const overdue = typed.filter(b => b.status === 'overdue')
            const totalOutstanding = unpaid.reduce((sum, b) => sum + (Number(b.amount) - Number(b.amount_paid || 0)), 0)
            const nextDue = unpaid.length > 0 ? unpaid[0].due_date : null
            setSummaryStats(prev => ({ ...prev, totalOutstanding, nextDueDate: nextDue, overdueCount: overdue.length }))
        }

        // 2. Wallet
        const { data: wallet } = await supabase.from('wallets').select('balance').eq('tenant_id', user.id).single()
        if (wallet) setSummaryStats(prev => ({ ...prev, walletBalance: wallet.balance }))

        // 3. Transactions
        const { data: txs } = await supabase
            .from('payments')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20)
        if (txs) setTransactions(txs as any)
    }, [])

    useEffect(() => {
        setLoading(true)
        fetchPageData().finally(() => setLoading(false))

        const channel = supabase
            .channel('pay-bills-page')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bills' }, fetchPageData)
            .subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [fetchPageData])

    const handleRefresh = async () => {
        setRefreshing(true)
        await fetchPageData()
        setRefreshing(false)
    }

    const handlePayClick = (bill: Bill) => {
        setSelectedBill(bill)
        setIsPaymentModalOpen(true)
    }

    const processPayment = async (billId: string, amount: number, method: string) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const email = user.email || ''

        try {
            const reference = `bill-${billId}-${Date.now()}`

            if (method === 'wallet') {
                const { data: rpcRes, error: walletError } = await supabase.rpc('process_wallet_payment', {
                    p_bill_id: billId,
                    p_amount: amount,
                    p_tenant_id: user.id,
                    p_reference: reference
                })
                if (walletError) throw walletError
                if (rpcRes && (rpcRes as any).success === false) {
                    throw new Error((rpcRes as any).message || 'Wallet payment failed')
                }
            } else {
                if (!email) throw new Error('Email required for card or bank payments.')
                const initRes = await fetch('/api/initiate-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        amount, email, reference,
                        metadata: { bill_id: billId, payment_method: method },
                        channels: [method === 'card' ? 'card' : 'bank']
                    }),
                })
                const initData = await initRes.json()
                if (!initRes.ok || !initData.payment_url) throw new Error(initData?.message || 'Failed to initialize payment')
                window.location.href = initData.payment_url
                return
            }

            const bill = bills.find(b => b.id === billId)
            if (!bill) return
            const newAmountPaid = (bill.amount_paid || 0) + amount
            const newStatus = newAmountPaid >= bill.amount ? 'paid' : 'partially_paid'
            await supabase.from('bills').update({
                amount_paid: newAmountPaid,
                status: newStatus,
                paid_at: newStatus === 'paid' ? new Date().toISOString() : null
            }).eq('id', billId)

            setIsPaymentModalOpen(false)
            fetchPageData()
            toast({ title: "Payment successful!", description: `Paid ${formatCurrency(amount)}` })
        } catch (error: any) {
            toast({ title: "Payment failed", description: error.message || "An error occurred.", variant: "destructive" })
        }
    }

    const handleDownloadReceipt = async (tx: PaymentTransaction) => {
        try {
            toast({ title: "Generating Receipt", description: "Please wait..." })
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
            const { data: bill } = await supabase
                .from('bills')
                .select('id, type, rental:rentals(property:properties(title, address))')
                .eq('id', tx.bill_id)
                .single()
            const rentalData = (bill as any)?.rental
            const property = Array.isArray(rentalData?.property) ? rentalData.property[0] : rentalData?.property
            const receiptData = {
                receiptNumber: `RCP-${tx.created_at.substring(0, 10).replace(/-/g, '')}-${tx.reference.substring(0, 4)}`.toUpperCase(),
                date: new Date(tx.created_at).toLocaleDateString(),
                tenantName: profile?.name || user.email || "Valued Tenant",
                tenantEmail: user.email || "",
                propertyAddress: `${property?.title || 'Rental'} - ${property?.address || 'N/A'}`,
                paymentMethod: tx.payment_method,
                items: [{ description: `${bill?.type?.toUpperCase() || 'PAYMENT'} - ${tx.reference}`, amount: tx.amount }],
                totalAmount: tx.amount,
                status: tx.status
            }
            const doc = generateReceipt(receiptData)
            doc.save(`Receipt-${receiptData.receiptNumber}.pdf`)
            toast({ title: "Receipt Downloaded", variant: "default" })
        } catch (err) {
            toast({ title: "Error", description: "Failed to generate receipt.", variant: "destructive" })
        }
    }

    const unpaidBills = bills.filter(b => b.status !== 'paid')
    const paidBills = bills.filter(b => b.status === 'paid')

    return (
        <div className="min-h-screen pb-16">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Link href="/dashboard" className="flex items-center gap-1 hover:text-blue-400 transition-colors">
                            <ArrowLeft className="h-4 w-4" />
                            Dashboard
                        </Link>
                        <span className="text-slate-600">/</span>
                        <span className="text-slate-100 font-medium">Pay Bills</span>
                    </div>

                    <div className="flex items-end justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Pay Bills</h1>
                            <p className="text-slate-400 mt-1">View and settle your rent, utilities, and property charges.</p>
                        </div>
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-slate-400 hover:text-slate-100 border border-slate-700/60 hover:bg-slate-800/60 transition-colors"
                        >
                            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                            Refresh
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    </div>
                ) : (
                    <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <SummaryCard
                                label="Total Outstanding"
                                value={`₦${summaryStats.totalOutstanding.toLocaleString()}`}
                                subtext={summaryStats.overdueCount > 0 ? `${summaryStats.overdueCount} bills need attention` : "Keep it up!"}
                                icon={<TrendingDown className="h-5 w-5" />}
                                accent="red"
                            />
                            <SummaryCard
                                label="Next Due Date"
                                value={summaryStats.nextDueDate ? formatDate(summaryStats.nextDueDate) : "None"}
                                subtext={summaryStats.nextDueDate ? getDaysLabel(summaryStats.nextDueDate) : "All paid up"}
                                icon={<CalendarDays className="h-5 w-5" />}
                                accent="orange"
                            />
                            <SummaryCard
                                label="Wallet Balance"
                                value={`₦${summaryStats.walletBalance.toLocaleString()}`}
                                subtext="Available for instant pay"
                                icon={<Wallet className="h-5 w-5" />}
                                accent="green"
                            />
                            <SummaryCard
                                label="Overdue Bills"
                                value={summaryStats.overdueCount.toString()}
                                subtext={summaryStats.overdueCount > 0 ? "Pay immediately to avoid fees" : "You're all clear!"}
                                icon={<AlertCircle className="h-5 w-5" />}
                                accent="red"
                            />
                        </div>

                        {/* Outstanding Bills */}
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-slate-100">
                                    Outstanding Bills
                                    {unpaidBills.length > 0 && (
                                        <span className="ml-2 text-sm font-normal text-slate-400">({unpaidBills.length})</span>
                                    )}
                                </h2>
                                {paidBills.length > 0 && (
                                    <span className="flex items-center gap-1 text-xs text-green-400">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        {paidBills.length} paid
                                    </span>
                                )}
                            </div>

                            {unpaidBills.length === 0 ? (
                                <div className="rounded-2xl border border-slate-800/60 bg-white/5 dark:bg-slate-900/80 backdrop-blur p-12 flex flex-col items-center gap-3 text-center">
                                    <CheckCircle2 className="h-10 w-10 text-green-500 opacity-60" />
                                    <p className="text-slate-300 font-medium">All bills are paid!</p>
                                    <p className="text-sm text-slate-500">You have no outstanding bills at the moment.</p>
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    {unpaidBills.map(bill => (
                                        <BillCard
                                            key={bill.id}
                                            bill={bill}
                                            walletBalance={summaryStats.walletBalance}
                                            onPayClick={handlePayClick}
                                        />
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Payment History (collapsible) */}
                        <section>
                            <button
                                onClick={() => setHistoryOpen(prev => !prev)}
                                className={cn(
                                    "w-full flex items-center justify-between px-5 py-4 rounded-2xl border transition-all",
                                    "bg-white/5 dark:bg-slate-900/80 backdrop-blur border-slate-800/60",
                                    "hover:border-slate-700/60 text-left"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                        <Receipt className="h-4 w-4 text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-200">Payment History</p>
                                        <p className="text-xs text-slate-500">{transactions.length} transactions</p>
                                    </div>
                                </div>
                                {historyOpen
                                    ? <ChevronUp className="h-4 w-4 text-slate-400" />
                                    : <ChevronDown className="h-4 w-4 text-slate-400" />
                                }
                            </button>

                            {historyOpen && (
                                <div className="mt-2 rounded-2xl border border-slate-800/60 bg-white/5 dark:bg-slate-900/80 backdrop-blur overflow-hidden">
                                    {transactions.length === 0 ? (
                                        <div className="py-10 flex flex-col items-center gap-2 text-slate-500">
                                            <Receipt className="h-8 w-8 opacity-30" />
                                            <p className="text-sm">No payment history yet.</p>
                                        </div>
                                    ) : (
                                        transactions.map(tx => (
                                            <HistoryRow key={tx.id} tx={tx} onDownload={handleDownloadReceipt} />
                                        ))
                                    )}
                                </div>
                            )}
                        </section>
                    </>
                )}
            </div>

            {/* Payment Modal */}
            <PaymentModal
                open={isPaymentModalOpen}
                onOpenChange={setIsPaymentModalOpen}
                bill={selectedBill}
                walletBalance={summaryStats.walletBalance}
                onProcessPayment={processPayment}
            />
        </div>
    )
}
