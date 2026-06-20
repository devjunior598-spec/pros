"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Star, Loader2 } from "lucide-react"

interface ReviewProviderDialogProps {
    job: any
    onSuccess: () => void
}

export function ReviewProviderDialog({ job, onSuccess }: ReviewProviderDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [rating, setRating] = useState(5)
    const [comment, setComment] = useState("")

    const handleSubmit = async () => {
        setLoading(true)
        const { error } = await supabase
            .from('service_reviews')
            .insert({
                job_id: job.id,
                provider_id: job.provider_id,
                landlord_id: job.landlord_id,
                rating: rating,
                comment: comment
            })

        if (error) {
            console.error("Error submitting review:", error)
            alert("Failed to submit review")
        } else {
            setOpen(false)
            onSuccess()
        }
        setLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline">Leave Review</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Review {job.provider?.name}</DialogTitle>
                    <DialogDescription>
                        How was the service? Your feedback helps others.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex justify-center space-x-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                className="focus:outline-none transition-transform hover:scale-110"
                            >
                                <Star
                                    className={`h-8 w-8 ${star <= rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`}
                                />
                            </button>
                        ))}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="comment">Comment</Label>
                        <Textarea
                            id="comment"
                            placeholder="Describe your experience..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={3}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Review
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
