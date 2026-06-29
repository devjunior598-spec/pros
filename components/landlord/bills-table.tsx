"use client"

import * as React from "react"
import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import PayBillButton from "@/components/pay-bill-button"
import { CreditCard } from "lucide-react"

interface BillWithRental {
    id: string
    type: string
    amount: number
    amount_paid: number
    status: string
    due_date?: string
    rental: {
        tenant_id: string
        tenant: {
            name: string
            full_name?: string
            email: string
        }
    }
}

interface BillsTableProps {
    landlordId: string
}

export function BillsTable({ landlordId }: BillsTableProps) {
    const [bills, setBills] = useState<BillWithRental[]>([])
    const [loading, setLoading] = useState(true)

    const fetchBills = useCallback(async (signal?: AbortSignal) => {
        setLoading(true)

        try {
            let query = supabase
                .from('bills')
                .select(`
                id,
                type,
                amount,
                amount_paid,
                status,
                due_date,
                rental:rentals!inner (
                    tenant_id,
                    tenant:profiles!tenant_id (
                        email,
                        name,
                        full_name
                    )
                )
            `)
                .eq('rental.landlord_id', landlordId)

            if (signal) {
                query = query
            }

            const { data, error } = await query

            if (error) {
                if (!signal?.aborted) {
                    console.error('Error fetching bills details:', JSON.stringify(error, null, 2))
                    console.error('Full error object:', error)
                }
            } else if (!signal?.aborted) {
                setBills(data as unknown as BillWithRental[])
            }
        } catch (error) {
            if (!signal?.aborted) {
                console.error('Error in fetchBills:', error)
            }
        } finally {
            if (!signal?.aborted) {
                setLoading(false)
            }
        }
    }, [landlordId])

    useEffect(() => {
        let mounted = true
        if (landlordId) {
            fetchBills()

            const channel = supabase
                .channel('bills-table-changes')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'bills',
                    },
                    () => fetchBills()
                )
                .subscribe()

            return () => {
                mounted = false
                supabase.removeChannel(channel)
            }
        }
    }, [landlordId, fetchBills])

    if (loading) {
        return (
            <Card>
                <CardHeader><CardTitle>Tenant Bills</CardTitle></CardHeader>
                <CardContent className="flex justify-center p-8">
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        <p className="text-sm text-muted-foreground">Loading bills...</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Tenant Bills & Payments</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Monitor rent payments and utility charges across all properties.</p>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tenant</TableHead>
                            <TableHead>Type</TableHead>
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
                                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                    <div className="flex flex-col items-center gap-2 opacity-40">
                                        <CreditCard className="h-10 w-10" />
                                        <p>No billing records found.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            bills.map((bill) => (
                                <TableRow key={bill.id} className="hover:bg-muted/30 transition-colors">
                                    <TableCell className="font-semibold">{bill.rental?.tenant?.full_name || bill.rental?.tenant?.name || bill.rental?.tenant_id || '-'}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="capitalize">{bill.type}</Badge>
                                    </TableCell>
                                    <TableCell className="font-mono font-bold">₦{bill.amount.toLocaleString()}</TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {bill.amount_paid > 0 ? `₦${bill.amount_paid.toLocaleString()}` : '-'}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {bill.due_date ? new Date(bill.due_date).toLocaleDateString() : '-'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            bill.status === 'paid' ? 'default' :
                                                bill.status === 'partially_paid' ? 'secondary' :
                                                    (bill.status === 'unpaid' || bill.status === 'pending') ? 'outline' :
                                                        'destructive'
                                        } className="capitalize">
                                            {bill.status.replace('_', ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <PayBillButton bill={{
                                            id: bill.id,
                                            amount: bill.amount,
                                            tenant_email: bill.rental?.tenant?.email || "",
                                            status: bill.status
                                        }} />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
