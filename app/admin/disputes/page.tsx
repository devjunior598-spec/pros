"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    AlertCircle,
    CheckCircle,
    User,
    Search,
    ChevronRight,
    Scale,
    Loader2,
    RefreshCw,
    MessageSquare,
    CheckCircle2
} from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

type Dispute = {
    id: string
    title: string
    description?: string
    status: "pending" | "investigating" | "resolved" | "closed"
    priority: "low" | "medium" | "high"
    created_at: string
    resolution_notes?: string
    party1?: { id: string; name: string; full_name: string; email: string; role: string }
    party2?: { id: string; name: string; full_name: string; email: string; role: string }
}

export default function AdminDisputesPage() {
    const { toast } = useToast()
    const [searchTerm, setSearchTerm] = useState("")
    const [disputes, setDisputes] = useState<Dispute[]>([])
    const [loading, setLoading] = useState(true)

    // Modal state
    const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null)
    const [resolutionNotes, setResolutionNotes] = useState("")
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

    const fetchDisputes = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/admin/disputes")
            const data = await res.json()
            setDisputes(data.disputes || [])
        } catch (error) {
            console.error("Error fetching disputes:", error)
            toast({ title: "Fetch Error", description: "Could not load disputes", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }, [toast])

    useEffect(() => {
        fetchDisputes()
    }, [fetchDisputes])

    const handleUpdateStatus = async (status: "investigating" | "resolved" | "closed") => {
        if (!selectedDispute) return
        setUpdatingStatus(status)
        try {
            const res = await fetch("/api/admin/disputes", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: selectedDispute.id,
                    status,
                    resolution_notes: resolutionNotes,
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed to update dispute")

            toast({ title: "Dispute Updated", description: data.message })
            setSelectedDispute(null)
            setResolutionNotes("")
            fetchDisputes()
        } catch (error: any) {
            toast({ title: "Update Failed", description: error.message, variant: "destructive" })
        } finally {
            setUpdatingStatus(null)
        }
    }

    const activeDisputesCount = disputes.filter(
        (d) => d.status === "pending" || d.status === "investigating"
    ).length

    const filteredDisputes = disputes.filter((d) => {
        const titleMatch = d.title?.toLowerCase().includes(searchTerm.toLowerCase())
        const p1Match = (d.party1?.name || d.party1?.full_name || "").toLowerCase().includes(searchTerm.toLowerCase())
        const p2Match = (d.party2?.name || d.party2?.full_name || "").toLowerCase().includes(searchTerm.toLowerCase())
        return titleMatch || p1Match || p2Match
    })

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Disputes & Arbitration</h1>
                    <p className="text-muted-foreground">Moderate and resolve conflicts between platform landlords and tenants.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search disputes by title or party..."
                            className="pl-10 rounded-xl bg-white dark:bg-gray-950 border-none shadow-sm focus:ring-2 ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" size="icon" onClick={fetchDisputes} className="rounded-xl shrink-0">
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border-none shadow-sm bg-gradient-to-br from-red-600 to-red-700 text-white">
                    <CardContent className="p-6">
                        <Scale className="h-6 w-6 mb-2 opacity-80" />
                        <div className="text-3xl font-bold">
                            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : activeDisputesCount}
                        </div>
                        <div className="text-xs opacity-90 mt-1">Active Unresolved Conflicts</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-sm bg-white dark:bg-gray-950">
                <CardHeader>
                    <CardTitle>Arbitration Queue</CardTitle>
                    <CardDescription>Review claims, assign investigation notes, and finalize resolutions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {loading ? (
                            <div className="flex justify-center p-12">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                            </div>
                        ) : filteredDisputes.length === 0 ? (
                            <div className="text-center p-12 text-muted-foreground italic">No platform disputes found.</div>
                        ) : (
                            filteredDisputes.map((dispute) => (
                                <div
                                    key={dispute.id}
                                    onClick={() => {
                                        setSelectedDispute(dispute)
                                        setResolutionNotes(dispute.resolution_notes || "")
                                    }}
                                    className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl group hover:shadow-md transition-all cursor-pointer border border-transparent hover:border-blue-500/20"
                                >
                                    <div className="flex gap-4 items-start">
                                        <div className="h-12 w-12 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm shrink-0">
                                            {dispute.status === "resolved" || dispute.status === "closed" ? (
                                                <CheckCircle className="h-6 w-6 text-green-500" />
                                            ) : (
                                                <AlertCircle className="h-6 w-6 text-red-500" />
                                            )}
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-gray-900 dark:text-gray-100">
                                                    {dispute.title}
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[10px] h-4 py-0 uppercase ${
                                                        dispute.priority === "high"
                                                            ? "border-red-200 text-red-600 bg-red-50"
                                                            : "border-orange-200 text-orange-600 bg-orange-50"
                                                    }`}
                                                >
                                                    {dispute.priority || "normal"}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                                <span className="flex items-center gap-1 font-medium">
                                                    <User className="h-3 w-3" />{" "}
                                                    {dispute.party1?.name || dispute.party1?.full_name || "Applicant"}
                                                </span>
                                                <span className="opacity-40">vs</span>
                                                <span className="flex items-center gap-1 font-medium">
                                                    <User className="h-3 w-3" />{" "}
                                                    {dispute.party2?.name || dispute.party2?.full_name || "Respondent"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 mt-4 md:mt-0">
                                        <div className="flex flex-col items-end">
                                            <Badge variant="secondary" className="bg-white dark:bg-gray-800 capitalize mb-1">
                                                {dispute.status}
                                            </Badge>
                                            <span className="text-[10px] text-muted-foreground font-mono">
                                                {new Date(dispute.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <Button size="sm" variant="ghost" className="rounded-xl">
                                            Manage <ChevronRight className="h-4 w-4 ml-1" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Arbitration Modal */}
            <Dialog open={!!selectedDispute} onOpenChange={(open) => !open && setSelectedDispute(null)}>
                <DialogContent className="max-w-lg rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl">Review Dispute</DialogTitle>
                        <DialogDescription>{selectedDispute?.title}</DialogDescription>
                    </DialogHeader>

                    {selectedDispute && (
                        <div className="space-y-4 py-2 text-sm">
                            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl space-y-1">
                                <div className="text-xs text-muted-foreground font-semibold">Parties Involved</div>
                                <div className="text-sm font-bold">
                                    {selectedDispute.party1?.name || selectedDispute.party1?.full_name || "Party 1"} vs{" "}
                                    {selectedDispute.party2?.name || selectedDispute.party2?.full_name || "Party 2"}
                                </div>
                            </div>

                            {selectedDispute.description && (
                                <div>
                                    <div className="text-xs text-muted-foreground font-semibold mb-1">Claim Details</div>
                                    <p className="text-xs bg-muted/40 p-3 rounded-xl">{selectedDispute.description}</p>
                                </div>
                            )}

                            <div>
                                <div className="text-xs text-muted-foreground font-semibold mb-1">Admin Arbitration Notes</div>
                                <Textarea
                                    rows={3}
                                    placeholder="Enter findings, mediation summary, or decision rationale..."
                                    value={resolutionNotes}
                                    onChange={(e) => setResolutionNotes(e.target.value)}
                                    className="rounded-xl text-xs"
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex flex-col sm:flex-row gap-2">
                        <Button
                            variant="outline"
                            onClick={() => handleUpdateStatus("investigating")}
                            disabled={!!updatingStatus}
                            className="rounded-xl text-xs"
                        >
                            {updatingStatus === "investigating" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Mark Investigating"}
                        </Button>
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs gap-1"
                            onClick={() => handleUpdateStatus("resolved")}
                            disabled={!!updatingStatus}
                        >
                            {updatingStatus === "resolved" ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4" /> Mark Resolved</>}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
