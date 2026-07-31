"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, CreditCard, Receipt, Wallet, History, Landmark, Banknote } from "lucide-react"
import LandlordPaymentsPage from "@/app/(dashboard)/dashboard/payments/page"
import TenantRentPaymentsPage from "@/app/(dashboard)/dashboard/rent-payments/page"
import PayBillsPage from "@/app/(dashboard)/pay-bills/page"
import WalletPage from "@/app/(dashboard)/wallet/page"
import HistoryPage from "@/app/(dashboard)/history/page"
import WithdrawalsPage from "@/app/(dashboard)/withdrawals/page"
import { BillsTable } from "@/components/landlord/bills-table"

export default function PaymentsCenterPage() {
    const { user, profile, loading, isLandlord, isTenant } = useAuth()
    const [tenantTab, setTenantTab] = useState("rent")
    const [landlordTab, setLandlordTab] = useState("overview")

    if (loading) {
        return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    }

    if (!user || !profile) {
        return <div className="p-8 text-center text-muted-foreground">Please log in to view payments.</div>
    }

    if (isTenant) {
        return (
            <div className="mx-auto max-w-7xl space-y-6 px-3 py-4 md:p-8 md:pt-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Payments</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Pay rent and bills, manage your wallet, and review every transaction.</p>
                </div>
                <Tabs value={tenantTab} onValueChange={setTenantTab} className="space-y-6">
                    <TabsList className="grid h-auto w-full grid-cols-4 bg-muted/50 p-1">
                        <TabsTrigger value="rent" className="gap-2 py-2.5"><CreditCard className="h-4 w-4" /><span className="hidden sm:inline">Rent</span></TabsTrigger>
                        <TabsTrigger value="bills" className="gap-2 py-2.5"><Receipt className="h-4 w-4" /><span className="hidden sm:inline">Bills</span></TabsTrigger>
                        <TabsTrigger value="wallet" className="gap-2 py-2.5"><Wallet className="h-4 w-4" /><span className="hidden sm:inline">Wallet</span></TabsTrigger>
                        <TabsTrigger value="history" className="gap-2 py-2.5"><History className="h-4 w-4" /><span className="hidden sm:inline">History</span></TabsTrigger>
                    </TabsList>
                    <TabsContent value="rent"><TenantRentPaymentsPage /></TabsContent>
                    <TabsContent value="bills"><PayBillsPage /></TabsContent>
                    <TabsContent value="wallet"><WalletPage /></TabsContent>
                    <TabsContent value="history"><HistoryPage /></TabsContent>
                </Tabs>
            </div>
        )
    }

    if (isLandlord) {
        return (
            <div className="mx-auto max-w-7xl space-y-6 px-3 py-4 md:p-8 md:pt-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Payments</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Track collections, create tenant bills, and manage withdrawals in one place.</p>
                </div>
                <Tabs value={landlordTab} onValueChange={setLandlordTab} className="space-y-6">
                    <TabsList className="grid h-auto w-full grid-cols-3 bg-muted/50 p-1">
                        <TabsTrigger value="overview" className="gap-2 py-2.5"><Banknote className="h-4 w-4" /><span className="hidden sm:inline">Overview</span></TabsTrigger>
                        <TabsTrigger value="billing" className="gap-2 py-2.5"><Receipt className="h-4 w-4" /><span className="hidden sm:inline">Tenant Billing</span></TabsTrigger>
                        <TabsTrigger value="withdrawals" className="gap-2 py-2.5"><Landmark className="h-4 w-4" /><span className="hidden sm:inline">Withdrawals</span></TabsTrigger>
                    </TabsList>
                    <TabsContent value="overview"><LandlordPaymentsPage /></TabsContent>
                    <TabsContent value="billing"><BillsTable landlordId={user.id} /></TabsContent>
                    <TabsContent value="withdrawals"><WithdrawalsPage /></TabsContent>
                </Tabs>
            </div>
        )
    }

    return <div className="p-8 text-center text-muted-foreground">Payments are not available for this account role.</div>
}
