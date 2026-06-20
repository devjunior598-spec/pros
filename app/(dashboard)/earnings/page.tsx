"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, DollarSign, ArrowUpRight, TrendingUp, BarChart3, Download, Calendar } from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default function EarningsPage() {
    const [earnings, setEarnings] = useState<any[]>([])
    const [stats, setStats] = useState({ total: 0, pending: 0, count: 0 })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const controller = new AbortController()
        const fetchEarnings = async (signal: AbortSignal) => {
            setLoading(true)
            try {
                const { data: { user } } = await supabase.auth.getUser()

                if (user && !signal.aborted) {
                    const { data } = await supabase
                        .from('bills')
                        .select('*, rental:rentals!inner(property:properties(title, landlord_id))')
                        .eq('rental.property.landlord_id', user.id)
                        .eq('status', 'paid')
                        .order('updated_at', { ascending: false })
                        .abortSignal(signal)

                    if (!signal.aborted) {
                        const paidEarnings = data || []
                        const total = paidEarnings.reduce((sum, item) => sum + (item.amount || 0), 0)

                        setEarnings(paidEarnings)
                        setStats({
                            total,
                            pending: 0,
                            count: paidEarnings.length
                        })
                    }
                }
            } catch (error) {
                if (!signal.aborted) {
                    console.error("Error fetching earnings:", error)
                }
            } finally {
                if (!signal.aborted) {
                    setLoading(false)
                }
            }
        }
        fetchEarnings(controller.signal)
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold tracking-tight">Financial Overview</h1>
                    <p className="text-muted-foreground">Track your rental income and financial performance.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline">
                        <Calendar className="h-4 w-4 mr-2" />
                        Last 30 Days
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                        <Download className="h-4 w-4 mr-2" />
                        Export Report
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="border-none shadow-sm bg-blue-600 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-6 opacity-10">
                        <DollarSign className="h-24 w-24" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-blue-100 text-sm font-medium">Total Lifetime Earnings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">&#8358;{stats.total.toLocaleString()}</div>
                        <p className="text-blue-100 text-xs mt-1 flex items-center">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            +12% from previous month
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white dark:bg-gray-950">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-muted-foreground text-sm font-medium">Pending Payments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">&#8358;{stats.pending.toLocaleString()}</div>
                        <p className="text-muted-foreground text-xs mt-1">4 outstanding utility bills</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white dark:bg-gray-950">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-muted-foreground text-sm font-medium">Monthly Growth</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">&#8358;450,000</div>
                        <p className="text-green-600 dark:text-green-400 text-xs mt-1 flex items-center">
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                            Consistent performance
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-sm bg-white dark:bg-gray-950">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Recent Income</CardTitle>
                            <CardDescription>Detailed log of payments received from tenants.</CardDescription>
                        </div>
                        <BarChart3 className="h-5 w-5 text-gray-400" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border overflow-hidden">
                        <Table>
                            <TableHeader className="bg-gray-50 dark:bg-gray-900/50">
                                <TableRow>
                                    <TableHead>Property</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {earnings.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                            No earnings record found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    earnings.map((e) => (
                                        <TableRow key={e.id}>
                                            <TableCell className="font-semibold">{e.rental?.property?.title || 'Unknown'}</TableCell>
                                            <TableCell className="capitalize">{e.type}</TableCell>
                                            <TableCell className="font-bold">&#8358;{e.amount?.toLocaleString()}</TableCell>
                                            <TableCell>{new Date(e.updated_at).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-none">Received</Badge>
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
