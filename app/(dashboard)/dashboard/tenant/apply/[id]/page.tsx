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
import type { User } from "@supabase/supabase-js"

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
    const [user, setUser] = useState<User | null>(null)
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
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : ""
                if (error instanceof Error && (error.name === 'AbortError' || message.includes('aborted') || message.includes('AbortError'))) return
                console.error("Error fetching data:", error)
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
            const response = await fetch('/api/rentals/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    propertyId: property.id,
                    employment: formData.employment,
                    income: formData.income,
                    notes: formData.notes,
                    rentStartDate: formData.rent_start_date || null,
                }),
            })
            const result = await response.json()
            if (!response.ok) throw new Error(result.error || 'Failed to submit application')

            setSuccess(true)
            setTimeout(() => {
                router.push("/dashboard")
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
