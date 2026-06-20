"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet, AlertCircle, CalendarDays, CheckCircle2 } from "lucide-react"

interface BillsSummaryProps {
    totalOutstanding: number
    nextDueDate: string | null
    walletBalance: number
    overdueCount: number
}

export function BillsSummaryCards({ totalOutstanding, nextDueDate, walletBalance, overdueCount }: BillsSummaryProps) {
    const formatDate = (dateString: string | null) => {
        if (!dateString) return "No upcoming bills"
        const date = new Date(dateString)
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    }

    const getDaysLeft = (dateString: string | null) => {
        if (!dateString) return null
        const diff = new Date(dateString).getTime() - new Date().getTime()
        const days = Math.ceil(diff / (1000 * 3600 * 24))
        if (days < 0) return "Overdue"
        if (days === 0) return "Due Today"
        return `${days} days left`
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
                    <AlertCircle className={`h-4 w-4 ${totalOutstanding > 0 ? "text-red-500" : "text-muted-foreground"}`} />
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${totalOutstanding > 0 ? "text-red-600" : ""}`}>
                        ₦{totalOutstanding.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {overdueCount > 0 ? `${overdueCount} overdue bills` : "All caught up"}
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Next Due Date</CardTitle>
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatDate(nextDueDate)}</div>
                    <p className={`text-xs ${getDaysLeft(nextDueDate) === "Overdue" ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
                        {getDaysLeft(nextDueDate) || "Relax, nothing due soon"}
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₦{walletBalance.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Available for payments</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
                    <CheckCircle2 className={`h-4 w-4 ${overdueCount > 0 ? "text-red-500" : "text-green-500"}`} />
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${overdueCount > 0 ? "text-red-600" : "text-green-600"}`}>
                        {overdueCount > 0 ? "Action Needed" : "Active"}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {overdueCount > 0 ? "Clear overdue bills" : "Account in good standing"}
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
