"use client"

import * as React from "react"
import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { motion } from "motion/react"
import { Users, Loader2, Building, CreditCard, Clock } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface TenantData {
    id: string
    tenant_id: string
    rent_amount: number
    status: string
    property: {
        title: string
    }
    payments: {
        amount: number
        status: string
        created_at: string
    }[]
    tenant: {
        name: string
        full_name?: string
    }
}

interface TenantMonitoringProps {
    landlordId: string
}

type RentalQueryRow = Omit<TenantData, 'payments'>

export function TenantMonitoring({ landlordId }: TenantMonitoringProps) {
    const [tenants, setTenants] = useState<TenantData[]>([])
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState<string | null>(null)

    const fetchTenants = useCallback(async () => {
        setLoading(true)
        setLoadError(null)

        try {
            const [rentalsResult, paymentsResult] = await Promise.all([
                supabase
                .from('rentals')
                .select(`
                    id,
                    tenant_id,
                    rent_amount,
                    status,
                    property:properties (title),
                    tenant:profiles!rentals_tenant_id_fkey (
                        name,
                        full_name
                    )
                `)
                .eq('landlord_id', landlordId)
                .in('status', ['approved', 'active']),
                supabase
                    .from('payments')
                    .select('tenant_id, amount, status, created_at')
                    .eq('landlord_id', landlordId)
            ])

            if (rentalsResult.error) {
                throw new Error(rentalsResult.error.message)
            }

            const paymentsByTenant = new Map<string, TenantData['payments']>()
            if (!paymentsResult.error) {
                for (const payment of paymentsResult.data || []) {
                    if (!payment.tenant_id) continue
                    const tenantPayments = paymentsByTenant.get(payment.tenant_id) || []
                    tenantPayments.push({
                        amount: Number(payment.amount),
                        status: payment.status,
                        created_at: payment.created_at
                    })
                    paymentsByTenant.set(payment.tenant_id, tenantPayments)
                }
            }

            const rentalRows = (rentalsResult.data || []) as unknown as RentalQueryRow[]
            const formattedData = rentalRows.map((rental) => ({
                    ...rental,
                    payments: paymentsByTenant.get(rental.tenant_id) || []
            }))
            setTenants(formattedData)
        } catch (error: unknown) {
            setTenants([])
            setLoadError(error instanceof Error ? error.message : 'Unable to load tenants.')
        } finally {
            setLoading(false)
        }
    }, [landlordId])

    useEffect(() => {
        if (landlordId) {
            fetchTenants()

            const channel = supabase
                .channel('tenant-monitoring-changes')
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'rentals' },
                    () => fetchTenants()
                )
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'payments' },
                    () => fetchTenants()
                )
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
            }
        }
    }, [landlordId, fetchTenants])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
                <p className="text-slate-500">Loading tenants...</p>
            </div>
        )
    }

    if (loadError) {
        return (
            <EmptyState
                icon={Users}
                title="Unable to load tenants"
                description={loadError}
            />
        )
    }

    if (tenants.length === 0) {
        return (
            <EmptyState
                icon={Users}
                title="No active tenants"
                description="You don't have any active tenants right now. Once a tenant's application is approved, they will appear here."
            />
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tenants.map((t, idx) => {
                const totalPaid = t.payments?.reduce(
                    (sum, p) => p.status === 'success' ? sum + Number(p.amount) : sum,
                    0
                ) || 0;

                const lastPayment = t.payments?.length > 0
                    ? new Date(t.payments[t.payments.length - 1].created_at).toLocaleDateString()
                    : 'Never';

                const tenantName = t.tenant?.full_name || t.tenant?.name || "Unknown Tenant";
                
                return (
                    <motion.div
                        key={`${t.tenant_id}-${idx}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: idx * 0.05 }}
                        className="group relative flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl shadow-sm hover:shadow-md transition-all p-5"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg">
                                    {tenantName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">{tenantName}</h3>
                                    <div className="flex items-center gap-1 text-xs text-slate-500">
                                        <Building className="w-3 h-3" />
                                        <span className="truncate max-w-[150px]">{t.property?.title}</span>
                                    </div>
                                </div>
                            </div>
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs font-medium rounded-full">
                                Active
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                            <div className="space-y-1">
                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                    <CreditCard className="w-3 h-3" /> Total Paid
                                </p>
                                <p className="font-semibold text-slate-900 dark:text-slate-100">
                                    ₦{totalPaid.toLocaleString()}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Last Payment
                                </p>
                                <p className="font-medium text-slate-700 dark:text-slate-300 text-sm">
                                    {lastPayment}
                                </p>
                            </div>
                        </div>
                        <Button asChild className="mt-4 w-full rounded-xl">
                            <Link href={`/tenants/${t.id}`}>Manage Tenant</Link>
                        </Button>
                    </motion.div>
                )
            })}
        </div>
    )
}
