"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface RoleGuardProps {
    children: React.ReactNode
    allowedRoles: string[]
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
    const router = useRouter()
    const { user, profile, loading } = useAuth()
    const allowedRolesKey = allowedRoles.join(",")
    const isAuthorized = Boolean(profile && allowedRoles.includes(profile.role))

    useEffect(() => {
        if (loading) return

        if (!user) {
            router.replace("/login")
        } else if (!isAuthorized) {
            router.replace("/dashboard")
        }
    }, [allowedRolesKey, isAuthorized, loading, router, user])

    if (loading) {
        return (
            <div className="flex h-[400px] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!user || !isAuthorized) return null

    return <>{children}</>
}
