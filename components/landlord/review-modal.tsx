"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Star, Loader2 } from "lucide-react"

interface ReviewModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    requestId: string
    providerId: string
    landlordId: string
    onReviewSubmitted: () => void
}

export function ReviewModal({
    isOpen,
    onOpenChange,
    requestId,
    providerId,
    landlordId,
    onReviewSubmitted
}: ReviewModalProps) {
    const [rating, setRating] = useState(5)
    const [comment, setComment] = useState("")
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async () => {
        setSubmitting(true)
        try {
            const { error } = await supabase
                .from('reviews')
                .insert({
                    request_id: requestId,
                    provider_id: providerId,
                    reviewer_id: landlordId,
                    rating,
                    comment
                })

            if (error) throw error

            // Update provider's overall rating (ideally this should be a DB trigger, but we can do a quick update here)
            // Fetch all reviews for this provider
            const { data: reviews } = await supabase
                .from('reviews')
                .select('rating')
                .eq('provider_id', providerId)

            if (reviews && reviews.length > 0) {
                const avgRating = reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length
                await supabase
                    .from('service_providers')
                    .update({
                        rating: parseFloat(avgRating.toFixed(1)),
                        total_jobs_completed: reviews.length // Assuming one review per job
                    })
                    .eq('id', providerId)
            }

            onReviewSubmitted()
            onOpenChange(false)
            alert("Thank you for your review!")
        } catch (error: any) {
            console.error("Error submitting review:", error)
            alert("Failed to submit review: " + error.message)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Rate the Service</DialogTitle>
                    <DialogDescription>
                        How was your experience with the provider? Your feedback helps the community.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex justify-center gap-2 py-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onClick={() => setRating(star)}
                                className="focus:outline-none transition-transform hover:scale-110"
                            >
                                <Star
                                    className={`h-10 w-10 ${star <= rating
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "text-gray-300"
                                        }`}
                                />
                            </button>
                        ))}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="comment">Your Feedback</Label>
                        <Textarea
                            id="comment"
                            placeholder="Share your experience (optional)..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Skip</Button>
                    <Button
                        onClick={handleSubmit}
                        className="bg-blue-600 hover:bg-blue-700"
                        disabled={submitting}
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Submitting...
                            </>
                        ) : "Submit Review"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
