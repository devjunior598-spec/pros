"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

interface RoleGuardProps {
    children: React.ReactNode
    allowedRoles: string[]
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [isAuthorized, setIsAuthorized] = useState(false)

    useEffect(() => {
        const checkRole = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()

                if (!user) {
                    router.push("/login")
                    return
                }

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single()

                if (profile && allowedRoles.includes(profile.role)) {
                    setIsAuthorized(true)
                } else {
                    router.push("/dashboard") // Redirect to main dashboard if not authorized
                }
            } catch (error) {
                console.error("Role check failed", error)
                router.push("/dashboard")
            } finally {
                setIsLoading(false)
            }
        }

        checkRole()
    }, [router, allowedRoles])

    if (isLoading) {
        return (
            <div className="flex h-[400px] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!isAuthorized) {
        return null // Should be redirected by now
    }

    return <>{children}</>
}
