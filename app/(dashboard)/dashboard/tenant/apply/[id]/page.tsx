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
import { Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface Property {
    id: string
    title: string
    price: number
    address: string
    city: string
    landlord_id: string
}

export default function TenantApplyPage() {
    const params = useParams()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [property, setProperty] = useState<Property | null>(null)
    const [user, setUser] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const [formData, setFormData] = useState({
        employment: "",
        income: "",
        notes: "",
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
                }
            } catch (err: any) {
                if (err?.name === 'AbortError' || err?.message?.includes('aborted') || err?.message?.includes('AbortError')) return
                console.error("Error fetching data:", err)
                setError("Failed to load property details")
            } finally {
                setLoading(false)
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !property) return

        setSubmitting(true)
        setError(null)

        try {
            const { error: insertError } = await supabase
                .from('rentals')
                .insert({
                    property_id: property.id,
                    tenant_id: user.id,
                    landlord_id: property.landlord_id,
                    employment: formData.employment,
                    income: formData.income,
                    notes: formData.notes,
                    rent_start_date: formData.rent_start_date || null,
                    status: 'pending'
                })

            if (insertError) throw insertError

            setSuccess(true)
            setTimeout(() => {
                router.push("/dashboard")
            }, 2000)
        } catch (err: any) {
            console.error("Error submitting application object:", err)
            console.error("Error submitting application JSON:", JSON.stringify(err, null, 2))

            setError(err.message || "Failed to submit application. See console for details.")
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
                <Alert className="bg-green-50 border-green-200">
                    <AlertDescription className="text-green-800">
                        Application submitted successfully! Redirecting to dashboard...
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

            <Card>
                <CardHeader>
                    <CardTitle>Apply for Rental</CardTitle>
                    <CardDescription>
                        {property.title} - ₦{property.price.toLocaleString()}/month
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="employment">Employment Status *</Label>
                            <Input
                                id="employment"
                                name="employment"
                                placeholder="e.g., Full-time Software Engineer at ABC Corp"
                                value={formData.employment}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="income">Monthly Income *</Label>
                            <Input
                                id="income"
                                name="income"
                                placeholder="e.g., ₦500,000"
                                value={formData.income}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="rent_start_date">Preferred Move-in Date</Label>
                            <Input
                                id="rent_start_date"
                                name="rent_start_date"
                                type="date"
                                value={formData.rent_start_date}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Additional Notes</Label>
                            <Textarea
                                id="notes"
                                name="notes"
                                placeholder="Any additional information you'd like to share..."
                                value={formData.notes}
                                onChange={handleChange}
                                rows={4}
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={submitting} className="w-full">
                            {submitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                "Submit Application"
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
