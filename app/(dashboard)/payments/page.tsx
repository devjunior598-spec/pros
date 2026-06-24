"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { RoleGuard } from "@/components/role-guard"
import { Loader2 } from "lucide-react"
import { BillsTable } from "@/components/landlord/bills-table"
import { WithdrawalPanel } from "@/components/landlord/withdrawal-panel"

export default function PaymentsPage() {
    const [landlordId, setLandlordId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'withdrawals' | 'billing'>('withdrawals')

    useEffect(() => {
        const controller = new AbortController()
        const fetchUser = async (signal: AbortSignal) => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user && !signal.aborted) {
                setLandlordId(user.id)
            }
            if (!signal.aborted) {
                setLoading(false)
            }
        }
        fetchUser(controller.signal)
        return () => controller.abort()
    }, [])

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    if (!landlordId) return <div>Please log in to view payments.</div>

    return (
        <RoleGuard allowedRoles={['landlord']}>
            <div className="flex-1 space-y-4 p-2 sm:p-4 md:p-8 pt-4 md:pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Earnings & Payments</h2>
                </div>

                <div className="flex space-x-2 border-b pb-2 mb-4">
                    <button
                        onClick={() => setActiveTab('withdrawals')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'withdrawals'
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                    >
                        Earnings & Withdrawals
                    </button>
                    <button
                        onClick={() => setActiveTab('billing')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'billing'
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                    >
                        Tenant Billing
                    </button>
                </div>

                <div className="mt-4">
                    {activeTab === 'withdrawals' ? (
                        <WithdrawalPanel landlordId={landlordId} />
                    ) : (
                        <BillsTable landlordId={landlordId} />
                    )}
                </div>
            </div>
        </RoleGuard>
    )
}
