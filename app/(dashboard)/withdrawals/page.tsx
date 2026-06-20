"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Wallet, ArrowUpRight, Landmark, Clock, Plus, Info, Trash2 } from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AddBankAccountModal } from "@/components/withdrawals/add-bank-account-modal"
import { getBankAccounts, deleteBankAccount, getProfile, requestWithdrawal, getBalance, getWithdrawals } from "@/app/actions/withdrawals"
import { useToast } from "@/hooks/use-toast"

export default function WithdrawalsPage() {
    const [withdrawals, setWithdrawals] = useState<any[]>([])
    const [bankAccounts, setBankAccounts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [balance, setBalance] = useState(0)
    const [landlordName, setLandlordName] = useState<string>("")
    const [amount, setAmount] = useState<string>("")
    const [selectedAccount, setSelectedAccount] = useState<string>("")
    const [withdrawing, setWithdrawing] = useState(false)
    const { toast } = useToast()

    const fetchData = async () => {
        setLoading(true)
        try {
            const { data: accounts } = await getBankAccounts()
            if (accounts) {
                setBankAccounts(accounts)
                if (accounts.length > 0) {
                    setSelectedAccount(accounts[0].id)
                }
            }

            const profile = await getProfile()
            if (profile) {
                setLandlordName(profile.fullname)
            }

            const { balance } = await getBalance()
            setBalance(balance || 0)

            const { data: withdrawalsData } = await getWithdrawals()
            if (withdrawalsData) {
                setWithdrawals(withdrawalsData)
            }
        } catch (error) {
            console.error("Error fetching data:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleWithdrawal = async () => {
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            toast({
                variant: "destructive",
                title: "Invalid Amount",
                description: "Please enter a valid withdrawal amount."
            })
            return
        }

        if (Number(amount) > balance) {
            toast({
                variant: "destructive",
                title: "Insufficient Balance",
                description: "You do not have enough funds for this withdrawal."
            })
            return
        }

        if (!selectedAccount) {
            toast({
                variant: "destructive",
                title: "No Bank Account",
                description: "Please select a bank account."
            })
            return
        }

        setWithdrawing(true)
        try {
            const result = await requestWithdrawal(Number(amount), selectedAccount)

            if (result.error) {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: result.error
                })
            } else {
                toast({
                    title: "Success",
                    description: "Withdrawal request submitted successfully."
                })
                setAmount("")
                fetchData() // Refresh withdrawal list and balance
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to process withdrawal."
            })
        } finally {
            setWithdrawing(false)
        }
    }

    const handleDeleteAccount = async (id: string) => {
        if (!confirm("Are you sure you want to delete this bank account?")) return

        const result = await deleteBankAccount(id)
        if (result.success) {
            toast({
                title: "Account deleted",
                description: "Bank account has been removed successfully.",
            })
            fetchData()
        } else {
            toast({
                title: "Error",
                description: "Failed to delete bank account.",
                variant: "destructive",
            })
        }
    }

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Withdraw Funds</h1>
                <p className="text-muted-foreground">Transfer your earnings to your registered bank account.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-2 bg-white dark:bg-gray-950 border-none shadow-sm">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Wallet className="h-5 w-5 text-blue-600" />
                            <CardTitle>Request Withdrawal</CardTitle>
                        </div>
                        <CardDescription>Enter the amount you wish to withdraw to your bank account.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                            <p className="text-sm text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Available for Withdrawal</p>
                            <h3 className="text-4xl font-bold text-gray-900 dark:text-white">₦{balance.toLocaleString()}</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Withdrawal Amount</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-gray-400 font-bold">₦</span>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full pl-8 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg focus:ring-2 ring-blue-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            {bankAccounts.length > 0 ? (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Select Bank Account</label>
                                    <select
                                        className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg focus:ring-2 ring-blue-500 outline-none transition-all"
                                        value={selectedAccount}
                                        onChange={(e) => setSelectedAccount(e.target.value)}
                                    >
                                        {bankAccounts.map((account) => (
                                            <option key={account.id} value={account.id}>
                                                {account.bank_name} - {account.account_number}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div className="p-4 rounded-lg bg-orange-50 text-orange-800 text-sm border border-orange-200">
                                    Please add a bank account to withdraw funds.
                                </div>
                            )}

                            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 flex items-start gap-3">
                                <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                                <div className="text-xs text-blue-700 dark:text-blue-300">
                                    <p className="font-semibold mb-1">Payment Information</p>
                                    <p>Funds will be sent to your registered bank account. Processing usually takes 1-3 business days.</p>
                                </div>
                            </div>

                            <Button
                                className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg font-bold"
                                disabled={bankAccounts.length === 0 || withdrawing || !amount || Number(amount) <= 0}
                                onClick={handleWithdrawal}
                            >
                                {withdrawing ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    "Confirm Withdrawal"
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="border-none shadow-sm bg-gradient-to-br from-gray-900 to-black text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium opacity-70">Saved Bank Accounts</CardTitle>
                            <Landmark className="h-4 w-4 opacity-70" />
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4">
                            {bankAccounts.length > 0 ? (
                                <div className="space-y-3">
                                    {bankAccounts.map((account) => (
                                        <div key={account.id} className="flex items-center justify-between group">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
                                                    <span className="text-xs font-bold">{account.bank_name.charAt(0)}</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold truncate max-w-[120px]">{account.bank_name}</p>
                                                    <p className="text-xs opacity-60">****{account.account_number.slice(-4)}</p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-white/20 hover:text-red-400 transition-opacity"
                                                onClick={() => handleDeleteAccount(account.id)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm opacity-60">No bank accounts added yet.</p>
                            )}

                            <div className="pt-2">
                                <AddBankAccountModal onSuccess={fetchData} landlordName={landlordName} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-white dark:bg-gray-950">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Auto-Withdrawal</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground mb-4">Automatically withdraw funds when balance reaches ₦100,000.</p>
                            <Button variant="outline" size="sm" className="w-full">Enable Status</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Card className="border-none shadow-sm bg-white dark:bg-gray-950">
                <CardHeader>
                    <CardTitle>Withdrawal History</CardTitle>
                    <CardDescription>View your past withdrawal requests and their statuses.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border overflow-hidden">
                        <Table>
                            <TableHeader className="bg-gray-50 dark:bg-gray-900/50">
                                <TableRow>
                                    <TableHead>Reference</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Bank</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {withdrawals.length > 0 ? withdrawals.map((wd: any) => (
                                    <TableRow key={wd.id}>
                                        <TableCell className="font-mono text-xs">{wd.reference}</TableCell>
                                        <TableCell className="font-bold">₦{Number(wd.amount).toLocaleString()}</TableCell>
                                        <TableCell>{new Date(wd.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell>{wd.bank_account?.bank_name || 'Removed Bank'}</TableCell>
                                        <TableCell>
                                            <Badge className={
                                                wd.status === 'completed' ? "bg-green-100 text-green-700 hover:bg-green-200 border-none" :
                                                    wd.status === 'failed' ? "bg-red-100 text-red-700 hover:bg-red-200 border-none" :
                                                        "bg-orange-100 text-orange-700 hover:bg-orange-200 border-none"
                                            }>
                                                {wd.status.charAt(0).toUpperCase() + wd.status.slice(1)}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                            No withdrawal history found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
