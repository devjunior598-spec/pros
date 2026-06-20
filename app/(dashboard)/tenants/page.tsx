"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { RoleGuard } from "@/components/role-guard"
import { TenantMonitoring } from "@/components/landlord/tenant-monitoring"

export default function TenantsPage() {
    const [landlordId, setLandlordId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

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

    if (loading) return <div>Loading...</div>
    if (!landlordId) return <div>Please log in to view tenants.</div>

    return (
        <RoleGuard allowedRoles={['landlord']}>
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Tenants</h2>
                </div>
                <TenantMonitoring landlordId={landlordId} />
            </div>
        </RoleGuard>
    )
}
