"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { RoleGuard } from "@/components/role-guard"
import { TenantMonitoring } from "@/components/landlord/tenant-monitoring"
import { Loader2, Users } from "lucide-react"

export default function TenantsPage() {
    const [landlordId, setLandlordId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user && mounted) setLandlordId(user.id)
            if (mounted) setLoading(false)
        }
        fetchUser()
        return () => { mounted = false }
    }, [])

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <p className="text-sm text-muted-foreground">Loading tenants…</p>
                </div>
            </div>
        )
    }

    if (!landlordId) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <div className="text-center">
                    <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">Please log in to view your tenants.</p>
                </div>
            </div>
        )
    }

    return (
        <RoleGuard allowedRoles={['landlord']}>
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center">
                        <Users className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Tenants</h1>
                        <p className="text-muted-foreground text-sm">Monitor and manage your active tenants.</p>
                    </div>
                </div>
                <TenantMonitoring landlordId={landlordId} />
            </div>
        </RoleGuard>
    )
}
