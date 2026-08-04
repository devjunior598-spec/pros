"use client"

import { useState } from "react"
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

export function RentalApplicationForm({ propertyId, rentAmount, onSuccess }: RentalApplicationFormProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [moveInDate, setMoveInDate] = useState("")
    const [applicationLetter, setApplicationLetter] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/rentals/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    propertyId,
                    applicationLetter: applicationLetter.trim(),
                    rentStartDate: moveInDate || null,
                }),
            })
            const result = await response.json()
            if (!response.ok) throw new Error(result.error || 'Failed to submit application')

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
