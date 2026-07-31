"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export function DashboardGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const { user, loading } = useAuth()

    useEffect(() => {
        if (!loading && !user) {
            router.replace("/login")
        }
    }, [loading, router, user])

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!user) return null

    return <>{children}</>
}
