"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Plus, ArrowUpRight, ArrowDownLeft, Wallet, CreditCard, ShieldCheck, History as HistoryIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

function FundWalletForm({ userId, email }: { userId: string, email: string }) {
    const [amount, setAmount] = useState("")
    const [loading, setLoading] = useState(false)

    const handleFund = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            alert("Please enter a valid amount")
            return
        }

        setLoading(true)
        try {
            const response = await fetch('/api/initiate-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: Number(amount),
                    email,
                    reference: `fund-${userId.substring(0, 8)}-${Date.now()}`,
                    metadata: {
                        type: 'fund_wallet',
                        tenant_id: userId
                    }
                }),
            })

            const data = await response.json()
            if (data?.payment_url) {
                window.location.href = data.payment_url
            } else {
                alert('Payment initialization failed')
            }
        } catch (error) {
            console.error(error)
            alert('An error occurred')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleFund} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">
                    Amount
                </Label>
                <div className="col-span-3 relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">₦</span>
                    <Input
                        id="amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="pl-8"
                        placeholder="5,000"
                        type="number"
                    />
                </div>
            </div>
            <DialogFooter>
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Proceed to Payment
                </Button>
            </DialogFooter>
        </form>
    )
}

export default function WalletPage() {
    const [profile, setProfile] = useState<any>(null)
    const [wallet, setWallet] = useState<any>(null)
    const [transactions, setTransactions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const controller = new AbortController()
        const fetchWalletData = async (signal: AbortSignal) => {
            setLoading(true)
            try {
                const { data: { user } } = await supabase.auth.getUser()

                if (user && !signal.aborted) {
                    // Fetch profile
                    const { data: profileData } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', user.id)
                        .abortSignal(signal)
                        .single()

                    if (!signal.aborted) {
                        setProfile(profileData)
                    }

                    // Fetch wallet
                    const { data: walletData } = await supabase
                        .from('wallets')
                        .select('*')
                        .eq('tenant_id', user.id)
                        .abortSignal(signal)
                        .maybeSingle()

                    if (!signal.aborted) {
                        setWallet(walletData)
                    }

                    // Fetch recent true payment transactions
                    const { data: txData } = await supabase
                        .from('payments')
                        .select('*, bill:bills(type, rental:rentals(property:properties(title)))')
                        .order('created_at', { ascending: false })
                        .limit(10)
                        .abortSignal(signal)

                    if (!signal.aborted) {
                        setTransactions(txData || [])
                    }
                }
            } catch (error) {
                if (!signal.aborted) {
                    console.error("Error fetching wallet data:", error)
                }
            } finally {
                if (!signal.aborted) {
                    setLoading(false)
                }
            }
        }
        fetchWalletData(controller.signal)
        return () => controller.abort()
    }, [])

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
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">My Wallet</h1>
                <p className="text-muted-foreground">Manage your funds, fund your account, and view payment history.</p>
            </div>

            {!profile?.is_verified && (
                <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 shadow-sm">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                            <div className="rounded-full bg-orange-100 dark:bg-orange-900 p-2">
                                <ShieldCheck className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-lg font-semibold text-orange-800 dark:text-orange-300">Identity Verification Required</h4>
                                <p className="text-orange-700 dark:text-orange-400/80 text-sm mb-4">
                                    You need to verify your identity before you can fund your wallet or pay bills using PRMS Wallet.
                                </p>
                                <Link href="/kyc">
                                    <Button variant="default" className="bg-orange-600 hover:bg-orange-700">Verify Now</Button>
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-8 md:grid-cols-3">
                {/* Balance Card */}
                <Card className="md:col-span-1 bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none shadow-xl overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                        <Wallet className="h-32 w-32" />
                    </div>
                    <CardHeader>
                        <CardTitle className="text-blue-100 flex items-center gap-2">
                            Available Balance
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-8 relative z-10">
                        <div>
                            <h3 className="text-5xl font-bold tracking-tight">₦{wallet?.balance?.toLocaleString() || '0'}</h3>
                            <p className="text-blue-100/70 text-sm mt-2">Last updated: {wallet?.updated_at ? new Date(wallet.updated_at).toLocaleDateString() : 'Never'}</p>
                        </div>
                        <div className="flex flex-col gap-3">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button className="w-full bg-white text-blue-700 hover:bg-blue-50 font-bold border-none" disabled={!profile?.is_verified}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Fund Wallet
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader>
                                        <DialogTitle>Fund Your Wallet</DialogTitle>
                                        <DialogDescription>
                                            Add money to your wallet to pay rent and bills instantly.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <FundWalletForm userId={profile?.id} email={profile?.email} />
                                </DialogContent>
                            </Dialog>

                        </div>
                    </CardContent>
                </Card>

                {/* Transaction History */}
                <Card className="md:col-span-2 shadow-sm border-none bg-white dark:bg-gray-950">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Recent Transactions</CardTitle>
                            <CardDescription>Your latest billing and wallet activities.</CardDescription>
                        </div>
                        <Link href="/history">
                            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">View All</Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {transactions.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
                                <HistoryIcon className="h-10 w-10 mb-2 opacity-20" />
                                <p>No transactions found.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {transactions.map((tx) => (
                                    <div key={tx.id} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-lg transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${tx.status === 'success' ? 'bg-green-100 dark:bg-green-950/50' : 'bg-orange-100 dark:bg-orange-950/50'
                                                }`}>
                                                {tx.status === 'success' ?
                                                    <ArrowDownLeft className="h-5 w-5 text-green-600 dark:text-green-400" /> :
                                                    <ArrowUpRight className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                                }
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                                                    Payment - {tx.bill?.rental?.property?.title || 'Property'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-sm font-bold ${tx.status === 'success' ? 'text-gray-900 dark:text-white' : 'text-orange-600'}`}>
                                                {tx.status === 'success' ? '+' : '-'} ₦{tx.amount?.toLocaleString()}
                                            </p>
                                            <Badge variant={tx.status === 'success' ? 'secondary' : 'outline'} className="text-[10px] h-4 mt-1">
                                                {tx.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Quick Tips */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="border-none shadow-sm bg-blue-50/50 dark:bg-blue-900/10">
                    <CardHeader className="pb-2">
                        <CreditCard className="h-5 w-5 text-blue-600 mb-2" />
                        <CardTitle className="text-sm">Instant Payments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">Pay your bills instantly from your wallet balance for faster processing.</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-green-50/50 dark:bg-green-900/10">
                    <CardHeader className="pb-2">
                        <ShieldCheck className="h-5 w-5 text-green-600 mb-2" />
                        <CardTitle className="text-sm">Secure Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">All transactions are secured with industry-standard encryption and PRMS protection.</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-purple-50/50 dark:bg-purple-900/10">
                    <CardHeader className="pb-2">
                        <Plus className="h-5 w-5 text-purple-600 mb-2" />
                        <CardTitle className="text-sm">Auto-Refill</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">Set up auto-refill to ensure you never miss a payment and avoid late fees.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
