"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { RoleGuard } from "@/components/role-guard"
import { PropertyTable } from "@/components/landlord/property-table"
import { PageHeader } from "@/components/page-header"
import { Plus, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function PropertiesPage() {
    const [landlordId, setLandlordId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const controller = new AbortController()
        const fetchUser = async (signal: AbortSignal) => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user && !signal.aborted) setLandlordId(user.id)
            if (!signal.aborted) setLoading(false)
        }
        fetchUser(controller.signal)
        return () => controller.abort()
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading your portfolio…</p>
                </div>
            </div>
        )
    }

    if (!landlordId) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <p className="text-muted-foreground">Please log in to view your properties.</p>
            </div>
        )
    }

    return (
        <RoleGuard allowedRoles={["landlord"]}>
            <div className="flex-1 space-y-6">
                <PageHeader
                    title="Properties"
                    description="Manage your rental portfolio"
                    icon={Building2}
                >
                    <Link href="/dashboard/landlord/properties/new">
                        <Button className="w-full sm:w-auto min-h-[44px] rounded-lg">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Property
                        </Button>
                    </Link>
                </PageHeader>

                <PropertyTable landlordId={landlordId} />
            </div>
        </RoleGuard>
    )
}
