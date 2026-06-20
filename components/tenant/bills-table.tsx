"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PaymentModal } from "@/components/tenant/payment-modal"
import { formatCurrency } from "@/lib/utils"
import { Bill } from "@/types"
import { CreditCard, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function TenantBillsTable() {
    const [bills, setBills] = useState<Bill[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
    const [walletBalance, setWalletBalance] = useState(0)
    const { toast } = useToast()

    useEffect(() => {
        fetchData()

        const channel = supabase
            .channel('tenant-bills-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bills' }, fetchData)
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [])

    const fetchData = async () => {
        setLoading(true)
        let user
        try {
            const { data } = await supabase.auth.getUser()
            user = data.user
        } catch (error) {
            console.error(error)
            setLoading(false)
            return
        }
        if (!user) return

        // Fetch Bills
        const { data: billsData } = await supabase
            .from('bills')
            .select('*')
            .order('due_date', { ascending: true })

        if (billsData) setBills(billsData as any)

        // Fetch Wallet
        const { data: walletData } = await supabase
            .from('wallets')
            .select('balance')
            .eq('tenant_id', user.id)
            .single()

        if (walletData) setWalletBalance(walletData.balance)

        setLoading(false)
    }

    const handlePayClick = (bill: Bill) => {
        setSelectedBill(bill)
        setIsPaymentModalOpen(true)
    }

    const processPayment = async (billId: string, amount: number, method: string) => {
        let user
        try {
            const { data } = await supabase.auth.getUser()
            user = data.user
        } catch (error) {
            console.error(error)
            return
        }
        if (!user) return
        const email = user.email || ''

        try {
            // 1. Build a unique reference (used by webhook to identify bill)
            const reference = `bill-${billId}-${Date.now()}`

            if (method === 'wallet') {
                // wallet payments are handled entirely via RPC for atomicity
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
                // card or transfer; require email
                if (!email) {
                    throw new Error('Email address is required for card or bank payments. Please update your profile.');
                }
                // redirect to Paystack using server endpoint
                const initRes = await fetch('/api/initiate-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        amount,
                        // email was validated earlier; Paystack requires it
                        email,
                        reference,
                        metadata: { bill_id: billId, payment_method: method },
                        // limit to selected channel
                        channels: [method === 'card' ? 'card' : 'bank']
                    }),
                })

                const initData = await initRes.json()
                if (!initRes.ok || !initData.payment_url) {
                    throw new Error(initData?.message || 'Failed to initialize payment')
                }

                // redirecting will unmount component; no further state updates required
                window.location.href = initData.payment_url
                return
            }

            // 2. Update Bill
            const bill = bills.find(b => b.id === billId)
            if (!bill) return

            const newAmountPaid = (bill.amount_paid || 0) + amount
            const newStatus = newAmountPaid >= bill.amount ? 'paid' : 'partially_paid'

            await supabase
                .from('bills')
                .update({
                    amount_paid: newAmountPaid,
                    status: newStatus,
                    paid_at: newStatus === 'paid' ? new Date().toISOString() : null
                })
                .eq('id', billId)

            setIsPaymentModalOpen(false)
            fetchData() // Refresh data
            toast({
                title: "Payment successful!",
                description: `Successfully paid ${formatCurrency(amount)}`,
                variant: "default",
            })

        } catch (error: any) {
            console.error(error)
            toast({
                title: "Payment failed",
                description: error.message || "An error occurred during payment.",
                variant: "destructive",
            })
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'paid': return 'default' // standardized to default/primary
            case 'partially_paid': return 'secondary' // yellow/warning usually but using secondary for now
            case 'overdue': return 'destructive'
            default: return 'outline'
        }
    }

    return (
        <>
            <div className="rounded-md border overflow-hidden bg-background">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead>Bill Type</TableHead>
                            <TableHead>Billing Period</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Paid</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {bills.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                                    No bills found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            bills.map((bill) => (
                                <TableRow key={bill.id}>
                                    <TableCell className="font-medium capitalize">{bill.type}</TableCell>
                                    <TableCell>{bill.billing_period || '-'}</TableCell>
                                    <TableCell>{formatCurrency(bill.amount)}</TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {bill.amount_paid > 0 ? formatCurrency(bill.amount_paid) : '-'}
                                    </TableCell>
                                    <TableCell>{new Date(bill.due_date).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(bill.status)} className="capitalize">
                                            {bill.status.replace('_', ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {bill.status !== 'paid' && (
                                            <Button size="sm" onClick={() => handlePayClick(bill)}>
                                                Pay Now
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <PaymentModal
                open={isPaymentModalOpen}
                onOpenChange={setIsPaymentModalOpen}
                bill={selectedBill}
                walletBalance={walletBalance}
                onProcessPayment={processPayment}
            />
        </>
    )
}
