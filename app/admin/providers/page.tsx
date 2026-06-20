"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Briefcase,
    Star,
    CheckCircle,
    XCircle,
    Search,
    Award,
    Settings,
    Loader2,
    MapPin,
    User,
    Plus
} from "lucide-react"
import { Input } from "@/components/ui/input"

export default function AdminProvidersPage() {
    const [providers, setProviders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    const fetchProviders = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('service_providers')
                .select(`
                    *,
                    user:profiles (name, email)
                `)
                .order('created_at', { ascending: false })

            if (error) throw error
            setProviders(data || [])
        } catch (error) {
            console.error("Error fetching providers:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchProviders()
    }, [])

    const filtered = providers.filter(p =>
        p.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Service Provider Registry</h1>
                    <p className="text-muted-foreground">Manage professional categories and platform expertise.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2 rounded-xl">
                        <Settings className="h-4 w-4" /> Categories
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl gap-2">
                        <Plus className="h-4 w-4" /> Add Provider
                    </Button>
                </div>
            </div>

            <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                    placeholder="Search providers by name or trade..."
                    className="pl-10 rounded-xl bg-white dark:bg-gray-950 border-none shadow-sm h-12 focus:ring-2 ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="col-span-full py-10 text-center text-muted-foreground italic">
                        No service providers found matching your search.
                    </div>
                ) : (
                    filtered.map((provider) => (
                        <Card key={provider.id} className="border-none shadow-sm bg-white dark:bg-gray-950 overflow-hidden hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex flex-col items-center text-center">
                                    <div className="h-16 w-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4 relative">
                                        <Briefcase className="h-8 w-8 text-blue-600" />
                                        {provider.approval_status === 'approved' && (
                                            <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-950 rounded-full p-0.5">
                                                <CheckCircle className="h-4 w-4 text-green-500 bg-white dark:bg-gray-900 rounded-full" />
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="font-bold text-lg leading-tight mb-1">{provider.user?.name}</h3>
                                    <Badge variant="secondary" className="mb-4 bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-50">{provider.category}</Badge>

                                    <div className="grid grid-cols-2 w-full gap-4 pt-4 border-t text-sm">
                                        <div className="flex flex-col items-center gap-1">
                                            <Award className="h-4 w-4 text-orange-500" />
                                            <span className="font-bold">{provider.experience_years}y Exp</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-1">
                                            <Star className="h-4 w-4 text-yellow-500" />
                                            <span className="font-bold">4.8 Rating</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4 mb-6">
                                        <MapPin className="h-3 w-3" />
                                        <span>Lagos, Nigeria</span>
                                    </div>

                                    <Button variant="outline" className="w-full rounded-xl border-gray-200 hover:bg-gray-50 flex items-center gap-2">
                                        View Portfolio <Plus className="h-3 w-3" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
