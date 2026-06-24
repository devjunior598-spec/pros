"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function PropertiesNewRedirectPage() {
    const router = useRouter()
    useEffect(() => {
        router.replace("/dashboard/landlord/properties/new")
    }, [router])

    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                <p className="text-sm text-slate-400">Redirecting to landlord properties form...</p>
            </div>
        </div>
    )
}
