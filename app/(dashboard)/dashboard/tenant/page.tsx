"use client"

import { useEffect, Suspense } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { TenantDashboard } from "@/components/tenant/tenant-dashboard"
import { Activity } from "lucide-react"

function TenantDashboardContent() {
    const router = useRouter()
    const { user: ctxUser, profile: ctxProfile, loading: ctxLoading } = useAuth()

    useEffect(() => {
        if (ctxLoading) return

        if (!ctxUser || ctxProfile?.role !== "tenant") {
            router.replace("/login")
        }
    }, [ctxLoading, ctxUser, ctxProfile, router])

    if (ctxLoading || !ctxUser || ctxProfile?.role !== "tenant") {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Activity className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
            <TenantDashboard userId={ctxUser.id} />
        </div>
    )
}

export default function TenantDashboardPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-12"><Activity className="h-8 w-8 animate-spin text-blue-600" /></div>}>
            <TenantDashboardContent />
        </Suspense>
    )
}
