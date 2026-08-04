"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowLeft, FileText, Calendar, Upload, Sparkles, CheckCircle2, AlertCircle } from "lucide-react"
import Link from "next/link"
import type { User } from "@supabase/supabase-js"

interface Property {
    id: string
    title: string
    price: number
    address: string
    city: string
    landlord_id: string
}

interface InspectionBooking {
    id: string
    inspection_date: string
    inspection_time: string
    inspection_type: string
    status: string
}

export default function TenantApplyPage() {
    const params = useParams()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [uploadingFile, setUploadingFile] = useState(false)
    const [property, setProperty] = useState<Property | null>(null)
    const [inspection, setInspection] = useState<InspectionBooking | null>(null)
    const [user, setUser] = useState<User | null>(null)
    const [userProfile, setUserProfile] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const [formData, setFormData] = useState({
        employment: "",
        income: "",
        notes: "",
        application_letter: "",
        application_letter_url: "",
        rent_start_date: "",
    })

    useEffect(() => {
        let mounted = true

        const fetchData = async () => {
            try {
                // Get current user
                const { data: { user }, error: authError } = await supabase.auth.getUser()
                if (authError) throw authError

                if (!user) {
                    router.push("/login")
                    return
                }
                setUser(user)

                // Fetch profile for template generation
                const { data: prof } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", user.id)
                    .maybeSingle()
                if (mounted) setUserProfile(prof)

                // Fetch property details
                if (params.id) {
                    const { data, error: propertyError } = await supabase
                        .from('properties')
                        .select('*')
                        .eq('id', params.id)
                        .single()

                    if (propertyError) throw propertyError
                    if (mounted) {
                        setProperty(data)
                    }

                    // Check if tenant has an inspection booking for this property
                    const { data: inspData } = await supabase
                        .from('inspection_bookings')
                        .select('id, inspection_date, inspection_time, inspection_type, status')
                        .eq('property_id', params.id)
                        .eq('tenant_id', user.id)
                        .order('inspection_date', { ascending: false })
                        .maybeSingle()

                    if (mounted && inspData) {
                        setInspection(inspData)
                    }
                }
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : ""
                if (error instanceof Error && (error.name === 'AbortError' || message.includes('aborted') || message.includes('AbortError'))) return
                console.error("Error fetching data:", error)
                setError("Failed to load property details")
            } finally {
                if (mounted) setLoading(false)
            }
        }

        fetchData()

        return () => {
            mounted = false
        }
    }, [params.id, router])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !user) return

        setUploadingFile(true)
        try {
            const fileExt = file.name.split('.').pop()
            const filePath = `application_letters/${user.id}_${Date.now()}.${fileExt}`

            const { error: uploadErr } = await supabase.storage
                .from('property-documents')
                .upload(filePath, file, { upsert: true })

            if (uploadErr) {
                // Fallback to reading file as Data URL if bucket upload has RLS restriction
                const reader = new FileReader()
                reader.onload = () => {
                    setFormData(prev => ({ ...prev, application_letter_url: reader.result as string }))
                    setUploadingFile(false)
                }
                reader.readAsDataURL(file)
                return
            }

            const { data: { publicUrl } } = supabase.storage
                .from('property-documents')
                .getPublicUrl(filePath)

            setFormData(prev => ({ ...prev, application_letter_url: publicUrl }))
        } catch (err) {
            console.error("File upload error:", err)
        } finally {
            setUploadingFile(false)
        }
    }

    const generateTemplateLetter = () => {
        const tenantName = userProfile?.full_name || userProfile?.name || "Prospective Tenant"
        const propTitle = property?.title || "your rental property"
        const moveIn = formData.rent_start_date ? new Date(formData.rent_start_date).toLocaleDateString() : "the earliest available date"
        const emp = formData.employment || "Employed Professional"

        const letter = `Dear Property Owner / Landlord,

I am writing to formally submit my rental application for ${propTitle}.

About Me:
My name is ${tenantName}. I work as ${emp}. I am looking for a comfortable, well-maintained home and believe ${propTitle} fits my requirements perfectly.

Rental Details & Commitments:
- Proposed Move-in Date: ${moveIn}
- Monthly Income: ${formData.income || "As specified in application"}
- Occupancy Duration: 12 months minimum

I maintain a clean, orderly lifestyle and ensure timely rent payment and peaceful co-existence. I am available for a property inspection or meeting at your earliest convenience.

Thank you for reviewing my application and letter.

Sincerely,
${tenantName}
Email: ${user?.email || ""}`

        setFormData(prev => ({ ...prev, application_letter: letter }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !property) return

        setSubmitting(true)
        setError(null)

        try {
            const response = await fetch('/api/rentals/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    propertyId: property.id,
                    employment: formData.employment,
                    income: formData.income,
                    notes: formData.notes,
                    applicationLetter: formData.application_letter || formData.notes,
                    applicationLetterUrl: formData.application_letter_url || null,
                    rentStartDate: formData.rent_start_date || null,
                }),
            })
            const result = await response.json()
            if (!response.ok) throw new Error(result.error || 'Failed to submit application')

            setSuccess(true)
            setTimeout(() => {
                router.push("/applications")
            }, 2000)
        } catch (error: unknown) {
            console.error("Error submitting application:", error)
            setError(error instanceof Error ? error.message : "Failed to submit application.")
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!property) {
        return (
            <div className="container max-w-2xl py-8">
                <Alert variant="destructive">
                    <AlertDescription>Property not found</AlertDescription>
                </Alert>
                <Link href="/listings" className="mt-4 inline-block">
                    <Button variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Listings
                    </Button>
                </Link>
            </div>
        )
    }

    if (success) {
        return (
            <div className="container max-w-2xl py-8">
                <Alert className="bg-green-50 border-green-200 dark:bg-green-950/40">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                    <AlertDescription className="text-green-800 dark:text-green-300 font-medium">
                        Application letter and details submitted successfully! Redirecting to applications page...
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    return (
        <div className="container max-w-2xl py-8">
            <Link href={`/listings/${property.id}`} className="mb-4 inline-block">
                <Button variant="outline" size="sm">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Property
                </Button>
            </Link>

            <Card className="shadow-sm border-t-4 border-t-primary">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-2xl font-bold">Rental Application & Letter</CardTitle>
                            <CardDescription className="text-sm mt-1">
                                Submit your application and personal letter to the landlord for {property.title}
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className="text-sm font-semibold px-3 py-1">
                            ₦{property.price.toLocaleString()}/mo
                        </Badge>
                    </div>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-6">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {/* Inspection Status Card */}
                        <div className="p-4 rounded-lg border bg-blue-50/50 dark:bg-slate-900/40 space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    <span className="text-sm font-semibold text-foreground">Property Inspection Status</span>
                                </div>
                                {inspection ? (
                                    <Badge className="capitalize bg-blue-600">{inspection.status}</Badge>
                                ) : (
                                    <Badge variant="secondary">Not Booked</Badge>
                                )}
                            </div>
                            {inspection ? (
                                <p className="text-xs text-muted-foreground">
                                    You have a scheduled <strong className="text-foreground">{inspection.inspection_type}</strong> on{" "}
                                    <strong className="text-foreground">{new Date(inspection.inspection_date).toLocaleDateString()}</strong> at{" "}
                                    <strong className="text-foreground">{inspection.inspection_time}</strong>. The landlord will review your application along with this inspection.
                                </p>
                            ) : (
                                <div className="flex items-center justify-between text-xs pt-1">
                                    <span className="text-muted-foreground">Haven&apos;t booked an inspection yet? You can book one anytime.</span>
                                    <Link href={`/listings/${property.id}`} className="text-blue-600 font-semibold hover:underline">
                                        Book Inspection →
                                    </Link>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="employment" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Employment Status *</Label>
                                <Input
                                    id="employment"
                                    name="employment"
                                    placeholder="e.g., Senior Engineer at TechCorp"
                                    value={formData.employment}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="income" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Monthly Income *</Label>
                                <Input
                                    id="income"
                                    name="income"
                                    placeholder="e.g., ₦500,000"
                                    value={formData.income}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="rent_start_date" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Preferred Move-in Date</Label>
                            <Input
                                id="rent_start_date"
                                name="rent_start_date"
                                type="date"
                                value={formData.rent_start_date}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Application Letter Section */}
                        <div className="space-y-3 pt-2 border-t">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <FileText className="h-4 w-4 text-primary" />
                                    <Label htmlFor="application_letter" className="font-semibold text-base">Application Letter to Landlord *</Label>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs text-primary hover:bg-primary/10"
                                    onClick={generateTemplateLetter}
                                >
                                    <Sparkles className="mr-1 h-3.5 w-3.5" />
                                    Auto-fill Template
                                </Button>
                            </div>
                            <Textarea
                                id="application_letter"
                                name="application_letter"
                                placeholder="Write a brief cover letter introducing yourself, explaining why you wish to rent this property, and providing any references..."
                                value={formData.application_letter}
                                onChange={handleChange}
                                rows={6}
                                required
                                className="font-sans leading-relaxed text-sm"
                            />
                            <p className="text-xs text-muted-foreground">
                                This letter will be presented directly to the landlord when they review your application.
                            </p>
                        </div>

                        {/* Attach Document File */}
                        <div className="space-y-2 pt-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Attach Signed Application Letter or ID (Optional)</Label>
                            <div className="flex items-center space-x-3">
                                <Input
                                    type="file"
                                    accept=".pdf,.doc,.docx,image/*"
                                    onChange={handleFileUpload}
                                    className="cursor-pointer text-xs"
                                    disabled={uploadingFile}
                                />
                                {uploadingFile && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                            </div>
                            {formData.application_letter_url && (
                                <p className="text-xs text-green-600 font-medium flex items-center mt-1">
                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Document attached successfully
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Additional Notes for Landlord (Optional)</Label>
                            <Textarea
                                id="notes"
                                name="notes"
                                placeholder="Any special requests or details..."
                                value={formData.notes}
                                onChange={handleChange}
                                rows={2}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-2">
                        <Button type="submit" disabled={submitting || uploadingFile} className="w-full text-base font-semibold py-5">
                            {submitting ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Submitting Application & Letter...
                                </>
                            ) : (
                                <>
                                    <FileText className="mr-2 h-5 w-5" />
                                    Submit Application Letter
                                </>
                            )}
                        </Button>
                        <p className="text-xs text-center text-muted-foreground pt-1">
                            By submitting, your profile, income details, inspection record, and letter will be shared with the property landlord.
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}

