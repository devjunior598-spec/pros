"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Clock,
    CheckCircle,
    XCircle,
    ArrowUpRight,
    Landmark,
    Loader2,
    Calendar,
    User,
    Search,
    AlertCircle
} from "lucide-react"
import { Input } from "@/components/ui/input"

export default function AdminWithdrawalsPage() {
    const [withdrawals, setWithdrawals] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")

    const fetchWithdrawals = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/withdrawals')
            if (!res.ok) throw new Error("Failed to fetch withdrawals")

            const data = await res.json()
            setWithdrawals(data.withdrawals || [])
        } catch (error: any) {
            console.error("Error fetching withdrawals:", error.message)
            alert("Failed to load withdrawals.")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchWithdrawals()
    }, [])

    const handleReview = async (withdrawal: any, status: 'approved' | 'rejected') => {
        if (!confirm(`Are you sure you want to mark this withdrawal as ${status.toUpperCase()}?`)) return
        setProcessingId(withdrawal.id)
        try {
            const res = await fetch('/api/admin/withdrawals/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    withdrawalId: withdrawal.id,
                    status,
                    landlordId: withdrawal.landlord_id,
                    amount: withdrawal.amount
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed to process.")

            alert(data.message)
            fetchWithdrawals()
        } catch (error: any) {
            alert(error.message || "Failed to update withdrawal")
        } finally {
            setProcessingId(null)
        }
    }

    const filtered = withdrawals.filter(w =>
        w.landlord?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.reference?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const pendingCount = withdrawals.filter(w => w.status === 'pending').length
    const pendingTotal = withdrawals.filter(w => w.status === 'pending').reduce((acc, w) => acc + w.amount, 0)

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Withdrawal Queue</h1>
                    <p className="text-muted-foreground">Manage and process payout requests from landlords.</p>
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search by name or reference..."
                        className="pl-10 rounded-xl bg-white dark:bg-gray-950 border-none shadow-sm focus:ring-2 ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm bg-blue-600 text-white">
                    <CardContent className="p-6">
                        <Clock className="h-6 w-6 mb-2 opacity-80" />
                        <div className="text-2xl font-bold">₦{pendingTotal.toLocaleString()}</div>
                        <div className="text-xs opacity-80">{pendingCount} Pending Requests</div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white dark:bg-gray-950">
                    <CardContent className="p-6">
                        <CheckCircle className="h-6 w-6 mb-2 text-green-500" />
                        <div className="text-2xl font-bold">₦{withdrawals.filter(w => w.status === 'approved').reduce((acc, w) => acc + w.amount, 0).toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Total Paid Out</div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white dark:bg-gray-950">
                    <CardContent className="p-6">
                        <AlertCircle className="h-6 w-6 mb-2 text-red-500" />
                        <div className="text-2xl font-bold">₦{withdrawals.filter(w => w.status === 'rejected').reduce((acc, w) => acc + w.amount, 0).toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Rejected/Failed</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-sm bg-white dark:bg-gray-950">
                <CardHeader>
                    <CardTitle>Payout Queue</CardTitle>
                    <CardDescription>Review and approve payout requests.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-400 uppercase text-[10px]">
                                <tr>
                                    <th className="px-6 py-4">Requestor</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4">Bank Details</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-800">
                                {loading ? (
                                    <tr><td colSpan={5} className="py-10 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" /></td></tr>
                                ) : filtered.length === 0 ? (
                                    <tr><td colSpan={5} className="py-10 text-center text-muted-foreground italic">No payout requests matching your search.</td></tr>
                                ) : (
                                    filtered.map((w) => (
                                        <tr key={w.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900 dark:text-gray-100">{w.landlord?.name}</div>
                                                <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" /> {new Date(w.created_at).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-lg">₦{w.amount.toLocaleString()}</td>
                                            <td className="px-6 py-4">
                                                {w.bank_details ? (
                                                    <div className="flex flex-col text-xs">
                                                        <span className="font-medium underline decoration-blue-500/30">{w.bank_details.bank_name}</span>
                                                        <span className="text-muted-foreground font-mono">{w.bank_details.account_number}</span>
                                                        <span className="text-[10px] opacity-70 italic">{w.bank_details.account_name}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground italic">Manual Request</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant={w.status === 'approved' ? 'default' : w.status === 'rejected' ? 'destructive' : 'outline'}>
                                                    {w.status}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {w.status === 'pending' && (
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-600 hover:bg-red-50 h-8 px-2"
                                                            onClick={() => handleReview(w, 'rejected')}
                                                            disabled={processingId === w.id}
                                                        >
                                                            <XCircle className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-white bg-green-600 hover:bg-green-700 h-8 px-3 gap-1 border-none"
                                                            onClick={() => handleReview(w, 'approved')}
                                                            disabled={processingId === w.id}
                                                        >
                                                            {processingId === w.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                                                            Approve Payment
                                                        </Button>
                                                    </div>
                                                )}
                                                {w.status !== 'pending' && (
                                                    <Button variant="ghost" size="sm" className="text-blue-600 h-8">View Receipt</Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
