"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, Download, History as HistoryIcon, ArrowLeft, Search } from "lucide-react"
import Link from "next/link"

export default function PaymentHistoryPage() {
    const [payments, setPayments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const controller = new AbortController()
        const fetchHistory = async (signal: AbortSignal) => {
            setLoading(true)
            try {
                const { data: { user } } = await supabase.auth.getUser()

                if (user && !signal.aborted) {
                    const { data, error } = await supabase
                        .from('bills')
                        .select('*, rental:rentals!inner(property:properties(title))')
                        .eq('rental.tenant_id', user.id)
                        .eq('status', 'paid')
                        .order('updated_at', { ascending: false })
                        .abortSignal(signal)

                    if (!signal.aborted) {
                        setPayments(data || [])
                    }
                }
            } catch (error) {
                if (!signal.aborted) {
                    console.error("Error fetching payment history:", error)
                }
            } finally {
                if (!signal.aborted) {
                    setLoading(false)
                }
            }
        }
        fetchHistory(controller.signal)
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
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground group">
                    <Link href="/dashboard" className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Payment History</h1>
                <p className="text-muted-foreground">Keep track of all your past rent and utility payments.</p>
            </div>

            <Card className="shadow-sm border-none bg-white dark:bg-gray-950">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Transaction Logs</CardTitle>
                        <CardDescription>A detailed list of all successful payments.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative hidden md:block">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search payments..."
                                className="pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-900 border-none rounded-md w-64 focus:ring-2 ring-blue-500 outline-none"
                            />
                        </div>
                        <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Export CSV
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Mobile card view */}
                    <div className="md:hidden space-y-3">
                        {payments.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground flex flex-col items-center gap-2 opacity-50">
                                <HistoryIcon className="h-10 w-10" />
                                <p>No payment history found.</p>
                            </div>
                        ) : (
                            payments.map((payment) => (
                                <div key={payment.id} className="p-4 rounded-xl border bg-card space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-sm truncate max-w-[200px]">{payment.rental?.property?.title || 'Unknown Property'}</span>
                                        <Badge variant="secondary" className="capitalize text-[10px] h-5">
                                            {payment.type}
                                        </Badge>
                                    </div>
                                    <div className="font-bold text-sm">
                                        ₦{payment.amount?.toLocaleString()}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono text-xs text-muted-foreground">
                                            {payment.id.split('-')[0].toUpperCase()}...
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(payment.updated_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="pt-1">
                                        <Button variant="ghost" size="sm" className="h-7 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs">
                                            <Download className="h-3 w-3 mr-1" />
                                            Download PDF
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    {/* Desktop table */}
                    <div className="hidden md:block rounded-md border overflow-hidden">
                        <Table>
                            <TableHeader className="bg-gray-50 dark:bg-gray-900/50">
                                <TableRow>
                                    <TableHead>Reference</TableHead>
                                    <TableHead>Property</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Receipt</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                            <div className="flex flex-col items-center gap-2 opacity-50">
                                                <HistoryIcon className="h-10 w-10" />
                                                <p>No payment history found.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    payments.map((payment) => (
                                        <TableRow key={payment.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/50 transition-colors">
                                            <TableCell className="font-mono text-xs text-muted-foreground">
                                                {payment.id.split('-')[0].toUpperCase()}...
                                            </TableCell>
                                            <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                                                {payment.rental?.property?.title || 'Unknown Property'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="capitalize text-[10px] h-5">
                                                    {payment.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-bold text-gray-900 dark:text-gray-100">
                                                ₦{payment.amount?.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(payment.updated_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                                    <Download className="h-4 w-4 mr-1" />
                                                    PDF
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
