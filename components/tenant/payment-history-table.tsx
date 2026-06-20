"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { PaymentTransaction } from "@/types"
import { generateReceipt } from "@/lib/receipt-generator"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface PaymentHistoryProps {
    transactions: PaymentTransaction[]
}

export function PaymentHistoryTable({ transactions }: PaymentHistoryProps) {
    const { toast } = useToast()

    const handleDownload = async (tx: PaymentTransaction) => {
        try {
            toast({
                title: "Generating Receipt",
                description: "Please wait while we generate your receipt...",
            })

            // 1. Fetch details needed for receipt
            // We need tenant name/email, property address, etc.
            // Ideally this data is joined or we fetch it.
            // For now, we fetch current user profile + logic to get property info
            let user
            try {
                const { data } = await supabase.auth.getUser()
                user = data.user
            } catch (error) {
                console.error("Error getting user for receipt:", error)
                return
            }
            if (!user) return

            // Fetch full profile
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

            // Fetch Bill details to get Property address
            const { data: bill } = await supabase
                .from('bills')
                .select(`
                    id,
                    type,
                    rental:rentals (
                        property:properties (
                            title,
                            address
                        )
                    )
                `)
                .eq('id', tx.bill_id)
                .single()

            // Fix: Handle partial or array return from Supabase
            const rentalData = bill?.rental as any
            const property = Array.isArray(rentalData?.property) ? rentalData.property[0] : rentalData?.property
            const propertyAddress = property?.address || "Property Address Unavailable"
            const propertyTitle = property?.title || "Rental Property"

            // 2. Prepare Data
            const receiptData = {
                receiptNumber: `RCP-${tx.created_at.substring(0, 10).replace(/-/g, '')}-${tx.reference.substring(0, 4)}`.toUpperCase(),
                date: new Date(tx.created_at).toLocaleDateString(),
                tenantName: profile?.name || user.email || "Valued Tenant",
                tenantEmail: user.email || "",
                propertyAddress: `${propertyTitle} - ${propertyAddress}`,
                paymentMethod: tx.payment_method,
                items: [
                    {
                        description: `${bill?.type ? bill.type.toUpperCase() : 'PAYMENT'} - ${tx.reference}`,
                        amount: tx.amount
                    }
                ],
                totalAmount: tx.amount,
                status: tx.status
            }

            // 3. Generate PDF
            const doc = generateReceipt(receiptData)
            doc.save(`Receipt-${receiptData.receiptNumber}.pdf`)

            toast({
                title: "Receipt Downloaded",
                description: "Your receipt has been successfully downloaded.",
                variant: "default",
            })

            // 4. Optionally save record to 'receipts' table if not exists
            // This is "lazy" creation. Real system might do this on payment success hook.
            await supabase.from('receipts').upsert({
                receipt_number: receiptData.receiptNumber,
                payment_id: tx.id, // Assuming link
                tenant_id: user.id,
                amount_paid: tx.amount,
                payment_method: tx.payment_method,
                status: 'issued',
                metadata: receiptData
            }, { onConflict: 'receipt_number' })

        } catch (error) {
            console.error(error)
            toast({
                title: "Error",
                description: "Failed to generate receipt.",
                variant: "destructive",
            })
        }
    }

    return (
        <div className="rounded-md border overflow-hidden">
            <Table>
                <TableHeader className="bg-muted/50">
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Receipt</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {transactions.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                No payment history found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        transactions.map((tx) => (
                            <TableRow key={tx.id}>
                                <TableCell>{new Date(tx.created_at).toLocaleDateString()}</TableCell>
                                <TableCell className="font-mono text-xs text-muted-foreground">{tx.reference.substring(0, 8)}...</TableCell>
                                <TableCell className="capitalize">{tx.payment_method}</TableCell>
                                <TableCell className="font-medium">{formatCurrency(tx.amount)}</TableCell>
                                <TableCell>
                                    <Badge variant={
                                        tx.status === 'success' ? 'default' :
                                            tx.status === 'failed' ? 'destructive' :
                                                'outline'
                                    } className={tx.status === 'success' ? 'bg-green-600 hover:bg-green-700' : ''}>
                                        {tx.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    {tx.status === 'success' && (
                                        <Button size="icon" variant="ghost" onClick={() => handleDownload(tx)}>
                                            <Download className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
