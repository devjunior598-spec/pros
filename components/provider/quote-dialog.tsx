"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, DollarSign, MessageSquare } from "lucide-react"

interface QuoteDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    request: any
    providerId: string
    onSuccess: () => void
}

export function QuoteDialog({ isOpen, onOpenChange, request, providerId, onSuccess }: QuoteDialogProps) {
    const [loading, setLoading] = useState(false)
    const [price, setPrice] = useState("")
    const [message, setMessage] = useState("")
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const numericPrice = parseFloat(price.replace(/,/g, ''))
            if (isNaN(numericPrice) || numericPrice <= 0) {
                throw new Error("Please enter a valid price.")
            }

            const { error: submitError } = await supabase
                .from('repair_quotes')
                .insert({
                    request_id: request.id,
                    provider_id: providerId,
                    quoted_price: numericPrice,
                    message: message,
                    status: 'pending'
                })

            if (submitError) throw submitError

            onSuccess()
            onOpenChange(false)
            alert("Quote submitted successfully!")
            setPrice("")
            setMessage("")
        } catch (err: any) {
            console.error(err)
            setError(err.message || "Failed to submit quote.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Submit Quote</DialogTitle>
                    <DialogDescription>
                        Provide an estimated cost and a message to the landlord for:
                        <br /><span className="font-semibold text-foreground">{request?.title}</span>
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    {error && <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">{error}</div>}

                    <div className="space-y-2">
                        <Label htmlFor="price">Estimated Cost (₦)</Label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="price"
                                type="number"
                                placeholder="e.g. 50000"
                                className="pl-9"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                min="1"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="message">Message to Landlord</Label>
                        <div className="relative">
                            <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Textarea
                                id="message"
                                placeholder="Explain what is included in your quote..."
                                className="pl-9 min-h-[100px]"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Submit Quote
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
