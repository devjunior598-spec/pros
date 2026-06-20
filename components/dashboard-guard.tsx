"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

export function DashboardGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                if (!session) {
                    router.push("/login")
                } else {
                    setIsLoading(false)
                }
            } catch (error) {
                console.error("Auth check failed", error)
                router.push("/login")
            }
        }

        checkAuth()

        // Optional: Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT' || !session) {
                router.push("/login")
            }
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [router])

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return <>{children}</>
}
