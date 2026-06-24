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

interface TenantData {
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
        fullname?: string
    }
}

interface TenantMonitoringProps {
    landlordId: string
}

export function TenantMonitoring({ landlordId }: TenantMonitoringProps) {
    const [tenants, setTenants] = useState<TenantData[]>([])
    const [loading, setLoading] = useState(true)

    const fetchTenants = useCallback(async (signal?: AbortSignal) => {
        setLoading(true)

        try {
            let query = supabase
                .from('rentals')
                .select(`
                    tenant_id,
                    rent_amount,
                    status,
                    property:properties!inner (
                        title,
                        landlord_id
                    ),
                    bills (
                        payments (amount, status, created_at)
                    ),
                    tenant:profiles!rentals_tenant_id_fkey (
                        name,
                        fullname
                    )
                `)
                .eq('properties.landlord_id', landlordId)
                .eq('status', 'approved')

            if (signal) {
                query = query.abortSignal(signal)
            }

            const { data, error } = await query

            if (error) {
                if (!signal?.aborted) {
                    console.error('Error fetching tenants:', error)
                }
            } else if (!signal?.aborted && data) {
                // Transform data to flatten payments from bills
                const formattedData = data.map((rental: any) => ({
                    ...rental,
                    payments: rental.bills?.flatMap((bill: any) => bill.payments || []) || []
                }))
                setTenants(formattedData as unknown as TenantData[])
            }
        } catch (error) {
            if (!signal?.aborted) {
                console.error('Error in fetchTenants:', error)
            }
        } finally {
            if (!signal?.aborted) {
                setLoading(false)
            }
        }
    }, [landlordId])

    useEffect(() => {
        const controller = new AbortController()
        if (landlordId) {
            fetchTenants(controller.signal)

            const channel = supabase
                .channel('tenant-monitoring-changes')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'rentals',
                    },
                    () => fetchTenants(controller.signal)
                )
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'payments',
                    },
                    () => fetchTenants(controller.signal)
                )
                .subscribe()

            return () => {
                controller.abort()
                supabase.removeChannel(channel)
            }
        }
    }, [landlordId, fetchTenants])

    if (loading) {
        return (
            <Card>
                <CardHeader><CardTitle>Tenant Monitoring</CardTitle></CardHeader>
                <CardContent>Loading tenants...</CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Tenant Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
                {/* Mobile card view */}
                <div className="md:hidden space-y-3">
                    {tenants.length === 0 ? (
                        <p className="text-center py-6 text-muted-foreground">No active tenants found.</p>
                    ) : (
                        tenants.map((t, idx) => {
                            const totalPaid = t.payments?.reduce(
                                (sum, p) => p.status === 'success' ? sum + p.amount : sum,
                                0
                            ) || 0;
                            const lastPayment = t.payments?.length > 0
                                ? new Date(t.payments[t.payments.length - 1].created_at).toLocaleDateString()
                                : '-';
                            return (
                                <div key={`${t.tenant_id}-${idx}`} className="p-4 rounded-xl border bg-card space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-sm">{t.tenant?.fullname || t.tenant?.name || t.tenant_id}</span>
                                        <span className="text-xs font-bold text-emerald-600">₦{totalPaid.toLocaleString()}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate">{t.property?.title}</p>
                                    <p className="text-xs text-muted-foreground">Last payment: {lastPayment}</p>
                                </div>
                            )
                        })
                    )}
                </div>
                {/* Desktop table */}
                <div className="hidden md:block">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tenant</TableHead>
                                <TableHead>Property</TableHead>
                                <TableHead>Rent Paid</TableHead>
                                <TableHead>Last Payment</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tenants.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center">No active tenants found.</TableCell>
                                </TableRow>
                            ) : (
                                tenants.map((t, idx) => {
                                    const totalPaid = t.payments?.reduce(
                                        (sum, p) => p.status === 'success' ? sum + p.amount : sum,
                                        0
                                    ) || 0;

                                    const lastPayment = t.payments?.length > 0
                                        ? new Date(t.payments[t.payments.length - 1].created_at).toLocaleDateString()
                                        : '-';

                                    return (
                                        <TableRow key={`${t.tenant_id}-${idx}`}>
                                            <TableCell className="font-medium">{t.tenant?.fullname || t.tenant?.name || t.tenant_id}</TableCell>
                                            <TableCell>{t.property?.title}</TableCell>
                                            <TableCell>₦{totalPaid.toLocaleString()}</TableCell>
                                            <TableCell>{lastPayment}</TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
