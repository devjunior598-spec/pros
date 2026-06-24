"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, DollarSign, TrendingUp, BarChart3, Download, Calendar, Receipt } from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"

export default function EarningsPage() {
    const [earnings, setEarnings] = useState<any[]>([])
    const [stats, setStats] = useState({ total: 0, thisMonth: 0, count: 0 })
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

                        // Calculate this month's earnings
                        const now = new Date()
                        const thisMonth = paidEarnings
                            .filter(e => {
                                const d = new Date(e.updated_at)
                                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
                            })
                            .reduce((sum, item) => sum + (item.amount || 0), 0)

                        setEarnings(paidEarnings)
                        setStats({ total, thisMonth, count: paidEarnings.length })
                    }
                }
            } catch (error) {
                if (!signal.aborted) console.error("Error fetching earnings:", error)
            } finally {
                if (!signal.aborted) setLoading(false)
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
            {/* Page header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center">
                            <DollarSign className="h-4 w-4 text-blue-500" />
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Financial Overview</h1>
                    </div>
                    <p className="text-muted-foreground text-sm ml-10">Track your rental income and financial performance.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <Button variant="outline" className="w-full sm:w-auto min-h-[44px]">
                        <Calendar className="h-4 w-4 mr-2" />
                        Last 30 Days
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto min-h-[44px]">
                        <Download className="h-4 w-4 mr-2" />
                        Export Report
                    </Button>
                </div>
            </div>

            {/* Stat cards */}
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3">
                {/* Total earnings — intentional accent gradient card */}
                <Card className="border-none shadow-sm bg-blue-600 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-6 opacity-10">
                        <DollarSign className="h-24 w-24" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-blue-100 text-sm font-medium">Total Lifetime Earnings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl sm:text-3xl font-bold">&#8358;{stats.total.toLocaleString()}</div>
                        <p className="text-blue-100 text-xs mt-1 flex items-center gap-1">
                            <Receipt className="h-3 w-3" />
                            {stats.count} payment{stats.count !== 1 ? "s" : ""} received
                        </p>
                    </CardContent>
                </Card>

                <Card className="border shadow-sm bg-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-muted-foreground text-sm font-medium">This Month</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl sm:text-3xl font-bold text-foreground">
                            &#8358;{stats.thisMonth.toLocaleString()}
                        </div>
                        <p className="text-muted-foreground text-xs mt-1">
                            {stats.thisMonth > 0 ? "Payments collected this month" : "No payments yet this month"}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border shadow-sm bg-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-muted-foreground text-sm font-medium">Total Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl sm:text-3xl font-bold text-foreground">{stats.count}</div>
                        <p className="text-muted-foreground text-xs mt-1 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 text-green-500" />
                            Paid bills recorded
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Earnings table */}
            <Card className="border shadow-sm bg-card">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-foreground">Recent Income</CardTitle>
                            <CardDescription>Detailed log of payments received from tenants.</CardDescription>
                        </div>
                        <BarChart3 className="h-5 w-5 text-muted-foreground" />
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Mobile card view */}
                    <div className="md:hidden space-y-3">
                        {earnings.length === 0 ? (
                            <p className="text-center py-8 text-muted-foreground">No earnings records found.</p>
                        ) : (
                            earnings.map((e) => (
                                <div key={e.id} className="p-4 rounded-xl border bg-card space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-sm truncate max-w-[200px]">{e.rental?.property?.title || 'Unknown'}</span>
                                        <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 hover:bg-green-500/20 border border-green-500/30 shadow-none text-[10px]">
                                            Received
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground capitalize">{e.type}</span>
                                        <span className="font-bold">&#8358;{e.amount?.toLocaleString()}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {new Date(e.updated_at).toLocaleDateString()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    {/* Desktop table */}
                    <div className="hidden md:block rounded-md border overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50">
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
                                            No earnings records found.
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
                                                <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 hover:bg-green-500/20 border border-green-500/30 shadow-none">
                                                    Received
                                                </Badge>
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
