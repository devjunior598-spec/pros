"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { RoleGuard } from "@/components/role-guard"
import { PropertyTable } from "@/components/landlord/property-table"
import { Plus, Building2 } from "lucide-react"

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
                    <div className="h-8 w-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                    <p className="text-sm text-slate-400">Loading your portfolio…</p>
                </div>
            </div>
        )
    }

    if (!landlordId) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <p className="text-slate-400">Please log in to view your properties.</p>
            </div>
        )
    }

    return (
        <RoleGuard allowedRoles={["landlord"]}>
            <div className="flex-1 space-y-6 p-6 md:p-8 pt-6">
                {/* Page header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 border border-blue-500/20">
                            <Building2 className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-100">Properties</h1>
                            <p className="text-sm text-slate-400">Manage your rental portfolio</p>
                        </div>
                    </div>

                    <Link
                        href="/properties/new"
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all duration-150 hover:shadow-blue-500/30"
                    >
                        <Plus className="h-4 w-4" />
                        Add Property
                    </Link>
                </div>

                {/* Main table / card grid */}
                <PropertyTable landlordId={landlordId} />
            </div>
        </RoleGuard>
    )
}
