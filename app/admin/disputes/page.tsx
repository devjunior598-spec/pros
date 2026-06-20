"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    AlertCircle,
    CheckCircle,
    User,
    Search,
    ChevronRight,
    Scale,
    Loader2
} from "lucide-react"
import { Input } from "@/components/ui/input"

export default function AdminDisputesPage() {
    const [searchTerm, setSearchTerm] = useState("")
    const [disputes, setDisputes] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchDisputes = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('disputes')
                .select(`
                    *,
                    party1:profiles!disputes_party1_id_fkey(name, role),
                    party2:profiles!disputes_party2_id_fkey(name, role)
                `)
                .order('created_at', { ascending: false })

            if (error) throw error
            setDisputes(data || [])
        } catch (error) {
            console.error("Error fetching disputes:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDisputes()
    }, [])

    const activeDisputes = disputes.filter(d => d.status === 'pending' || d.status === 'investigating').length

    const filteredDisputes = disputes.filter(d =>
        d.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.party1?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.party2?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Disputes Center</h1>
                    <p className="text-muted-foreground">Moderate and resolve conflicts between platform users.</p>
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search disputes..."
                        className="pl-10 rounded-xl bg-white dark:bg-gray-950 border-none shadow-sm focus:ring-2 ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border-none shadow-sm bg-red-600 text-white">
                    <CardContent className="p-6">
                        <Scale className="h-6 w-6 mb-2 opacity-80" />
                        <div className="text-2xl font-bold">{loading ? <Loader2 className="h-6 w-6 animate-spin" /> : `${activeDisputes} Active`}</div>
                        <div className="text-xs opacity-80">Unresolved Disputes</div>
                    </CardContent>
                </Card>
                {/* Other stats... */}
            </div>

            <Card className="border-none shadow-sm bg-white dark:bg-gray-950">
                <CardHeader>
                    <CardTitle>Conflict Queue</CardTitle>
                    <CardDescription>Review and arbitrate platform disputes.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {loading ? (
                            <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
                        ) : filteredDisputes.length === 0 ? (
                            <div className="text-center p-8 text-muted-foreground italic">No disputes found.</div>
                        ) : (
                            filteredDisputes.map((dispute) => (
                                <div key={dispute.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl group hover:shadow-md transition-all cursor-pointer border border-transparent hover:border-blue-500/20">
                                    <div className="flex gap-4">
                                        <div className="h-12 w-12 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                                            {dispute.status === 'resolved' || dispute.status === 'closed' ? <CheckCircle className="h-6 w-6 text-green-500" /> : <AlertCircle className="h-6 w-6 text-red-500" />}
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-gray-900 dark:text-gray-100">{dispute.title}</span>
                                                <Badge variant="outline" className={`text-[10px] h-4 py-0 uppercase ${dispute.priority === 'high' ? 'border-red-200 text-red-600 bg-red-50' : 'border-orange-200 text-orange-600 bg-orange-50'}`}>{dispute.priority}</Badge>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                                <span className="flex items-center gap-1"><User className="h-3 w-3" /> {dispute.party1?.name || 'User'}</span>
                                                <span className="opacity-30">vs</span>
                                                <span className="flex items-center gap-1"><User className="h-3 w-3" /> {dispute.party2?.name || 'User'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 mt-4 md:mt-0">
                                        <div className="flex flex-col items-end">
                                            <Badge variant="secondary" className="bg-white dark:bg-gray-800 capitalize mb-1">{dispute.status}</Badge>
                                            <span className="text-[10px] text-muted-foreground">{new Date(dispute.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-white dark:hover:bg-gray-800">
                                            <ChevronRight className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="mt-8 pt-6 border-t text-center">
                        <Button variant="outline" className="rounded-xl px-10">Load More Disputes</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
