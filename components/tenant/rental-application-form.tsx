"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

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

            <p className="text-sm text-muted-foreground">
                By clicking &quot;Submit Application&quot;, you agree to share your profile details with the landlord for review.
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
