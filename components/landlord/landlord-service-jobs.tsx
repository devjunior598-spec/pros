"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, Calendar, MapPin, Briefcase, CheckCircle, XCircle, Star } from "lucide-react"
import { ReviewProviderDialog } from "./review-provider-dialog"

interface LandlordServiceJobsProps {
    landlordId: string
}

export function LandlordServiceJobs({ landlordId }: LandlordServiceJobsProps) {
    const [jobs, setJobs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [processingId, setProcessingId] = useState<string | null>(null)

    // Check if job needs review (completed but no review yet)
    // We could do this with a complex join or just fetch reviews separately.
    // For simplicity, let's just show the button if it's completed.
    // Ideally, we'd check `service_reviews` table.
    // Let's modify the fetch to include review check if possible, or just fetch all user reviews.
    const [reviewedJobIds, setReviewedJobIds] = useState<Set<string>>(new Set())

    const fetchJobs = async () => {
        setLoading(true)

        // Parallel fetch: jobs and reviews
        const [jobsResult, reviewsResult] = await Promise.all([
            supabase
                .from('service_jobs')
                .select(`
                    *,
                    provider:service_providers(name, category, phone),
                    property:properties(title, address)
                `)
                .eq('landlord_id', landlordId)
                .order('created_at', { ascending: false }),

            supabase
                .from('service_reviews')
                .select('job_id')
                .eq('landlord_id', landlordId)
        ])

        if (jobsResult.error) {
            console.error("Error fetching jobs:", jobsResult.error)
        } else {
            setJobs(jobsResult.data || [])
        }

        if (reviewsResult.data) {
            setReviewedJobIds(new Set(reviewsResult.data.map(r => r.job_id)))
        }

        setLoading(false)
    }

    useEffect(() => {
        if (landlordId) {
            fetchJobs()
        }
    }, [landlordId])

    const updateStatus = async (jobId: string, newStatus: string) => {
        setProcessingId(jobId)
        const { error } = await supabase
            .from('service_jobs')
            .update({ status: newStatus })
            .eq('id', jobId)

        if (error) {
            console.error("Error updating job:", error)
            alert("Failed to update status")
        } else {
            // Optimistic update
            setJobs(jobs.map(j => j.id === jobId ? { ...j, status: newStatus } : j))
        }
        setProcessingId(null)
    }

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'completed': return 'default'
            case 'accepted': return 'secondary' // green/blue
            case 'cancelled': return 'destructive'
            default: return 'outline' // pending
        }
    }

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>

    if (jobs.length === 0) {
        return (
            <div className="text-center p-8 border border-dashed rounded-lg text-muted-foreground bg-muted/20">
                <Briefcase className="mx-auto h-10 w-10 mb-3 opacity-20" />
                <p>You haven't hired any providers yet.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {jobs.map((job) => (
                <Card key={job.id}>
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-base">{job.title}</CardTitle>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="secondary" className="text-xs">
                                        {job.provider?.category}
                                    </Badge>
                                    <span className="text-sm font-medium text-muted-foreground">
                                        {job.provider?.name}
                                    </span>
                                </div>
                            </div>
                            <Badge variant={getStatusVariant(job.status) as any}>
                                {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm mb-3">{job.description}</p>
                        <div className="flex flex-col sm:flex-row gap-3 text-xs text-muted-foreground mb-4">
                            {job.property && (
                                <div className="flex items-center">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {job.property.title}
                                </div>
                            )}
                            {job.scheduled_date && (
                                <div className="flex items-center">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    Scheduled: {new Date(job.scheduled_date).toLocaleDateString()}
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 justify-end">
                            {/* Actions for Pending */}
                            {job.status === 'pending' && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-destructive hover:bg-destructive/10 border-destructive/20"
                                    onClick={() => updateStatus(job.id, 'cancelled')}
                                    disabled={processingId === job.id}
                                >
                                    {processingId === job.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="mr-1 h-4 w-4" />}
                                    Cancel Request
                                </Button>
                            )}

                            {/* Actions for Accepted/InProgress (Logic can be added) */}

                            {/* Turn to Completed */}
                            {job.status !== 'completed' && job.status !== 'cancelled' && (
                                <Button
                                    size="sm"
                                    onClick={() => updateStatus(job.id, 'completed')}
                                    disabled={processingId === job.id}
                                >
                                    {processingId === job.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="mr-1 h-4 w-4" />}
                                    Mark Completed
                                </Button>
                            )}

                            {/* Review Action */}
                            {job.status === 'completed' && !reviewedJobIds.has(job.id) && (
                                <ReviewProviderDialog
                                    job={job}
                                    onSuccess={() => {
                                        fetchJobs() // Refresh to update reviewed state
                                    }}
                                />
                            )}

                            {/* Reviewed Indicator */}
                            {job.status === 'completed' && reviewedJobIds.has(job.id) && (
                                <span className="text-sm text-muted-foreground flex items-center">
                                    <Star className="h-4 w-4 mr-1 text-yellow-500 fill-yellow-500" />
                                    Reviewed
                                </span>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
