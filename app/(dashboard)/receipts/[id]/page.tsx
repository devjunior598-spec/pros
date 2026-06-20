"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import {
    ArrowLeft, CheckCircle2, Download, Loader2, AlertCircle,
    Building, User, CreditCard, CalendarDays, Hash, Banknote
} from "lucide-react"
import { cn } from "@/lib/utils"
import jsPDF from "jspdf"

// ─── Types ─────────────────────────────────────────────────────────────────────
interface ReceiptData {
    id: string
    reference: string
    amount: number
    status: string
    payment_method: string
    created_at: string
    // Joined
    propertyTitle: string
    propertyAddress: string
    tenantName: string
    tenantEmail: string
    landlordName: string
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    })
}

function formatAmount(n: number) {
    return `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function getReceiptNumber(id: string, createdAt: string) {
    const dateStr = createdAt.substring(0, 10).replace(/-/g, '')
    const shortId = id.replace(/-/g, '').substring(0, 6).toUpperCase()
    return `PRMS-${dateStr}-${shortId}`
}

// ─── Download PDF ──────────────────────────────────────────────────────────────
function downloadPDF(receipt: ReceiptData, receiptNumber: string) {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })

    // Background
    doc.setFillColor(15, 23, 42) // slate-900
    doc.rect(0, 0, 210, 297, 'F')

    // Header strip
    doc.setFillColor(37, 99, 235) // blue-600
    doc.rect(0, 0, 210, 40, 'F')

    // Logo / Title
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.text('PRMS', 20, 18)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Property Rental Management System', 20, 26)

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('PAYMENT RECEIPT', 20, 36)

    // Receipt number
    doc.setFillColor(30, 41, 59) // slate-800
    doc.roundedRect(15, 48, 180, 18, 3, 3, 'F')
    doc.setTextColor(148, 163, 184) // slate-400
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('Receipt Number', 22, 55)
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(12)
    doc.setFont('courier', 'bold')
    doc.text(receiptNumber, 22, 62)

    // Status badge area
    doc.setFillColor(34, 197, 94, 20) // green subtle
    doc.roundedRect(150, 50, 40, 14, 3, 3, 'F')
    doc.setTextColor(34, 197, 94)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('✓  PAID', 158, 59)

    // Details table
    const tableY = 80
    const rows = [
        ['Property', receipt.propertyTitle],
        ['Address', receipt.propertyAddress],
        ['Tenant', receipt.tenantName],
        ['Landlord', receipt.landlordName],
        ['Payment Method', receipt.payment_method.toUpperCase()],
        ['Date & Time', formatDate(receipt.created_at)],
        ['Reference', receipt.reference],
    ]

    rows.forEach(([label, value], i) => {
        const y = tableY + i * 16
        const isEven = i % 2 === 0
        if (isEven) {
            doc.setFillColor(30, 41, 59)
            doc.rect(15, y - 6, 180, 16, 'F')
        }
        doc.setTextColor(100, 116, 139) // slate-500
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.text(label, 22, y + 2)
        doc.setTextColor(226, 232, 240) // slate-200
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text(String(value), 80, y + 2)
    })

    // Total Amount
    const totalY = tableY + rows.length * 16 + 8
    doc.setFillColor(37, 99, 235) // blue-600
    doc.roundedRect(15, totalY, 180, 22, 3, 3, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text('Total Amount Paid', 22, totalY + 9)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(formatAmount(receipt.amount), 22, totalY + 19)

    // Footer
    doc.setTextColor(71, 85, 105) // slate-600
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text('This is an official receipt from PRMS. Thank you for your payment.', 105, 280, { align: 'center' })
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 286, { align: 'center' })

    doc.save(`Receipt-${receiptNumber}.pdf`)
}

// ─── Table Row ─────────────────────────────────────────────────────────────────
function ReceiptRow({ label, value, icon, mono }: {
    label: string
    value: string
    icon?: React.ReactNode
    mono?: boolean
}) {
    return (
        <div className="flex items-start justify-between py-3.5 border-b border-slate-100 last:border-0">
            <div className="flex items-center gap-2 text-sm text-slate-500">
                {icon && <span className="text-slate-400">{icon}</span>}
                {label}
            </div>
            <div className={cn(
                "text-sm font-semibold text-slate-800 text-right max-w-[55%]",
                mono && "font-mono"
            )}>
                {value}
            </div>
        </div>
    )
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function ReceiptPage() {
    const params = useParams()
    const router = useRouter()
    const id = params?.id as string

    const [receipt, setReceipt] = useState<ReceiptData | null>(null)
    const [loading, setLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)

    useEffect(() => {
        if (!id) return
        const fetchReceipt = async () => {
            setLoading(true)
            try {
                // Fetch payment
                const { data: payment, error } = await supabase
                    .from('payments')
                    .select('*')
                    .eq('id', id)
                    .single()

                if (error || !payment) {
                    setNotFound(true)
                    return
                }

                // Fetch bill → rental → property, and landlord profile
                let propertyTitle = 'N/A'
                let propertyAddress = 'N/A'
                let landlordName = 'N/A'

                if (payment.bill_id) {
                    const { data: bill } = await supabase
                        .from('bills')
                        .select('id, rental:rentals(landlord_id, property:properties(title, address))')
                        .eq('id', payment.bill_id)
                        .single()

                    const rentalData = (bill as any)?.rental
                    const property = Array.isArray(rentalData?.property) ? rentalData.property[0] : rentalData?.property
                    propertyTitle = property?.title || 'N/A'
                    propertyAddress = property?.address || 'N/A'

                    if (rentalData?.landlord_id) {
                        const { data: ll } = await supabase
                            .from('profiles')
                            .select('name, email')
                            .eq('id', rentalData.landlord_id)
                            .single()
                        landlordName = ll?.name || ll?.email || 'N/A'
                    }
                }

                // Current user profile (tenant)
                const { data: { user } } = await supabase.auth.getUser()
                let tenantName = 'N/A'
                let tenantEmail = ''
                if (user) {
                    const { data: profile } = await supabase.from('profiles').select('name, email').eq('id', user.id).single()
                    tenantName = profile?.name || user.email || 'N/A'
                    tenantEmail = user.email || ''
                }

                setReceipt({
                    id: payment.id,
                    reference: payment.reference,
                    amount: payment.amount,
                    status: payment.status,
                    payment_method: payment.payment_method,
                    created_at: payment.created_at,
                    propertyTitle,
                    propertyAddress,
                    tenantName,
                    tenantEmail,
                    landlordName,
                })
            } finally {
                setLoading(false)
            }
        }

        fetchReceipt()
    }, [id])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        )
    }

    if (notFound || !receipt) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 backdrop-blur p-8 max-w-sm w-full text-center">
                    <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
                    <h2 className="text-lg font-bold text-slate-100">Receipt Not Found</h2>
                    <p className="text-sm text-slate-400 mt-2">
                        We couldn't find a payment with this ID. It may have been deleted or the link is invalid.
                    </p>
                    <Link
                        href="/pay-bills"
                        className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-sm hover:bg-slate-700 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Bills
                    </Link>
                </div>
            </div>
        )
    }

    const receiptNumber = getReceiptNumber(receipt.id, receipt.created_at)
    const isPaid = receipt.status === 'success' || receipt.status === 'paid'

    return (
        <div className="min-h-screen py-10 px-4">
            <div className="max-w-2xl mx-auto space-y-6">

                {/* Nav */}
                <div className="flex items-center justify-between">
                    <Link
                        href="/pay-bills"
                        className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-100 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Bills
                    </Link>
                    <button
                        onClick={() => downloadPDF(receipt, receiptNumber)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all shadow-lg shadow-blue-600/20"
                    >
                        <Download className="h-4 w-4" />
                        Download PDF
                    </button>
                </div>

                {/* Receipt Card */}
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                    {/* Blue header strip */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-7">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-black text-white tracking-tight">PRMS</h1>
                                <p className="text-blue-200 text-xs mt-0.5">Property Rental Management System</p>
                            </div>
                            <div className="text-right">
                                <p className="text-blue-200 text-xs uppercase tracking-widest font-semibold">Payment Receipt</p>
                                <p className="text-white font-bold text-sm mt-1">{formatDate(receipt.created_at)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Reference + Status */}
                    <div className="px-8 py-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
                        <div>
                            <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-1">Reference Number</p>
                            <p className="font-mono text-xl font-black text-slate-800 tracking-wider">{receiptNumber}</p>
                        </div>
                        <div className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border-2",
                            isPaid
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-red-50 text-red-700 border-red-200"
                        )}>
                            {isPaid
                                ? <><CheckCircle2 className="h-4 w-4" /> Paid</>
                                : <><AlertCircle className="h-4 w-4" /> {receipt.status}</>
                            }
                        </div>
                    </div>

                    {/* Amount highlight */}
                    <div className="px-8 py-6 border-b border-slate-100">
                        <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-1">Amount Paid</p>
                        <p className="text-4xl font-black text-slate-900">{formatAmount(receipt.amount)}</p>
                    </div>

                    {/* Details table */}
                    <div className="px-8 py-2">
                        <ReceiptRow
                            label="Property"
                            value={receipt.propertyTitle}
                            icon={<Building className="h-4 w-4" />}
                        />
                        <ReceiptRow
                            label="Address"
                            value={receipt.propertyAddress}
                            icon={<Building className="h-4 w-4" />}
                        />
                        <ReceiptRow
                            label="Tenant"
                            value={receipt.tenantName}
                            icon={<User className="h-4 w-4" />}
                        />
                        <ReceiptRow
                            label="Landlord"
                            value={receipt.landlordName}
                            icon={<User className="h-4 w-4" />}
                        />
                        <ReceiptRow
                            label="Payment Method"
                            value={receipt.payment_method.toUpperCase()}
                            icon={<CreditCard className="h-4 w-4" />}
                        />
                        <ReceiptRow
                            label="Date"
                            value={formatDate(receipt.created_at)}
                            icon={<CalendarDays className="h-4 w-4" />}
                        />
                        <ReceiptRow
                            label="Transaction Ref"
                            value={receipt.reference}
                            icon={<Hash className="h-4 w-4" />}
                            mono
                        />
                    </div>

                    {/* Footer */}
                    <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 text-center">
                        <p className="text-xs text-slate-400">
                            This is an official receipt from PRMS. Thank you for your payment.
                        </p>
                        <p className="text-xs text-slate-300 mt-1">
                            Generated on {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                </div>

                {/* Download CTA again */}
                <div className="flex justify-center">
                    <button
                        onClick={() => downloadPDF(receipt, receiptNumber)}
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-xl shadow-blue-600/20 hover:shadow-blue-500/30"
                    >
                        <Download className="h-5 w-5" />
                        Download PDF Receipt
                    </button>
                </div>
            </div>
        </div>
    )
}
