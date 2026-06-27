"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
    ShieldCheck, 
    Upload, 
    Clock, 
    XCircle, 
    CheckCircle, 
    User, 
    Building2, 
    AlertTriangle,
    Loader2,
    FileText,
    Camera,
    Plus,
    X,
    Info
} from "lucide-react"

export default function VerificationCenterPage() {
    const router = useRouter()
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [activeTab, setActiveTab] = useState("identity")

    // KYC Records State
    const [tenantKyc, setTenantKyc] = useState<any>(null)
    const [landlordKyc, setLandlordKyc] = useState<any>(null)
    const [properties, setProperties] = useState<any[]>([])
    const [propertyVerifications, setPropertyVerifications] = useState<any[]>([])

    // Tenant Form State
    const [tenantForm, setTenantForm] = useState({
        dob: "",
        address: "",
        idType: "NIN",
        idNumber: "",
        employmentCompany: "",
        employmentPosition: "",
        emergencyContactName: "",
        emergencyContactPhone: "",
        emergencyContactRelationship: ""
    })
    const [tenantIdFile, setTenantIdFile] = useState<File | null>(null)
    const [tenantSelfieFile, setTenantSelfieFile] = useState<File | null>(null)

    // Landlord Form State
    const [landlordForm, setLandlordForm] = useState({
        idType: "NIN",
        idNumber: ""
    })
    const [landlordIdFile, setLandlordIdFile] = useState<File | null>(null)
    const [landlordSelfieFile, setLandlordSelfieFile] = useState<File | null>(null)
    const [landlordCacFile, setLandlordCacFile] = useState<File | null>(null)
    const [landlordUtilityFile, setLandlordUtilityFile] = useState<File | null>(null)

    // Property Form State (Modal)
    const [selectedProperty, setSelectedProperty] = useState<any>(null)
    const [propertyOwnershipFile, setPropertyOwnershipFile] = useState<File | null>(null)
    const [propertyAgreementFile, setPropertyAgreementFile] = useState<File | null>(null)
    const [propertyPhotos, setPropertyPhotos] = useState<File[]>([])
    const [propertyPreviews, setPropertyPreviews] = useState<string[]>([])

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push("/login")
                return
            }

            // 1. Fetch Profile
            const { data: prof, error: profError } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single()
            if (profError) throw profError
            setProfile(prof)

            // 2. Fetch Role-Specific KYC Data
            if (prof.role === "tenant") {
                const { data: tKyc } = await supabase
                    .from("tenant_kyc")
                    .select("*")
                    .eq("tenant_id", user.id)
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .maybeSingle()
                setTenantKyc(tKyc)
            } else if (prof.role === "landlord") {
                const { data: lKyc } = await supabase
                    .from("landlord_kyc")
                    .select("*")
                    .eq("landlord_id", user.id)
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .maybeSingle()
                setLandlordKyc(lKyc)

                // Fetch listed properties
                const { data: props } = await supabase
                    .from("properties")
                    .select("*")
                    .eq("landlord_id", user.id)
                setProperties(props || [])

                // Fetch property verifications
                const { data: pVerifs } = await supabase
                    .from("property_verifications")
                    .select("*")
                    .eq("landlord_id", user.id)
                setPropertyVerifications(pVerifs || [])
            }
        } catch (error) {
            console.error("Error fetching verification data:", error)
        } finally {
            setLoading(false)
        }
    }, [router])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    // Tenant Submission Handler
    const handleTenantSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!tenantIdFile || !tenantSelfieFile) {
            alert("Please upload both your ID Card and a Selfie photo.")
            return
        }

        setSubmitting(true)
        try {
            const formData = new FormData()
            formData.append("userId", profile.id)
            formData.append("fullName", profile.name)
            formData.append("phone", profile.phone || "")
            formData.append("dob", tenantForm.dob)
            formData.append("address", tenantForm.address)
            formData.append("idType", tenantForm.idType)
            formData.append("idNumber", tenantForm.idNumber)
            formData.append("idImage", tenantIdFile)
            formData.append("selfieImage", tenantSelfieFile)
            
            formData.append("employmentCompany", tenantForm.employmentCompany)
            formData.append("employmentPosition", tenantForm.employmentPosition)
            formData.append("emergencyContactName", tenantForm.emergencyContactName)
            formData.append("emergencyContactPhone", tenantForm.emergencyContactPhone)
            formData.append("emergencyContactRelationship", tenantForm.emergencyContactRelationship)

            const res = await fetch("/api/kyc/submit", {
                method: "POST",
                body: formData
            })

            const result = await res.json()
            if (!res.ok) throw new Error(result.message || "Failed to submit verification")

            alert("Tenant verification details submitted successfully!")
            fetchData()
        } catch (error: any) {
            alert(error.message || "Failed to submit kyc")
        } finally {
            setSubmitting(false)
        }
    }

    // Landlord Submission Handler
    const handleLandlordSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!landlordIdFile || !landlordSelfieFile || !landlordUtilityFile) {
            alert("Government ID, Selfie, and Proof of address utility bill are all required.")
            return
        }

        setSubmitting(true)
        try {
            const formData = new FormData()
            formData.append("landlordId", profile.id)
            formData.append("fullName", profile.name)
            formData.append("phone", profile.phone || "")
            formData.append("idType", landlordForm.idType)
            formData.append("idNumber", landlordForm.idNumber)
            
            formData.append("idImage", landlordIdFile)
            formData.append("selfieImage", landlordSelfieFile)
            formData.append("addressProof", landlordUtilityFile)
            if (landlordCacFile) {
                formData.append("cacDoc", landlordCacFile)
            }

            const res = await fetch("/api/verification/landlord", {
                method: "POST",
                body: formData
            })

            const result = await res.json()
            if (!res.ok) throw new Error(result.message || "Failed to submit verification")

            alert("Landlord verification documents submitted successfully!")
            fetchData()
        } catch (error: any) {
            alert(error.message || "Failed to submit verification")
        } finally {
            setSubmitting(false)
        }
    }

    // Property Photo Upload Previews
    const handlePropertyPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files)
            setPropertyPhotos(prev => [...prev, ...files])

            const newPreviews = files.map(file => URL.createObjectURL(file))
            setPropertyPreviews(prev => [...prev, ...newPreviews])
        }
    }

    const removePropertyPhoto = (index: number) => {
        setPropertyPhotos(prev => prev.filter((_, i) => i !== index))
        URL.revokeObjectURL(propertyPreviews[index])
        setPropertyPreviews(prev => prev.filter((_, i) => i !== index))
    }

    // Property Verification Submit Handler
    const handlePropertySubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedProperty || !propertyOwnershipFile || !propertyAgreementFile) {
            alert("Please upload property deeds/documents and agency agreements.")
            return
        }

        setSubmitting(true)
        try {
            const formData = new FormData()
            formData.append("propertyId", selectedProperty.id)
            formData.append("landlordId", profile.id)
            formData.append("ownershipDoc", propertyOwnershipFile)
            formData.append("agencyAgreement", propertyAgreementFile)
            
            propertyPhotos.forEach(photo => {
                formData.append("propertyPhotos", photo)
            })

            const res = await fetch("/api/verification/property", {
                method: "POST",
                body: formData
            })

            const result = await res.json()
            if (!res.ok) throw new Error(result.message || "Failed to submit property verification")

            alert(`Property "${selectedProperty.title}" submitted for verification successfully!`)
            setSelectedProperty(null)
            setPropertyOwnershipFile(null)
            setPropertyAgreementFile(null)
            setPropertyPhotos([])
            setPropertyPreviews([])
            fetchData()
        } catch (error: any) {
            alert(error.message || "Failed to verify property")
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <p className="text-sm text-slate-400">Opening Verification Center...</p>
                </div>
            </div>
        )
    }

    const statusColors: any = {
        pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        approved: "bg-green-500/10 text-green-500 border-green-500/20",
        rejected: "bg-red-500/10 text-red-500 border-red-500/20",
        unsubmitted: "bg-slate-500/10 text-slate-500 border-slate-500/20"
    }

    const kycStatus = profile?.verification_status || "unsubmitted"
    const isLandlord = profile?.role === "landlord"
    const isTenant = profile?.role === "tenant"

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <div className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                        <ShieldCheck className="h-7 w-7 text-primary" />
                        Trust & Verification
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">Unlock escrow privileges and gain verified badges for profiles and listings.</p>
                </div>

                <div className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${statusColors[kycStatus]}`}>
                    {kycStatus === "approved" && <CheckCircle className="h-4 w-4" />}
                    {kycStatus === "pending" && <Clock className="h-4 w-4" />}
                    {kycStatus === "rejected" && <XCircle className="h-4 w-4" />}
                    {kycStatus === "unsubmitted" && <AlertTriangle className="h-4 w-4" />}
                    <span className="capitalize">{kycStatus === "approved" ? "Identity Verified" : kycStatus === "pending" ? "Pending Review" : kycStatus === "rejected" ? "Action Required" : "Unverified Account"}</span>
                </div>
            </div>

            {/* Stepper Status Tracker */}
            <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Verification Flow Progress</h3>
                <div className="grid grid-cols-3 gap-2 relative">
                    <div className="absolute top-4 left-0 right-0 h-1 bg-slate-200 dark:bg-slate-800 -z-10" />
                    
                    {/* Step 1 */}
                    <div className="flex flex-col items-center text-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            kycStatus !== "unsubmitted" ? "bg-blue-600 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                        }`}>
                            1
                        </div>
                        <span className="text-[10px] font-bold mt-2">Documents Uploaded</span>
                    </div>

                    {/* Step 2 */}
                    <div className="flex flex-col items-center text-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            kycStatus === "pending" || kycStatus === "approved" ? "bg-blue-600 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                        }`}>
                            2
                        </div>
                        <span className="text-[10px] font-bold mt-2">Admin Reviewing</span>
                    </div>

                    {/* Step 3 */}
                    <div className="flex flex-col items-center text-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            kycStatus === "approved" ? "bg-green-600 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                        }`}>
                            3
                        </div>
                        <span className="text-[10px] font-bold mt-2">Trust Badge Active</span>
                    </div>
                </div>
            </div>

            {/* Main Tabs Container */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-white/80 dark:bg-slate-950/60 p-1 border rounded-xl flex w-full max-w-sm mb-6">
                    <TabsTrigger value="identity" className="flex-1 rounded-lg">Personal Identity</TabsTrigger>
                    {isLandlord && (
                        <TabsTrigger value="properties" className="flex-1 rounded-lg">Property Listings</TabsTrigger>
                    )}
                </TabsList>

                {/* Tab Content 1: Personal Identity */}
                <TabsContent value="identity" className="space-y-6">
                    {/* Approved View */}
                    {kycStatus === "approved" && (
                        <Card className="border border-green-200/40 bg-green-500/[0.02] rounded-2xl p-6 flex flex-col items-center text-center gap-3">
                            <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                                <ShieldCheck className="h-10 w-10" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5 justify-center">
                                    Verified {isLandlord ? "Landlord" : "Tenant"} Badge Enabled
                                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-white text-[8px]">✓</span>
                                </h3>
                                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                                    Your legal identity documents were successfully verified. Your account is trusted and fully operational.
                                </p>
                            </div>
                            <div className="border border-slate-200/80 dark:border-slate-800/80 p-3 rounded-xl bg-white/60 dark:bg-slate-900/60 text-xs w-full max-w-xs space-y-1">
                                <div className="flex justify-between font-semibold">
                                    <span className="text-slate-400">Submitted at:</span>
                                    <span>{new Date(profile?.kyc_submitted_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between font-semibold">
                                    <span className="text-slate-400">Account status:</span>
                                    <span className="text-green-500">Trusted</span>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Pending View */}
                    {kycStatus === "pending" && (
                        <Card className="border border-amber-200/40 bg-amber-500/[0.02] rounded-2xl p-6 flex flex-col items-center text-center gap-3">
                            <div className="h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 animate-pulse">
                                <Clock className="h-10 w-10" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Verification Under Review</h3>
                                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                                    Our administrative team is currently reviewing your identity documents. This process usually takes 24–48 hours.
                                </p>
                            </div>
                            <div className="p-3 border rounded-xl bg-white/50 text-xs w-full max-w-sm text-left flex gap-2">
                                <Info className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                                <span className="text-slate-400">You will be notified immediately inside your messages/dashboard when verification updates.</span>
                            </div>
                        </Card>
                    )}

                    {/* Rejection Alert */}
                    {kycStatus === "rejected" && (
                        <div className="p-4 border border-red-500/20 bg-red-500/5 rounded-2xl flex gap-3 text-sm">
                            <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <h4 className="font-extrabold text-red-500">Verification Documents Rejected</h4>
                                <p className="text-xs text-slate-400">
                                    Your previous submission was declined. Rejection reason: 
                                    <span className="block font-semibold text-slate-800 dark:text-slate-200 mt-1 italic">
                                        "{tenantKyc?.rejection_reason || landlordKyc?.rejection_reason || 'Document resolution too low, details unreadable.'}"
                                    </span>
                                </p>
                                <p className="text-[10px] text-slate-400 pt-1">Please upload clean, updated documents below.</p>
                            </div>
                        </div>
                    )}

                    {/* Submission Forms */}
                    {(kycStatus === "unsubmitted" || kycStatus === "rejected") && (
                        <>
                            {/* Tenant Verification Form */}
                            {isTenant && (
                                <form onSubmit={handleTenantSubmit} className="space-y-6">
                                    <Card className="border border-slate-200 dark:border-slate-850 bg-white/80 dark:bg-slate-950/60 rounded-2xl overflow-hidden shadow-sm">
                                        <CardHeader className="border-b border-slate-100 dark:border-slate-800">
                                            <CardTitle className="text-lg font-black">1. Identity Details</CardTitle>
                                            <CardDescription className="text-xs">Provide matching information exactly as on your Government ID.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="idType" className="text-xs font-bold uppercase tracking-wider text-slate-500">ID Document Type</Label>
                                                <select
                                                    id="idType"
                                                    value={tenantForm.idType}
                                                    onChange={(e) => setTenantForm({ ...tenantForm, idType: e.target.value })}
                                                    className="flex h-11 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 px-3 py-2 text-base md:text-sm focus-visible:outline-none text-slate-900 dark:text-slate-100 font-sans"
                                                >
                                                    <option value="NIN">NIN</option>
                                                    <option value="Driver's License">Driver's License</option>
                                                    <option value="Passport">International Passport</option>
                                                    <option value="Voter's Card">Voter's Card</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="idNumber" className="text-xs font-bold uppercase tracking-wider text-slate-500">ID Document Number</Label>
                                                <Input 
                                                    id="idNumber" 
                                                    placeholder="Enter ID / card number"
                                                    required 
                                                    value={tenantForm.idNumber}
                                                    onChange={(e) => setTenantForm({ ...tenantForm, idNumber: e.target.value })}
                                                    className="h-11 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-850 rounded-xl"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="dob" className="text-xs font-bold uppercase tracking-wider text-slate-500">Date of Birth</Label>
                                                <Input 
                                                    id="dob" 
                                                    type="date"
                                                    required 
                                                    value={tenantForm.dob}
                                                    onChange={(e) => setTenantForm({ ...tenantForm, dob: e.target.value })}
                                                    className="h-11 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-850 rounded-xl"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="address" className="text-xs font-bold uppercase tracking-wider text-slate-500">Residential Address</Label>
                                                <Input 
                                                    id="address" 
                                                    placeholder="Current home address"
                                                    required 
                                                    value={tenantForm.address}
                                                    onChange={(e) => setTenantForm({ ...tenantForm, address: e.target.value })}
                                                    className="h-11 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-850 rounded-xl"
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border border-slate-200 dark:border-slate-850 bg-white/80 dark:bg-slate-950/60 rounded-2xl overflow-hidden shadow-sm">
                                        <CardHeader className="border-b border-slate-100 dark:border-slate-800">
                                            <CardTitle className="text-lg font-black">2. Employment Information</CardTitle>
                                            <CardDescription className="text-xs">Provide details about your current employer.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="employmentCompany" className="text-xs font-bold uppercase tracking-wider text-slate-500">Company Name</Label>
                                                <Input 
                                                    id="employmentCompany" 
                                                    placeholder="Employer / Company Name"
                                                    value={tenantForm.employmentCompany}
                                                    onChange={(e) => setTenantForm({ ...tenantForm, employmentCompany: e.target.value })}
                                                    className="h-11 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-850 rounded-xl"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="employmentPosition" className="text-xs font-bold uppercase tracking-wider text-slate-500">Job Title / Role</Label>
                                                <Input 
                                                    id="employmentPosition" 
                                                    placeholder="e.g. Software Engineer"
                                                    value={tenantForm.employmentPosition}
                                                    onChange={(e) => setTenantForm({ ...tenantForm, employmentPosition: e.target.value })}
                                                    className="h-11 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-850 rounded-xl"
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border border-slate-200 dark:border-slate-850 bg-white/80 dark:bg-slate-950/60 rounded-2xl overflow-hidden shadow-sm">
                                        <CardHeader className="border-b border-slate-100 dark:border-slate-800">
                                            <CardTitle className="text-lg font-black">3. Emergency Contact Details</CardTitle>
                                            <CardDescription className="text-xs">Who can we contact in case of emergency?</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="emergencyContactName" className="text-xs font-bold uppercase tracking-wider text-slate-500">Full Name</Label>
                                                <Input 
                                                    id="emergencyContactName" 
                                                    placeholder="Emergency contact name"
                                                    required
                                                    value={tenantForm.emergencyContactName}
                                                    onChange={(e) => setTenantForm({ ...tenantForm, emergencyContactName: e.target.value })}
                                                    className="h-11 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-850 rounded-xl"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="emergencyContactPhone" className="text-xs font-bold uppercase tracking-wider text-slate-500">Phone Number</Label>
                                                <Input 
                                                    id="emergencyContactPhone" 
                                                    placeholder="Emergency phone number"
                                                    required
                                                    value={tenantForm.emergencyContactPhone}
                                                    onChange={(e) => setTenantForm({ ...tenantForm, emergencyContactPhone: e.target.value })}
                                                    className="h-11 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-850 rounded-xl"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="emergencyContactRelationship" className="text-xs font-bold uppercase tracking-wider text-slate-500">Relationship</Label>
                                                <Input 
                                                    id="emergencyContactRelationship" 
                                                    placeholder="e.g. Spouse, Sibling"
                                                    required
                                                    value={tenantForm.emergencyContactRelationship}
                                                    onChange={(e) => setTenantForm({ ...tenantForm, emergencyContactRelationship: e.target.value })}
                                                    className="h-11 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-850 rounded-xl"
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border border-slate-200 dark:border-slate-850 bg-white/80 dark:bg-slate-950/60 rounded-2xl overflow-hidden shadow-sm">
                                        <CardHeader className="border-b border-slate-100 dark:border-slate-800">
                                            <CardTitle className="text-lg font-black">4. Document Uploads</CardTitle>
                                            <CardDescription className="text-xs">Select or capture documents. Accepted formats: JPEG, PNG, PDF.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            {/* ID doc */}
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Government ID Photo / Scan</Label>
                                                <div className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-900/35 rounded-xl text-center relative cursor-pointer min-h-[140px] flex flex-col justify-center items-center gap-1.5">
                                                    <input 
                                                        type="file" 
                                                        accept="image/*,application/pdf"
                                                        onChange={(e) => setTenantIdFile(e.target.files?.[0] || null)}
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                    />
                                                    {tenantIdFile ? (
                                                        <>
                                                            <CheckCircle className="h-8 w-8 text-green-500" />
                                                            <span className="text-xs font-bold text-slate-600 truncate max-w-[200px]">{tenantIdFile.name}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Upload className="h-6 w-6 text-slate-400" />
                                                            <span className="text-xs font-bold">Select ID File</span>
                                                            <span className="text-[9px] text-slate-400">Upload or snap a photo of ID card</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Selfie doc */}
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Selfie Holding ID</Label>
                                                <div className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-900/35 rounded-xl text-center relative cursor-pointer min-h-[140px] flex flex-col justify-center items-center gap-1.5">
                                                    <input 
                                                        type="file" 
                                                        accept="image/*"
                                                        capture="user"
                                                        onChange={(e) => setTenantSelfieFile(e.target.files?.[0] || null)}
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                    />
                                                    {tenantSelfieFile ? (
                                                        <>
                                                            <CheckCircle className="h-8 w-8 text-green-500" />
                                                            <span className="text-xs font-bold text-slate-600 truncate max-w-[200px]">{tenantSelfieFile.name}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Camera className="h-6 w-6 text-slate-400" />
                                                            <span className="text-xs font-bold">Snap Selfie with ID</span>
                                                            <span className="text-[9px] text-slate-400">Uses mobile camera or snaps avatar photo</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Button type="submit" disabled={submitting} className="w-full font-bold h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white min-h-[48px]">
                                        {submitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4.5 w-4.5 animate-spin" />
                                                Uploading documents...
                                            </>
                                        ) : (
                                            "Submit Tenant Verification Documents"
                                        )}
                                    </Button>
                                </form>
                            )}

                            {/* Landlord Verification Form */}
                            {isLandlord && (
                                <form onSubmit={handleLandlordSubmit} className="space-y-6">
                                    <Card className="border border-slate-200 dark:border-slate-850 bg-white/80 dark:bg-slate-950/60 rounded-2xl overflow-hidden shadow-sm">
                                        <CardHeader className="border-b border-slate-100 dark:border-slate-800">
                                            <CardTitle className="text-lg font-black">1. Landlord Details</CardTitle>
                                            <CardDescription className="text-xs">Provide matching information exactly as on your Government ID.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="idType" className="text-xs font-bold uppercase tracking-wider text-slate-500">ID Document Type</Label>
                                                <select
                                                    id="idType"
                                                    value={landlordForm.idType}
                                                    onChange={(e) => setLandlordForm({ ...landlordForm, idType: e.target.value })}
                                                    className="flex h-11 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 px-3 py-2 text-base md:text-sm focus-visible:outline-none text-slate-900 dark:text-slate-100 font-sans"
                                                >
                                                    <option value="NIN">NIN</option>
                                                    <option value="Driver's License">Driver's License</option>
                                                    <option value="Passport">International Passport</option>
                                                    <option value="Voter's Card">Voter's Card</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="idNumber" className="text-xs font-bold uppercase tracking-wider text-slate-500">ID Document Number</Label>
                                                <Input 
                                                    id="idNumber" 
                                                    placeholder="Enter ID / card number"
                                                    required 
                                                    value={landlordForm.idNumber}
                                                    onChange={(e) => setLandlordForm({ ...landlordForm, idNumber: e.target.value })}
                                                    className="h-11 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-855 rounded-xl"
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border border-slate-200 dark:border-slate-850 bg-white/80 dark:bg-slate-950/60 rounded-2xl overflow-hidden shadow-sm">
                                        <CardHeader className="border-b border-slate-100 dark:border-slate-800">
                                            <CardTitle className="text-lg font-black">2. Document Uploads</CardTitle>
                                            <CardDescription className="text-xs">Provide required address verification and identity items.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            {/* Government ID */}
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Government ID Scan</Label>
                                                <div className="p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-900/35 rounded-xl text-center relative cursor-pointer min-h-[120px] flex flex-col justify-center items-center gap-1.5">
                                                    <input 
                                                        type="file" 
                                                        accept="image/*,application/pdf"
                                                        onChange={(e) => setLandlordIdFile(e.target.files?.[0] || null)}
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                    />
                                                    {landlordIdFile ? (
                                                        <>
                                                            <CheckCircle className="h-6 w-6 text-green-500" />
                                                            <span className="text-xs font-bold text-slate-600 truncate max-w-[200px]">{landlordIdFile.name}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Upload className="h-5 w-5 text-slate-400" />
                                                            <span className="text-xs font-bold text-slate-800 dark:text-slate-300">Upload ID Document</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Selfie */}
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Selfie Photo</Label>
                                                <div className="p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-900/35 rounded-xl text-center relative cursor-pointer min-h-[120px] flex flex-col justify-center items-center gap-1.5">
                                                    <input 
                                                        type="file" 
                                                        accept="image/*"
                                                        capture="user"
                                                        onChange={(e) => setLandlordSelfieFile(e.target.files?.[0] || null)}
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                    />
                                                    {landlordSelfieFile ? (
                                                        <>
                                                            <CheckCircle className="h-6 w-6 text-green-500" />
                                                            <span className="text-xs font-bold text-slate-600 truncate max-w-[200px]">{landlordSelfieFile.name}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Camera className="h-5 w-5 text-slate-400" />
                                                            <span className="text-xs font-bold text-slate-800 dark:text-slate-300">Take Selfie Photo</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {/* CAC Certificate */}
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400">CAC Certificate (Optional)</Label>
                                                <div className="p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-900/35 rounded-xl text-center relative cursor-pointer min-h-[120px] flex flex-col justify-center items-center gap-1.5">
                                                    <input 
                                                        type="file" 
                                                        accept="image/*,application/pdf"
                                                        onChange={(e) => setLandlordCacFile(e.target.files?.[0] || null)}
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                    />
                                                    {landlordCacFile ? (
                                                        <>
                                                            <CheckCircle className="h-6 w-6 text-green-500" />
                                                            <span className="text-xs font-bold text-slate-600 truncate max-w-[200px]">{landlordCacFile.name}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FileText className="h-5 w-5 text-slate-400" />
                                                            <span className="text-xs font-bold text-slate-800 dark:text-slate-300">Upload CAC Certificate</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Utility Bill / Proof of address */}
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Utility Bill / Address Proof</Label>
                                                <div className="p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-900/35 rounded-xl text-center relative cursor-pointer min-h-[120px] flex flex-col justify-center items-center gap-1.5">
                                                    <input 
                                                        type="file" 
                                                        accept="image/*,application/pdf"
                                                        onChange={(e) => setLandlordUtilityFile(e.target.files?.[0] || null)}
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                    />
                                                    {landlordUtilityFile ? (
                                                        <>
                                                            <CheckCircle className="h-6 w-6 text-green-500" />
                                                            <span className="text-xs font-bold text-slate-600 truncate max-w-[200px]">{landlordUtilityFile.name}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Upload className="h-5 w-5 text-slate-400" />
                                                            <span className="text-xs font-bold text-slate-800 dark:text-slate-300">Utility Bill or Address Proof</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Button type="submit" disabled={submitting} className="w-full font-bold h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white min-h-[48px]">
                                        {submitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4.5 w-4.5 animate-spin" />
                                                Uploading documents...
                                            </>
                                        ) : (
                                            "Submit Landlord Verification Documents"
                                        )}
                                    </Button>
                                </form>
                            )}
                        </>
                    )}
                </TabsContent>

                {/* Tab Content 2: Property Listings Verifications (Landlord Only) */}
                {isLandlord && (
                    <TabsContent value="properties" className="space-y-6">
                        {/* Selected Property Upload Form (if active) */}
                        {selectedProperty ? (
                            <form onSubmit={handlePropertySubmit} className="space-y-6">
                                <div className="flex items-center gap-3 pb-3 border-b">
                                    <Button type="button" variant="outline" size="sm" onClick={() => setSelectedProperty(null)}>
                                        Back to list
                                    </Button>
                                    <h3 className="font-extrabold text-sm">Verify: {selectedProperty.title}</h3>
                                </div>

                                <Card className="border border-slate-200 dark:border-slate-850 bg-white/80 dark:bg-slate-950/60 rounded-2xl overflow-hidden shadow-sm">
                                    <CardHeader className="border-b border-slate-100 dark:border-slate-800">
                                        <CardTitle className="text-lg font-black">Property Legal Documents</CardTitle>
                                        <CardDescription className="text-xs">Provide ownership deeds or authorization to list this property.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        {/* Ownership Doc */}
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Proof of Ownership / Deed of Assignment</Label>
                                            <div className="p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-900/35 rounded-xl text-center relative cursor-pointer min-h-[120px] flex flex-col justify-center items-center gap-1.5">
                                                <input 
                                                    type="file" 
                                                    accept="image/*,application/pdf"
                                                    onChange={(e) => setPropertyOwnershipFile(e.target.files?.[0] || null)}
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                />
                                                {propertyOwnershipFile ? (
                                                    <>
                                                        <CheckCircle className="h-6 w-6 text-green-500" />
                                                        <span className="text-xs font-bold text-slate-600 truncate max-w-[200px]">{propertyOwnershipFile.name}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload className="h-5 w-5 text-slate-400" />
                                                        <span className="text-xs font-bold text-slate-800 dark:text-slate-300">Upload Ownership Proof</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Agency Agreement */}
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Agency Agreement / Authority to Lease</Label>
                                            <div className="p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-900/35 rounded-xl text-center relative cursor-pointer min-h-[120px] flex flex-col justify-center items-center gap-1.5">
                                                <input 
                                                    type="file" 
                                                    accept="image/*,application/pdf"
                                                    onChange={(e) => setPropertyAgreementFile(e.target.files?.[0] || null)}
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                />
                                                {propertyAgreementFile ? (
                                                    <>
                                                        <CheckCircle className="h-6 w-6 text-green-500" />
                                                        <span className="text-xs font-bold text-slate-600 truncate max-w-[200px]">{propertyAgreementFile.name}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload className="h-5 w-5 text-slate-400" />
                                                        <span className="text-xs font-bold text-slate-800 dark:text-slate-300">Upload Agency Agreement</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border border-slate-200 dark:border-slate-850 bg-white/80 dark:bg-slate-950/60 rounded-2xl overflow-hidden shadow-sm">
                                    <CardHeader className="border-b border-slate-100 dark:border-slate-800">
                                        <CardTitle className="text-lg font-black">Verification Photos</CardTitle>
                                        <CardDescription className="text-xs">Upload additional photos of building entrance or structural specs to verify property validity.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-4">
                                        <div className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-900/35 rounded-xl text-center space-y-2 relative cursor-pointer">
                                            <input 
                                                type="file" 
                                                multiple
                                                accept="image/*"
                                                onChange={handlePropertyPhotoChange}
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                            />
                                            <Camera className="h-6 w-6 mx-auto text-slate-400" />
                                            <span className="text-xs font-bold block">Upload Property Verification Photos</span>
                                        </div>

                                        {propertyPreviews.length > 0 && (
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                                                {propertyPreviews.map((preview, idx) => (
                                                    <div key={idx} className="relative group aspect-video rounded-xl overflow-hidden border">
                                                        <img src={preview} alt="Property Verification" className="w-full h-full object-cover" />
                                                        <button 
                                                            type="button" 
                                                            onClick={() => removePropertyPhoto(idx)}
                                                            className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full p-1"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Button type="submit" disabled={submitting} className="w-full font-bold h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white min-h-[48px]">
                                    {submitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4.5 w-4.5 animate-spin" />
                                            Uploading property files...
                                        </>
                                    ) : (
                                        "Submit Property for Verification"
                                    )}
                                </Button>
                            </form>
                        ) : (
                            /* Properties List Tab */
                            <div className="space-y-4">
                                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-450">Select listed property to verify</h3>
                                {properties.length === 0 ? (
                                    <div className="p-8 text-center border rounded-2xl bg-white/40 dark:bg-slate-900/30 text-slate-400 italic">
                                        You have not listed any properties yet. List properties from your portfolio first.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {properties.map((prop) => {
                                            const vStatus = prop.verification_status || "unsubmitted"
                                            const hasActiveRequest = propertyVerifications.find(pv => pv.property_id === prop.id)
                                            
                                            return (
                                                <Card key={prop.id} className="border border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 rounded-2xl flex flex-col justify-between p-4 gap-4">
                                                    <div>
                                                        <h4 className="font-extrabold text-slate-900 dark:text-slate-100 line-clamp-1">{prop.title}</h4>
                                                        <p className="text-xs text-slate-400 mt-1">{prop.area}, {prop.city}</p>
                                                    </div>

                                                    <div className="flex items-center justify-between pt-2 border-t mt-auto">
                                                        <div className={`px-2 py-0.5 border rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColors[vStatus]}`}>
                                                            {vStatus === "approved" ? "Verified Property" : vStatus === "pending" ? "Pending Review" : vStatus === "rejected" ? "Action Required" : "Unverified"}
                                                        </div>

                                                        {vStatus === "unsubmitted" || vStatus === "rejected" ? (
                                                            <Button size="sm" onClick={() => setSelectedProperty(prop)} className="bg-blue-600 hover:bg-blue-700 font-bold text-xs h-8">
                                                                Verify Listing
                                                            </Button>
                                                        ) : vStatus === "pending" && hasActiveRequest ? (
                                                            <span className="text-[10px] text-slate-400 italic font-semibold">Under review</span>
                                                        ) : (
                                                            <span className="text-[10px] text-green-500 font-bold flex items-center gap-1">
                                                                <CheckCircle className="h-3.5 w-3.5" /> Badge Active
                                                            </span>
                                                        )}
                                                    </div>
                                                </Card>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </TabsContent>
                )}
            </Tabs>
        </div>
    )
}
