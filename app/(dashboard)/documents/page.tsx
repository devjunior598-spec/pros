"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { LandlordDocumentsView } from "@/components/landlord/landlord-documents-view"
import { DocumentManager } from "@/components/document-manager"
import { Loader2 } from "lucide-react"

export default function DocumentsPage() {
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true
        const fetchData = async (signal: AbortSignal) => {
            setLoading(true)
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (user && !signal.aborted) {
                    setUser(user)
                    const { data: profileData } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', user.id)
                        .single()

                    if (!signal.aborted) {
                        setProfile(profileData)
                    }
                }
            } catch (error) {
                if (!signal.aborted) {
                    console.error("Error fetching documents data:", error)
                }
            } finally {
                if (!signal.aborted) {
                    setLoading(false)
                }
            }
        }
        fetchData()
        return () => mounted = false
    }, [])

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    if (!user) return <div>Please log in to view documents.</div>

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Documents</h1>
                <p className="text-muted-foreground">Access and manage all your property documents and agreements.</p>
            </div>

            {profile?.role === 'landlord' ? (
                <LandlordDocumentsView landlordId={user.id} />
            ) : (
                <DocumentManager tenantId={user.id} />
            )}
        </div>
    )
}
