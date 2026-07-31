"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency } from "@/lib/utils"
import { Loader2, TrendingUp, TrendingDown, DollarSign, Building2 } from "lucide-react"

export default function AdminFinancePage() {
    const [loading, setLoading] = useState(true)
    const [journalEntries, setJournalEntries] = useState<any[]>([])
    const [metrics, setMetrics] = useState({
        totalRevenue: 0,
        bankBalance: 0,
        pendingPayouts: 0,
        operatingExpenses: 0
    })

    useEffect(() => {
        fetchMetrics()
    }, [])

    const fetchMetrics = async () => {
        setLoading(true)
        try {
            // Fetch Account Balances from 'accounts' table
            // In a real app, strict codes would be used.
            const { data: accounts } = await supabase.from('accounts').select('code, balance, type')

            if (accounts) {
                // Map based on Codes defined in migration
                // 1001: Platform Bank
                // 4001: Commission Revenue
                // 2002: Landlord Wallet Liability
                // 4001 + 4002 + 4003: Total Revenue approx

                const bank = accounts.find(a => a.code === '1001')?.balance || 0
                const liability = accounts.find(a => a.code === '2002')?.balance || 0
                const revenue = accounts
                    .filter(a => a.type === 'income')
                    .reduce((sum, a) => sum + (a.balance || 0), 0) // Income is Credit (negative normally? No, migrating schema uses positive for reporting usually, check RPC logic)
                const expenses = accounts
                    .filter(a => a.type === 'expense')
                    .reduce((sum, a) => sum + (a.balance || 0), 0)
                // RPC Logic: Balance = Balance + Debit - Credit.
                // For Income: Credit increases balance? 
                // Wait, standard accounting: Assets (Dr), Liabilities (Cr), Equity (Cr), Income (Cr), Expenses (Dr).
                // If RPC does Balance = Balance + Debit - Credit:
                // Asset: +Dr -Cr (Correct: Debit increases asset)
                // Liability: +Dr -Cr (Incorrect: Credit increases liability. Balance would be negative for liability)
                // Income: +Dr -Cr (Incorrect: Credit increases income. Balance would be negative for income)

                // Let's Re-evaluate the RPC logic in the migration I wrote.
                // "UPDATE public.accounts SET balance = balance + DEBIT - CREDIT"
                // So: 
                // Asset (Debit 100): Balance + 100. Correct.
                // Income (Credit 100): Balance - 100.
                // So Income/Liability balances will be NEGATIVE in the database if using this simple formula.
                // Front-end needs to display ABS() for specific types or handle sign.

                setMetrics({
                    bankBalance: bank, // Asset (Positive)
                    pendingPayouts: Math.abs(liability), // Liability (Negative)
                    totalRevenue: Math.abs(revenue), // Income (Negative)
                    operatingExpenses: Math.abs(expenses)
                })
            }

            const { data: entries, error: entriesError } = await supabase
                .from('journal_entries')
                .select('id, date, description, reference_type, created_at')
                .order('created_at', { ascending: false })
                .limit(8)

            if (!entriesError) {
                setJournalEntries(entries || [])
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>
    }

    return (
        <div className="flex-1 space-y-4 p-2 sm:p-4 md:p-8 pt-4 md:pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Financial Overview</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</div>
                        <p className="text-xs text-muted-foreground">Income ledger balance</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Bank Balance</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(metrics.bankBalance)}</div>
                        <p className="text-xs text-muted-foreground">Available funds</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
                        <TrendingDown className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(metrics.pendingPayouts)}</div>
                        <p className="text-xs text-muted-foreground">Payable to Landlords</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Operating Expenses</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(metrics.operatingExpenses)}</div>
                        <p className="text-xs text-muted-foreground">Processing fees & ops</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="income_statement">Income Statement</TabsTrigger>
                    <TabsTrigger value="balance_sheet">Balance Sheet</TabsTrigger>
                    <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Revenue Analytics</CardTitle>
                            <CardDescription>Monthly revenue performance.</CardDescription>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <FinanceMetric label="Revenue" value={formatCurrency(metrics.totalRevenue)} />
                                <FinanceMetric label="Bank balance" value={formatCurrency(metrics.bankBalance)} />
                                <FinanceMetric label="Pending payouts" value={formatCurrency(metrics.pendingPayouts)} />
                                <FinanceMetric label="Operating expenses" value={formatCurrency(metrics.operatingExpenses)} />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="income_statement">
                    <Card>
                        <CardHeader>
                            <CardTitle>Income Statement</CardTitle>
                            <CardDescription>Profit and Loss Report.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <FinanceRow label="Income" value={formatCurrency(metrics.totalRevenue)} />
                            <FinanceRow label="Expenses" value={formatCurrency(metrics.operatingExpenses)} />
                            <FinanceRow label="Net operating position" value={formatCurrency(metrics.totalRevenue - metrics.operatingExpenses)} />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="balance_sheet">
                    <Card>
                        <CardHeader>
                            <CardTitle>Balance Sheet</CardTitle>
                            <CardDescription>Assets vs Liabilities.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <FinanceRow label="Platform bank balance" value={formatCurrency(metrics.bankBalance)} />
                            <FinanceRow label="Landlord wallet liability" value={formatCurrency(metrics.pendingPayouts)} />
                            <FinanceRow label="Net platform position" value={formatCurrency(metrics.bankBalance - metrics.pendingPayouts)} />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="transactions">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Transactions</CardTitle>
                            <CardDescription>Latest entries recorded in the accounting ledger.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {journalEntries.length === 0 ? (
                                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                                    No ledger entries have been recorded yet.
                                </div>
                            ) : (
                                journalEntries.map((entry) => (
                                    <div key={entry.id} className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
                                        <div>
                                            <p className="text-sm font-medium">{entry.description || "Ledger entry"}</p>
                                            <p className="text-xs text-muted-foreground">{entry.reference_type || "accounting"} · {new Date(entry.date || entry.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

function FinanceMetric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-lg font-semibold">{value}</p>
        </div>
    )
}

function FinanceRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="text-sm font-semibold">{value}</span>
        </div>
    )
}
