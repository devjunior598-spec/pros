"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, FileText } from "lucide-react"

interface RentalApplicationFormProps {
    propertyId: string
    tenantId: string
    rentAmount: number
    onSuccess: () => void
}

export function RentalApplicationForm({ propertyId, tenantId, rentAmount, onSuccess }: RentalApplicationFormProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [moveInDate, setMoveInDate] = useState("")
    const [applicationLetter, setApplicationLetter] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            // Check if user already has a pending or active rental for this property
            const { data: existing, error: fetchError } = await supabase
                .from('rentals')
                .select('id')
                .eq('property_id', propertyId)
                .eq('tenant_id', tenantId)
                .in('status', ['pending', 'approved', 'active'])

            if (fetchError) throw fetchError

            if (existing && existing.length > 0) {
                throw new Error("You already have an active or pending application for this property.")
            }

            // Insert new rental record as 'pending'
            const { error: insertError } = await supabase
                .from('rentals')
                .insert({
                    property_id: propertyId,
                    tenant_id: tenantId,
                    status: 'pending',
                    rent_amount: rentAmount,
                    rent_start_date: moveInDate || null,
                    notes: applicationLetter.trim() || null,
                    application_letter: applicationLetter.trim() || null,
                })

            if (insertError) throw insertError

            onSuccess()
        } catch (err: unknown) {
            console.error(err)
            const message = err instanceof Error ? err.message : "Failed to submit application"
            setError(message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="space-y-2">
                <Label htmlFor="rent">Monthly Rent</Label>
                <Input
                    id="rent"
                    value={`₦${rentAmount.toLocaleString()}`}
                    disabled
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="moveIn">Proposed Move-in Date (Optional)</Label>
                <Input
                    id="moveIn"
                    type="date"
                    value={moveInDate}
                    onChange={(e) => setMoveInDate(e.target.value)}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="letter" className="flex items-center gap-1 font-semibold">
                    <FileText className="w-4 h-4 text-primary" /> Application Letter to Landlord
                </Label>
                <Textarea
                    id="letter"
                    placeholder="Introduce yourself and explain why you'd like to rent this property..."
                    value={applicationLetter}
                    onChange={(e) => setApplicationLetter(e.target.value)}
                    rows={4}
                />
            </div>

            <p className="text-xs text-muted-foreground">
                By clicking &quot;Confirm Application&quot;, you agree to share your application letter and profile details with the landlord.
            </p>

            <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                    </>
                ) : (
                    "Confirm Application"
                )}
            </Button>
        </form>
    )
}

