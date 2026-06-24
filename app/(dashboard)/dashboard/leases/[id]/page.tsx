"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { DigitalSignaturePad } from "@/components/leases/digital-signature-pad"
import { generateLeasePDF } from "@/lib/lease-pdf-generator"
import {
    FileText,
    ArrowLeft,
    Building2,
    Calendar,
    PenTool,
    Download,
    CheckCircle,
    User,
    Clock,
    Printer,
    FileCheck,
    AlertCircle,
    Shield,
    Loader2
} from "lucide-react"

export default function LeaseDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const { toast } = useToast()
    const leaseId = params.id as string

    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState<any>(null)
    const [lease, setLease] = useState<any>(null)
    const [signing, setSigning] = useState(false)

    const fetchLeaseDetails = useCallback(async () => {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push("/login")
                return
            }

            // 1. Fetch user profile
            const { data: prof } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single()
            setProfile(prof)

            // 2. Fetch lease agreement details
            const res = await fetch(`/api/leases/${leaseId}`)
            const result = await res.json()
            
            if (!res.ok) {
                throw new Error(result.error || "Failed to fetch lease details.")
            }
            setLease(result.lease)

        } catch (error: any) {
            console.error(error)
            toast({ title: "Fetch Error", description: error.message || "Failed to load lease.", variant: "destructive" })
            router.push("/dashboard/leases")
        } finally {
            setLoading(false)
        }
    }, [leaseId, router, toast])

    useEffect(() => {
        if (leaseId) {
            fetchLeaseDetails()
        }
    }, [leaseId, fetchLeaseDetails])

    const handleSignLease = async (sigData: { signatureType: "typed" | "drawn"; signatureValue: string }) => {
        if (!lease || !profile) return
        setSigning(true)

        try {
            const res = await fetch("/api/leases/sign", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    leaseId: lease.id,
                    userId: profile.id,
                    role: profile.role, // 'landlord' or 'tenant'
                    signerName: profile.fullname || profile.name || "Signer",
                    signatureType: sigData.signatureType,
                    signatureValue: sigData.signatureValue
                })
            })

            const result = await res.json()
            if (!res.ok) throw new Error(result.error || "Failed to apply signature")

            toast({ title: "Lease Signed Successfully!", description: "Signature applied and counterpart notified." })
            fetchLeaseDetails()
        } catch (error: any) {
            console.error(error)
            alert(error.message || "An error occurred while signing lease.")
        } finally {
            setSigning(false)
        }
    }

    const handleDownloadPDF = () => {
        if (!lease) return
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

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            </div>
        )
    }

    if (!lease || !profile) return null

    const isLandlord = profile.role === "landlord"
    const landlordSigned = lease.signatures?.some((s: any) => s.role === "landlord")
    const tenantSigned = lease.signatures?.some((s: any) => s.role === "tenant")

    const mySigSigned = isLandlord ? landlordSigned : tenantSigned
    // User can sign if lease status is not Draft, fully signed, cancelled, and they haven't signed yet
    const canSign = lease.status !== "Draft" && lease.status !== "Fully Signed" && lease.status !== "Cancelled" && !mySigSigned

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 pb-20">
            <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6 md:p-8">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                        <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
                            <FileText className="h-6 w-6 text-blue-500" /> Review Lease Agreement
                        </h1>
                        <p className="text-xs text-slate-500">Verify details and append digital signature.</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        {(lease.status === "Fully Signed" || lease.signatures?.length > 0) && (
                            <Button 
                                onClick={handleDownloadPDF} 
                                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold min-h-[44px] flex-1 sm:flex-none"
                            >
                                <Download className="h-4 w-4 mr-2" /> Download PDF
                            </Button>
                        )}
                        <Button 
                            variant="ghost" 
                            onClick={() => router.push("/dashboard/leases")} 
                            className="rounded-xl font-bold min-h-[44px]"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" /> Back
                        </Button>
                    </div>
                </div>

                {/* Main Details and Signature column */}
                <div className="grid gap-6 md:grid-cols-3">
                    
                    {/* Left: Complete Lease text */}
                    <div className="md:col-span-2 space-y-6">
                        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md rounded-2xl overflow-hidden">
                            <CardHeader className="border-b bg-slate-550/[0.01]">
                                <CardTitle className="text-lg font-black">{lease.title}</CardTitle>
                                <CardDescription>Lease Type: <span className="capitalize font-bold">{lease.template_type}</span></CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6 text-xs sm:text-sm">
                                
                                {/* Section 1: Parties */}
                                <div className="space-y-3">
                                    <h3 className="font-extrabold text-sm text-blue-600 dark:text-blue-400">1. Parties</h3>
                                    <div className="grid gap-3 sm:grid-cols-2 p-3 rounded-xl border bg-slate-50 dark:bg-slate-950/40">
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Landlord (Lessor)</p>
                                            <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{lease.landlord?.fullname || lease.landlord?.name}</p>
                                            <p className="text-[11px] text-slate-400 font-semibold">{lease.landlord?.email}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tenant (Lessee)</p>
                                            <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{lease.tenant?.fullname || lease.tenant?.name || "Unassigned"}</p>
                                            <p className="text-[11px] text-slate-400 font-semibold">{lease.tenant?.email}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Property */}
                                <div className="space-y-3">
                                    <h3 className="font-extrabold text-sm text-blue-600 dark:text-blue-400">2. Rented Property Details</h3>
                                    <div className="p-3 rounded-xl border bg-slate-50 dark:bg-slate-950/40 space-y-1">
                                        <p className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                            <Building2 className="h-4 w-4 text-blue-500" />
                                            {lease.property?.title}
                                        </p>
                                        <p className="text-[11px] text-slate-450 dark:text-slate-500 font-semibold">{lease.property?.address}</p>
                                    </div>
                                </div>

                                {/* Section 3: Financials */}
                                <div className="space-y-3">
                                    <h3 className="font-extrabold text-sm text-blue-600 dark:text-blue-400">3. Rents, Security & Term</h3>
                                    <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
                                        <div className="p-3.5 rounded-xl border bg-slate-50 dark:bg-slate-950/40">
                                            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Rent Price</span>
                                            <span className="font-black text-slate-900 dark:text-white mt-1 block">₦{Number(lease.rent_amount).toLocaleString()}</span>
                                        </div>
                                        <div className="p-3.5 rounded-xl border bg-slate-50 dark:bg-slate-950/40">
                                            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Frequency</span>
                                            <span className="font-black text-slate-900 dark:text-white mt-1 block capitalize">{lease.payment_frequency}</span>
                                        </div>
                                        <div className="p-3.5 rounded-xl border bg-slate-50 dark:bg-slate-950/40">
                                            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Deposit</span>
                                            <span className="font-black text-slate-900 dark:text-white mt-1 block">₦{Number(lease.security_deposit).toLocaleString()}</span>
                                        </div>
                                        <div className="p-3.5 rounded-xl border bg-slate-50 dark:bg-slate-950/40">
                                            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Duration</span>
                                            <span className="font-bold text-[11px] text-slate-600 dark:text-slate-350 mt-1.5 block">
                                                {new Date(lease.start_date).toLocaleDateString()} - {new Date(lease.end_date).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 4: House Rules */}
                                {lease.house_rules && lease.house_rules.length > 0 && (
                                    <div className="space-y-3">
                                        <h3 className="font-extrabold text-sm text-blue-600 dark:text-blue-400">4. House Rules Checklist</h3>
                                        <div className="space-y-1.5 pl-1.5">
                                            {lease.house_rules.map((rule: string, idx: number) => (
                                                <p key={idx} className="text-xs font-semibold text-slate-600 dark:text-slate-350 flex items-start gap-1.5">
                                                    <span className="text-blue-500 font-black flex-shrink-0">•</span>
                                                    {rule}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Section 5: Terms and Conditions */}
                                <div className="space-y-3">
                                    <h3 className="font-extrabold text-sm text-blue-600 dark:text-blue-400">5. Contract Terms & Clauses</h3>
                                    <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-950/40 text-xs font-mono leading-relaxed whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                                        {lease.terms_and_conditions}
                                    </div>
                                </div>

                            </CardContent>
                        </Card>
                    </div>

                    {/* Right: Signature stamp cards & digital signature pad */}
                    <div className="md:col-span-1 space-y-6">
                        
                        {/* Signing Status overview card */}
                        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md rounded-2xl overflow-hidden p-5 space-y-4">
                            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Lease Signature Tracks</h4>
                            
                            <div className="space-y-3">
                                {/* Landlord sign indicator */}
                                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-bold">Landlord Sign Status</p>
                                        <p className="text-[10px] text-slate-400 font-semibold">Lessor Signature</p>
                                    </div>
                                    {landlordSigned ? (
                                        <Badge className="bg-emerald-500/10 border-emerald-500/20 text-emerald-600 font-bold text-[9px] uppercase tracking-wider rounded-lg">Signed</Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-slate-400 font-bold text-[9px] uppercase tracking-wider rounded-lg">Awaiting</Badge>
                                    )}
                                </div>

                                {/* Tenant sign indicator */}
                                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-bold">Tenant Sign Status</p>
                                        <p className="text-[10px] text-slate-400 font-semibold">Lessee Signature</p>
                                    </div>
                                    {tenantSigned ? (
                                        <Badge className="bg-emerald-500/10 border-emerald-500/20 text-emerald-600 font-bold text-[9px] uppercase tracking-wider rounded-lg">Signed</Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-slate-400 font-bold text-[9px] uppercase tracking-wider rounded-lg">Awaiting</Badge>
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* Embed Signature Pad if needed */}
                        {canSign ? (
                            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md rounded-2xl overflow-hidden">
                                <CardHeader className="border-b">
                                    <CardTitle className="text-sm font-extrabold flex items-center gap-1.5">
                                        <PenTool className="h-4 w-4 text-orange-500" /> Append Your Signature
                                    </CardTitle>
                                    <CardDescription>Digitally sign this legal rental contract.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-5">
                                    <DigitalSignaturePad 
                                        signerName={profile.fullname || profile.name || ""} 
                                        onSign={handleSignLease}
                                        processing={signing}
                                    />
                                </CardContent>
                            </Card>
                        ) : (
                            mySigSigned && (
                                <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md rounded-2xl overflow-hidden p-5 text-center space-y-2">
                                    <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto" />
                                    <p className="text-xs font-extrabold text-slate-850 dark:text-slate-200">You signed this agreement</p>
                                    <p className="text-[10px] text-slate-400 italic">Signature has been successfully stamped and logged to audit trails.</p>
                                </Card>
                            )
                        )}

                        {/* Audit Details */}
                        {lease.signatures && lease.signatures.length > 0 && (
                            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md rounded-2xl overflow-hidden p-5 space-y-4">
                                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                    <Shield className="h-4 w-4 text-blue-500" /> Legal Audit Trail
                                </h4>
                                <div className="space-y-3 divide-y divide-slate-100 dark:divide-slate-800/80">
                                    {lease.signatures.map((sig: any) => (
                                        <div key={sig.id} className="pt-2 first:pt-0 text-[10px] space-y-1 font-semibold text-slate-600 dark:text-slate-400">
                                            <p className="font-extrabold text-xs text-slate-800 dark:text-slate-200 capitalize">{sig.role}: {sig.signer_name}</p>
                                            <p>IP: <span className="font-mono text-slate-500">{sig.ip_address}</span></p>
                                            <p>Signed: {new Date(sig.signed_at).toLocaleString()}</p>
                                            <p className="truncate max-w-[200px]" title={sig.user_agent}>Device: {sig.user_agent}</p>
                                            {sig.signature_type === "typed" ? (
                                                <p className="font-mono italic text-blue-600 dark:text-blue-400 font-extrabold text-xs pt-1">Typed: "{sig.signature_value}"</p>
                                            ) : (
                                                <div className="pt-1.5 max-w-[120px] bg-slate-50/50 p-1 rounded border">
                                                    <img src={sig.signature_value} alt="Signature drawn" className="max-h-8" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                    </div>

                </div>

            </div>
        </div>
    )
}
