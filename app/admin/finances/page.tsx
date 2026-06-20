"use client"

import { useState, useEffect } from "react"
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
    Banknote
} from "lucide-react"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"

export default function AdminFinancesPage() {
    const [transactions, setTransactions] = useState<any[]>([])
    const [withdrawals, setWithdrawals] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("transactions")
    const [processingId, setProcessingId] = useState<string | null>(null)

    const fetchFinances = async () => {
        setLoading(true)
        try {
            // 1. Fetch Tenant Transactions
            const { data: tenantTx } = await supabase
                .from('transactions')
                .select(`*, tenant:profiles (name, email)`)

            // 2. Fetch Landlord Transactions
            const { data: landlordTx } = await supabase
                .from('landlord_transactions')
                .select(`*, landlord:profiles (name, email)`)

            // Combine and format
            const combined = [
                ...(tenantTx || []).map(t => ({ ...t, user: t.tenant, userRole: 'tenant' })),
                ...(landlordTx || []).map(t => ({ ...t, user: t.landlord, userRole: 'landlord' }))
            ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

            setTransactions(combined)

            // 3. Fetch Withdrawals
            const { data: withdrawalData } = await supabase
                .from('withdrawals')
                .select(`*, landlord:profiles (name, email)`)
                .order('created_at', { ascending: false })

            setWithdrawals(withdrawalData || [])

        } catch (error) {
            console.error("Error fetching finances:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchFinances()
    }, [])

    const handleWithdrawalReview = async (withdrawal: any, status: 'success' | 'failed') => {
        setProcessingId(withdrawal.id)
        try {
            const { error } = await supabase
                .from('withdrawals')
                .update({ status })
                .eq('id', withdrawal.id)

            if (error) throw error

            alert(`Withdrawal marked as ${status}`)
            fetchFinances()
        } catch (error: any) {
            alert(error.message || "Failed to update withdrawal")
        } finally {
            setProcessingId(null)
        }
    }

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Financial Center</h1>
                    <p className="text-muted-foreground">Monitor transactions and manage platform withdrawals.</p>
                </div>
            </div>

            <Tabs defaultValue="transactions" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="bg-white dark:bg-gray-950 p-1 border shadow-sm rounded-xl mb-6">
                    <TabsTrigger value="transactions" className="rounded-lg gap-2">
                        <Banknote className="h-4 w-4" /> All Transactions
                    </TabsTrigger>
                    <TabsTrigger value="withdrawals" className="rounded-lg gap-2">
                        <Landmark className="h-4 w-4" /> Withdrawals
                        {withdrawals.filter(w => w.status === 'pending').length > 0 &&
                            <Badge variant="destructive" className="h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                                {withdrawals.filter(w => w.status === 'pending').length}
                            </Badge>
                        }
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="transactions">
                    <Card className="border-none shadow-sm bg-white dark:bg-gray-950">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Transaction Logs</CardTitle>
                                <CardDescription>Comprehensive history of all platform payments.</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" className="gap-2">
                                <Download className="h-4 w-4" /> Export CSV
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="relative overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-400 uppercase text-[10px]">
                                        <tr>
                                            <th className="px-6 py-4">Status/Date</th>
                                            <th className="px-6 py-4">User</th>
                                            <th className="px-6 py-4">Type</th>
                                            <th className="px-6 py-4">Amount</th>
                                            <th className="px-6 py-4">Reference</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y dark:divide-gray-800">
                                        {loading ? (
                                            <tr><td colSpan={5} className="py-10 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" /></td></tr>
                                        ) : transactions.length === 0 ? (
                                            <tr><td colSpan={5} className="py-10 text-center text-muted-foreground italic">No transactions recorded yet.</td></tr>
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
                                                            <span className="text-xs">{new Date(tx.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold">{tx.user?.name || "System User"}</span>
                                                            <span className="text-[10px] text-muted-foreground capitalize">{tx.userRole}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-1">
                                                            {tx.type === 'credit' ? (
                                                                <Badge variant="outline" className="text-green-600 bg-green-50 border-green-100 dark:bg-green-900/10">Inflow</Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="text-red-600 bg-red-50 border-red-100 dark:bg-red-900/10">Outflow</Badge>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 font-bold">
                                                        <span className={tx.type === 'credit' ? "text-green-600" : "text-red-600"}>
                                                            {tx.type === 'credit' ? "+" : "-"} ₦{tx.amount.toLocaleString()}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs text-muted-foreground font-mono">
                                                        {tx.reference}
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
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                        <Card className="border-none shadow-sm bg-blue-600 text-white">
                            <CardContent className="p-6">
                                <ArrowUpRight className="h-6 w-6 mb-2 opacity-80" />
                                <div className="text-2xl font-bold">₦{withdrawals.filter(w => w.status === 'pending').reduce((acc, w) => acc + w.amount, 0).toLocaleString()}</div>
                                <div className="text-xs opacity-80">Pending Payouts</div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border-none shadow-sm bg-white dark:bg-gray-950">
                        <CardHeader>
                            <CardTitle>Withdrawal Management</CardTitle>
                            <CardDescription>Process manual and automated payout requests.</CardDescription>
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
                                        ) : withdrawals.length === 0 ? (
                                            <tr><td colSpan={5} className="py-10 text-center text-muted-foreground italic">No payout requests found.</td></tr>
                                        ) : (
                                            withdrawals.map((w) => (
                                                <tr key={w.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold">{w.landlord?.name}</div>
                                                        <div className="text-[10px] text-muted-foreground">{new Date(w.created_at).toLocaleDateString()}</div>
                                                    </td>
                                                    <td className="px-6 py-4 font-bold text-lg">₦{w.amount.toLocaleString()}</td>
                                                    <td className="px-6 py-4 text-xs">
                                                        {w.bank_details ? (
                                                            <div className="flex flex-col">
                                                                <span className="font-medium">{w.bank_details.bank_name}</span>
                                                                <span className="text-muted-foreground">{w.bank_details.account_number}</span>
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
                                                    <td className="px-6 py-4 text-right space-x-2">
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
                                                        <Button variant="outline" size="sm" className="h-8">Details</Button>
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
