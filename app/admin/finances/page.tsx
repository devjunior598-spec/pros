"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Wallet,
    ArrowUpRight,
    ArrowDownLeft,
    Search,
    Filter,
    Loader2,
    CheckCircle,
    XCircle,
    Download,
    Eye,
    Landmark,
    Banknote,
    RefreshCw
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function AdminFinancesPage() {
    const { toast } = useToast()
    const [transactions, setTransactions] = useState<any[]>([])
    const [withdrawals, setWithdrawals] = useState<any[]>([])
    const [stats, setStats] = useState({ pendingWithdrawalsSum: 0, totalInflow: 0, totalTransactionsCount: 0 })
    const [loading, setLoading] = useState(true)
    const [processingId, setProcessingId] = useState<string | null>(null)

    const fetchFinances = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/admin/finances")
            const data = await res.json()
            if (data.transactions) setTransactions(data.transactions)
            if (data.withdrawals) setWithdrawals(data.withdrawals)
            if (data.stats) setStats(data.stats)
        } catch (error) {
            console.error("Error fetching finances:", error)
            toast({ title: "Error", description: "Failed to load financial records", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }, [toast])

    useEffect(() => {
        fetchFinances()
    }, [fetchFinances])

    const handleWithdrawalReview = async (withdrawal: any, status: 'success' | 'failed') => {
        setProcessingId(withdrawal.id)
        try {
            const { error } = await supabase
                .from('withdrawals')
                .update({ status })
                .eq('id', withdrawal.id)

            if (error) throw error

            toast({ title: "Status Updated", description: `Withdrawal payout marked as ${status}` })
            fetchFinances()
        } catch (error: any) {
            toast({ title: "Update Failed", description: error.message || "Failed to update withdrawal", variant: "destructive" })
        } finally {
            setProcessingId(null)
        }
    }

    const exportCSV = () => {
        if (transactions.length === 0) return
        const headers = ["ID", "Date", "User", "Role", "Type", "Amount", "Reference", "Status"]
        const rows = transactions.map(t => [
            t.id,
            new Date(t.created_at).toISOString(),
            t.user?.name || t.user?.full_name || "System User",
            t.userRole || "N/A",
            t.type || "N/A",
            t.amount || 0,
            t.reference || "N/A",
            t.status || "success"
        ])

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n")
        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", `transactions_report_${new Date().toISOString().split('T')[0]}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Financial Operations Center</h1>
                    <p className="text-muted-foreground">Monitor platform cash flows, commission collections, and payout approvals.</p>
                </div>
                <Button variant="outline" size="icon" onClick={fetchFinances} className="rounded-xl self-start">
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
            </div>

            <Tabs defaultValue="transactions" className="w-full">
                <TabsList className="bg-white dark:bg-gray-950 p-1 border shadow-sm rounded-xl mb-6">
                    <TabsTrigger value="transactions" className="rounded-lg gap-2">
                        <Banknote className="h-4 w-4" /> All Transactions
                    </TabsTrigger>
                    <TabsTrigger value="withdrawals" className="rounded-lg gap-2">
                        <Landmark className="h-4 w-4" /> Withdrawals
                        {withdrawals.filter(w => w.status === 'pending').length > 0 && (
                            <Badge variant="destructive" className="h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                                {withdrawals.filter(w => w.status === 'pending').length}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="transactions">
                    <Card className="border-none shadow-sm bg-white dark:bg-gray-950">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Transaction Logs</CardTitle>
                                <CardDescription>Comprehensive history of all incoming and outgoing payments.</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2 rounded-xl">
                                <Download className="h-4 w-4" /> Export CSV
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="relative overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-400 uppercase text-[10px]">
                                        <tr>
                                            <th className="px-6 py-4">Status / Date</th>
                                            <th className="px-6 py-4">User</th>
                                            <th className="px-6 py-4">Flow Type</th>
                                            <th className="px-6 py-4">Amount</th>
                                            <th className="px-6 py-4">Reference</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y dark:divide-gray-800">
                                        {loading ? (
                                            <tr><td colSpan={5} className="py-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" /></td></tr>
                                        ) : transactions.length === 0 ? (
                                            <tr><td colSpan={5} className="py-12 text-center text-muted-foreground italic">No transactions recorded yet.</td></tr>
                                        ) : (
                                            transactions.map((tx) => (
                                                <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            {tx.status === 'success' || !tx.status ? (
                                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                                            ) : (
                                                                <XCircle className="h-4 w-4 text-red-500" />
                                                            )}
                                                            <span className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold">{tx.user?.name || tx.user?.full_name || "System User"}</span>
                                                            <span className="text-[10px] text-muted-foreground capitalize">{tx.userRole}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Badge variant="outline" className={tx.type === 'credit' ? "text-green-600 bg-green-50 border-green-100" : "text-red-600 bg-red-50 border-red-100"}>
                                                            {tx.type === 'credit' ? "Inflow" : "Outflow"}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4 font-bold">
                                                        <span className={tx.type === 'credit' ? "text-green-600" : "text-red-600"}>
                                                            {tx.type === 'credit' ? "+" : "-"} ${Number(tx.amount || 0).toLocaleString()}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs text-muted-foreground font-mono">
                                                        {tx.reference || "N/A"}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="withdrawals">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <Card className="border-none shadow-sm bg-blue-600 text-white">
                            <CardContent className="p-6">
                                <ArrowUpRight className="h-6 w-6 mb-2 opacity-80" />
                                <div className="text-2xl font-bold">${stats.pendingWithdrawalsSum.toLocaleString()}</div>
                                <div className="text-xs opacity-80">Pending Landlord Payouts</div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border-none shadow-sm bg-white dark:bg-gray-950">
                        <CardHeader>
                            <CardTitle>Withdrawal Payout Approvals</CardTitle>
                            <CardDescription>Review and process manual or automated payout requests.</CardDescription>
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
                                            <tr><td colSpan={5} className="py-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" /></td></tr>
                                        ) : withdrawals.length === 0 ? (
                                            <tr><td colSpan={5} className="py-12 text-center text-muted-foreground italic">No payout requests found.</td></tr>
                                        ) : (
                                            withdrawals.map((w) => (
                                                <tr key={w.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold">{w.landlord?.name || w.landlord?.full_name || "Landlord Account"}</div>
                                                        <div className="text-[10px] text-muted-foreground">{new Date(w.created_at).toLocaleDateString()}</div>
                                                    </td>
                                                    <td className="px-6 py-4 font-bold text-base">${Number(w.amount || 0).toLocaleString()}</td>
                                                    <td className="px-6 py-4 text-xs">
                                                        {w.bank_details ? (
                                                            <div className="flex flex-col">
                                                                <span className="font-medium">{w.bank_details.bank_name}</span>
                                                                <span className="text-muted-foreground font-mono">{w.bank_details.account_number}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground italic">No details provided</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Badge variant={w.status === 'success' ? 'default' : w.status === 'failed' ? 'destructive' : 'outline'}>
                                                            {w.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {w.status === 'pending' && (
                                                            <div className="flex justify-end gap-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-red-600 h-8 px-2"
                                                                    onClick={() => handleWithdrawalReview(w, 'failed')}
                                                                    disabled={processingId === w.id}
                                                                >
                                                                    <XCircle className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-green-600 h-8 px-2 border border-green-100"
                                                                    onClick={() => handleWithdrawalReview(w, 'success')}
                                                                    disabled={processingId === w.id}
                                                                >
                                                                    <CheckCircle className="h-4 w-4 mr-1" /> Pay
                                                                </Button>
                                                            </div>
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
                </TabsContent>
            </Tabs>
        </div>
    )
}
