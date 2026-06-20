"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, DollarSign, History, Banknote } from "lucide-react"

interface WithdrawalPanelProps {
    landlordId: string
}

interface Withdrawal {
    id: string
    amount: number
    status: string
    bank_name: string
    account_number: string
    created_at: string
}

export function WithdrawalPanel({ landlordId }: WithdrawalPanelProps) {
    const [balance, setBalance] = useState<number>(0)
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [amount, setAmount] = useState("")
    const [bankName, setBankName] = useState("")
    const [accountNumber, setAccountNumber] = useState("")
    const [accountName, setAccountName] = useState("")

    const fetchData = useCallback(async (signal?: AbortSignal) => {
        setLoading(true)

        try {
            // Fetch balance
            const { data: profile } = await supabase
                .from('profiles')
                .select('balance')
                .eq('id', landlordId)
                .abortSignal(signal as AbortSignal)
                .single()

            if (profile && !signal?.aborted) setBalance(profile.balance || 0)

            // Fetch withdrawals
            const { data: withdrawalData } = await supabase
                .from('withdrawals')
                .select('*')
                .eq('landlord_id', landlordId)
                .order('created_at', { ascending: false })
                .abortSignal(signal as AbortSignal)

            if (withdrawalData && !signal?.aborted) setWithdrawals(withdrawalData)
        } catch (error) {
            if (!signal?.aborted) {
                console.error('Error fetching withdrawal data:', error)
            }
        } finally {
            if (!signal?.aborted) {
                setLoading(false)
            }
        }
    }, [landlordId])

    useEffect(() => {
        const controller = new AbortController()
        if (landlordId) fetchData(controller.signal)
        return () => controller.abort()
    }, [landlordId, fetchData])

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault()
        const withdrawAmount = parseFloat(amount)

        if (withdrawAmount <= 0) {
            alert("Please enter a valid amount")
            return
        }

        if (withdrawAmount > balance) {
            alert("Insufficient balance")
            return
        }

        setSubmitting(true)

        const { error } = await supabase.from('withdrawals').insert({
            landlord_id: landlordId,
            amount: withdrawAmount,
            bank_name: bankName,
            account_number: accountNumber,
            account_name: accountName,
            status: 'pending'
        })

        if (error) {
            alert("Error requesting withdrawal: " + error.message)
        } else {
            alert("Withdrawal request submitted successfully!")
            setAmount("")
            setBankName("")
            setAccountNumber("")
            setAccountName("")
            fetchData()
        }
        setSubmitting(false)
    }

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
                        <DollarSign className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">₦{balance.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">Ready for withdrawal</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Withdrawals</CardTitle>
                        <Banknote className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            ₦{withdrawals
                                .filter(w => w.status === 'pending')
                                .reduce((acc, curr) => acc + curr.amount, 0)
                                .toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Processing requests</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Request Withdrawal</CardTitle>
                        <CardDescription>Send funds to your bank account.</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleWithdraw}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="amount">Amount (₦)</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bank">Bank Name</Label>
                                <Input
                                    id="bank"
                                    placeholder="e.g. GTBank, Zenith"
                                    value={bankName}
                                    onChange={(e) => setBankName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="accNumber">Account Number</Label>
                                <Input
                                    id="accNumber"
                                    placeholder="10-digit number"
                                    value={accountNumber}
                                    onChange={(e) => setAccountNumber(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="accName">Account Name</Label>
                                <Input
                                    id="accName"
                                    placeholder="Full name on account"
                                    value={accountName}
                                    onChange={(e) => setAccountName(e.target.value)}
                                    required
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" type="submit" disabled={submitting || balance <= 0}>
                                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Withdraw Funds
                            </Button>
                        </CardFooter>
                    </form>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <History className="h-5 w-5" />
                                Withdrawal History
                            </CardTitle>
                            <CardDescription>Your recent payout requests.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Bank</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {withdrawals.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                            No withdrawal history yet.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    withdrawals.map((w) => (
                                        <TableRow key={w.id}>
                                            <TableCell className="text-sm">
                                                {new Date(w.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="font-semibold">
                                                ₦{w.amount.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {w.bank_name}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={
                                                    w.status === 'approved' ? 'default' :
                                                        w.status === 'pending' ? 'outline' :
                                                            'destructive'
                                                }>
                                                    {w.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
