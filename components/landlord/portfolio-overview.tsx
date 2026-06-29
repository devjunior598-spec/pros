"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, Home } from "lucide-react"

interface PortfolioProperty {
    id: string
    title: string
    monthly_rent: number
    status: string
    active_tenants: number
}

interface PortfolioOverviewProps {
    landlordId: string
}

export function PortfolioOverview({ landlordId }: PortfolioOverviewProps) {
    const [properties, setProperties] = useState<PortfolioProperty[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true

        const fetchPortfolio = async () => {
            if (!landlordId) {
                setLoading(false)
                return
            }
            try {
                // Fetch properties with rentals to calculate active tenants
                const { data, error } = await supabase
                    .from('properties')
                    .select(`
                        id,
                        title,
                        monthly_rent:price,
                        status,
                        rentals (
                            id,
                            status
                        )
                    `)
                    .eq('landlord_id', landlordId)
                    .order('created_at', { ascending: false })
                    .limit(5)

                if (error) throw error

                if (data && mounted) {
                    const formatted = data.map((prop: any) => ({
                        ...prop,
                        active_tenants: prop.rentals?.filter((r: any) => r.status === 'approved' || r.status === 'active').length || 0
                    }))
                    setProperties(formatted)
                }
            } catch (err: any) {
                if (err?.name === 'AbortError' || err?.message?.includes('Fetch is aborted') || err?.message?.includes('signal is aborted') || err?.message?.includes('aborted')) return
                console.error("Error fetching portfolio:", err?.message || JSON.stringify(err) || err)
            } finally {
                if (mounted) {
                    setLoading(false)
                }
            }
        }

        fetchPortfolio()

        return () => {
            mounted = false
        }
    }, [landlordId])

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[250px]">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (properties.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[250px] text-muted-foreground">
                <Home className="h-10 w-10 mb-2 opacity-20" />
                <p>No properties found in your portfolio.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {properties.map(property => (
                <div key={property.id} className="flex items-center justify-between p-3 bg-muted/40 rounded-lg hover:bg-muted/60 transition-colors">
                    <div className="space-y-1">
                        <p className="font-medium text-sm">{property.title}</p>
                        <p className="text-xs text-muted-foreground flex items-center">
                            <span className="w-2 h-2 rounded-full mr-2 bg-blue-500"></span>
                            {property.active_tenants} Active Tenant{property.active_tenants !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="font-semibold text-sm">₦{property.monthly_rent?.toLocaleString() || 0}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">{property.status}</p>
                    </div>
                </div>
            ))}
        </div>
    )
}
