"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { generateLeasePDF } from "@/lib/lease-pdf-generator"
import {
    FileText,
    Plus,
    Loader2,
    Calendar,
    Building2,
    CheckCircle,
    Clock,
    Download,
    Send,
    Eye,
    PenTool,
    ArrowLeft,
    Trash2
} from "lucide-react"

export default function LeasesHubPage() {
    const router = useRouter()
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState<any>(null)
    const [leases, setLeases] = useState<any[]>([])
    const [sendingId, setSendingId] = useState<string | null>(null)

    const fetchLeases = useCallback(async () => {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push("/login")
                return
            }

            // 1. Fetch Profile
            const { data: prof } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single()
            setProfile(prof)

            // 2. Fetch Leases based on role
            let query = supabase
                .from("lease_agreements")
                .select(`
                    *, 
                    property:properties(title, address), 
                    tenant:profiles!tenant_id(name, email, phone, fullname), 
                    landlord:profiles!landlord_id(name, email, phone, fullname),
                    signatures:lease_signatures(*)
                `)
                .order("created_at", { ascending: false })

            if (prof.role === "landlord") {
                query = query.eq("landlord_id", user.id)
            } else if (prof.role === "tenant") {
                query = query.eq("tenant_id", user.id)
            }

            const { data, error } = await query
            if (error) throw error
            setLeases(data || [])

        } catch (error: any) {
            console.error("Error fetching leases:", error)
            toast({ title: "Fetch Error", description: "Failed to load lease agreements.", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }, [router, toast])

    useEffect(() => {
        fetchLeases()
    }, [fetchLeases])

    const handleSendLease = async (leaseId: string) => {
        setSendingId(leaseId)
        try {
            const res = await fetch("/api/leases/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ leaseId })
            })

            const result = await res.json()
            if (!res.ok) throw new Error(result.error || "Failed to send lease")

            toast({ title: "Lease Sent!", description: "Agreement successfully sent to tenant for signing." })
            fetchLeases()
        } catch (error: any) {
            console.error(error)
            alert(error.message || "Failed to send lease.")
        } finally {
            setSendingId(null)
        }
    }

    const handleDownloadPDF = (lease: any) => {
        try {
            toast({ title: "Generating PDF...", description: "Preparing lease agreement document." })
            const doc = generateLeasePDF({
                title: lease.title,
                templateType: lease.template_type,
                landlordName: lease.landlord?.fullname || lease.landlord?.name || 'Landlord',
                landlordEmail: lease.landlord?.email || '',
                landlordPhone: lease.landlord?.phone || '',
                tenantName: lease.tenant?.fullname || lease.tenant?.name || 'Tenant',
                tenantEmail: lease.tenant?.email || '',
                tenantPhone: lease.tenant?.phone || '',
                propertyName: lease.property?.title || 'Property',
                propertyAddress: lease.property?.address || '',
                rentAmount: Number(lease.rent_amount),
                paymentFrequency: lease.payment_frequency,
                securityDeposit: Number(lease.security_deposit),
                startDate: lease.start_date,
                endDate: lease.end_date,
                houseRules: lease.house_rules || [],
                termsAndConditions: lease.terms_and_conditions,
                signatures: lease.signatures || [],
                status: lease.status
            })
            doc.save(`Lease-${lease.title.replace(/\s+/g, "_")}.pdf`)
        } catch (error) {
            console.error(error)
            toast({ title: "Export Failed", description: "Failed to compile lease PDF.", variant: "destructive" })
        }
    }

    const handleDeleteLease = async (leaseId: string) => {
        if (!confirm("Are you sure you want to delete this lease agreement draft?")) return

        try {
            const { error } = await supabase
                .from("lease_agreements")
                .delete()
                .eq("id", leaseId)

            if (error) throw error
            toast({ title: "Lease Deleted", description: "Draft agreement deleted successfully." })
            fetchLeases()
        } catch (error: any) {
            console.error(error)
            alert("Failed to delete lease agreement.")
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            </div>
        )
    }

    const isLandlord = profile?.role === "landlord"

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 pb-20">
            <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 p-4 sm:p-6 md:p-8">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
                            <FileText className="h-7 w-7 text-blue-500" /> Lease Agreements
                        </h1>
                        <p className="text-sm text-slate-550 dark:text-slate-400">
                            {isLandlord 
                                ? "Draft, review, sign, and store digital lease contracts for your rental portfolio." 
                                : "Review, sign, and download your legal lease agreements."
                            }
                        </p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        {isLandlord && (
                            <Link href="/dashboard/leases/new" className="flex-1 sm:flex-none">
                                <Button className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold min-h-[44px] shadow-lg shadow-blue-600/15">
                                    <Plus className="h-4 w-4 mr-2" /> Create Agreement
                                </Button>
                            </Link>
                        )}
                        <Button 
                            variant="ghost" 
                            onClick={() => router.push("/dashboard")} 
                            className="rounded-xl font-bold min-h-[44px]"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" /> Back
                        </Button>
                    </div>
                </div>

                {/* Leases Queue Grid */}
                <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md rounded-2xl overflow-hidden">
                    <CardHeader className="border-b">
                        <CardTitle className="text-base font-extrabold">Active Leases</CardTitle>
                        <CardDescription>Your platform digital lease records.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {leases.length === 0 ? (
                            <div className="text-center py-16 px-4 space-y-3">
                                <FileText className="h-12 w-12 text-slate-300 mx-auto" />
                                <p className="text-sm font-semibold text-slate-550 dark:text-slate-400">No lease agreements found.</p>
                                {isLandlord && (
                                    <p className="text-xs text-slate-400">Click "Create Agreement" to draft your first lease contract.</p>
                                )}
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                {leases.map((lease) => {
                                    const isDraft = lease.status === "Draft"
                                    const isSent = lease.status === "Sent"
                                    const isFullySigned = lease.status === "Fully Signed"
                                    
                                    // Check signature statuses
                                    const landlordSigned = lease.signatures?.some((s: any) => s.role === "landlord")
                                    const tenantSigned = lease.signatures?.some((s: any) => s.role === "tenant")
                                    
                                    const mySigSigned = isLandlord ? landlordSigned : tenantSigned
                                    const needMySignature = (isSent || lease.status === "Tenant Signed" || lease.status === "Landlord Signed") && !mySigSigned

                                    return (
                                        <div key={lease.id} className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                                            <div className="space-y-1.5 flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h4 className="font-extrabold text-sm truncate max-w-[250px]">
                                                        {lease.title}
                                                    </h4>
                                                    <Badge className={`text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-lg border ${
                                                        isFullySigned ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" :
                                                        isDraft ? "bg-slate-100 border-slate-200 text-slate-600" :
                                                        "bg-yellow-500/10 border-yellow-500/20 text-yellow-600"
                                                    }`}>
                                                        {lease.status}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                                                    <Building2 className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                                                    {lease.property?.title || "Property"} - {lease.property?.address}
                                                </p>
                                                <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold flex-wrap">
                                                    <span>Rent: ₦{Number(lease.rent_amount).toLocaleString()} / {lease.payment_frequency}</span>
                                                    <span>•</span>
                                                    <span>Term: {new Date(lease.start_date).toLocaleDateString()} to {new Date(lease.end_date).toLocaleDateString()}</span>
                                                    <span>•</span>
                                                    <span>
                                                        {isLandlord 
                                                            ? `Tenant: ${lease.tenant?.fullname || lease.tenant?.name || "Unassigned"}`
                                                            : `Landlord: ${lease.landlord?.fullname || lease.landlord?.name || "Lessor"}`
                                                        }
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Action panel */}
                                            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                                                
                                                {/* View / Sign page link */}
                                                <Link href={`/dashboard/leases/${lease.id}`} className="flex-1 md:flex-none">
                                                    <Button variant="outline" className="w-full rounded-xl font-bold min-h-[38px] text-xs px-3">
                                                        <Eye className="h-3.5 w-3.5 mr-1" /> View Lease
                                                    </Button>
                                                </Link>

                                                {/* Sign Trigger */}
                                                {needMySignature && (
                                                    <Link href={`/dashboard/leases/${lease.id}`} className="flex-1 md:flex-none">
                                                        <Button className="w-full rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold min-h-[38px] text-xs px-3 shadow-md shadow-orange-500/10">
                                                            <PenTool className="h-3.5 w-3.5 mr-1" /> Sign Agreement
                                                        </Button>
                                                    </Link>
                                                )}

                                                {/* Send (Landlord draft only) */}
                                                {isLandlord && isDraft && (
                                                    <Button
                                                        onClick={() => handleSendLease(lease.id)}
                                                        disabled={sendingId === lease.id}
                                                        className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold min-h-[38px] text-xs px-3 flex-1 md:flex-none shadow-md shadow-blue-600/10"
                                                    >
                                                        {sendingId === lease.id ? (
                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <Send className="h-3.5 w-3.5 mr-1" /> Send to Tenant
                                                            </>
                                                        )}
                                                    </Button>
                                                )}

                                                {/* Download (If signed or fully complete) */}
                                                {(isFullySigned || lease.signatures?.length > 0) && (
                                                    <Button
                                                        onClick={() => handleDownloadPDF(lease)}
                                                        variant="outline"
                                                        className="rounded-xl border-slate-200 hover:bg-slate-50 font-bold min-h-[38px] text-xs px-3 flex-1 md:flex-none"
                                                    >
                                                        <Download className="h-3.5 w-3.5 mr-1 text-slate-500" /> PDF
                                                    </Button>
                                                )}

                                                {/* Delete draft */}
                                                {isLandlord && isDraft && (
                                                    <Button
                                                        onClick={() => handleDeleteLease(lease.id)}
                                                        variant="ghost"
                                                        className="rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 h-9 w-9 p-0"
                                                        title="Delete Draft"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}

                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>
        </div>
    )
}
