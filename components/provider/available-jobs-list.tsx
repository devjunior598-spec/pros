"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, MapPin, AlertCircle, Wrench, Clock } from "lucide-react"
import { QuoteDialog } from "./quote-dialog"

interface AvailableJobsListProps {
    providerId: string
    category: string
    locationState: string
}

export function AvailableJobsList({ providerId, category, locationState }: AvailableJobsListProps) {
    const [jobs, setJobs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [quotes, setQuotes] = useState<Record<string, any>>({})
    const [selectedJob, setSelectedJob] = useState<any>(null)
    const [isQuoteDialogOpen, setIsQuoteDialogOpen] = useState(false)

    const fetchJobs = useCallback(async () => {
        setLoading(true)
        try {
            // 1. Fetch available maintenance requests in provider's state matching category
            // We want requests that are 'pending' or 'in_review'
            const { data: requestsData, error: requestsError } = await supabase
                .from('maintenance_requests')
                .select('*, property:properties(address, city, state)')
                .in('status', ['pending', 'in_review'])
                .eq('category', category)
                .eq('location_state', locationState)
                .order('created_at', { ascending: false })

            if (requestsError) throw requestsError
            setJobs(requestsData || [])

            // 2. Fetch quotes already submitted by this provider
            const { data: quotesData, error: quotesError } = await supabase
                .from('repair_quotes')
                .select('*')
                .eq('provider_id', providerId)

            if (quotesError) throw quotesError

            // Map quotes by request_id for easy checking
            const quotesMap: Record<string, any> = {}
            if (quotesData) {
                quotesData.forEach(q => {
                    quotesMap[q.request_id] = q
                })
            }
            setQuotes(quotesMap)

        } catch (error) {
            console.error("Error fetching available jobs:", error)
        } finally {
            setLoading(false)
        }
    }, [category, locationState, providerId])

    useEffect(() => {
        if (providerId) {
            fetchJobs()
        }
    }, [fetchJobs, providerId])

    const handleOpenQuote = (job: any) => {
        setSelectedJob(job)
        setIsQuoteDialogOpen(true)
    }

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>

    if (jobs.length === 0) {
        return (
            <Card className="border-dashed bg-muted/20">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">No Jobs Available</h3>
                    <p className="text-muted-foreground mt-1 max-w-sm">
                        There are currently no open maintenance requests for {category} in your state ({locationState}).
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            {jobs.map(job => {
                const existingQuote = quotes[job.id]

                return (
                    <Card key={job.id} className="transition-all hover:shadow-md">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <CardTitle className="text-lg">{job.title}</CardTitle>
                                        <Badge variant={job.priority === 'emergency' ? 'destructive' : 'outline'}>
                                            {job.priority} priority
                                        </Badge>
                                    </div>
                                    <CardDescription className="flex items-center gap-1 mt-1">
                                        <MapPin className="h-3 w-3" />
                                        {job.location_city || job.property?.city}, {job.location_state || job.property?.state}
                                    </CardDescription>
                                </div>
                                <div className="text-right flex flex-col items-end gap-2">
                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {new Date(job.created_at).toLocaleDateString()}
                                    </div>
                                    {existingQuote ? (
                                        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                            Quote Submitted (₦{existingQuote.quoted_price?.toLocaleString()})
                                        </Badge>
                                    ) : (
                                        <Button
                                            size="sm"
                                            className="bg-blue-600 hover:bg-blue-700 w-full"
                                            onClick={() => handleOpenQuote(job)}
                                        >
                                            Submit Quote
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md line-clamp-2">
                                {job.description}
                            </p>
                        </CardContent>
                    </Card>
                )
            })}

            <QuoteDialog
                isOpen={isQuoteDialogOpen}
                onOpenChange={setIsQuoteDialogOpen}
                request={selectedJob}
                providerId={providerId}
                onSuccess={() => {
                    fetchJobs()
                }}
            />
        </div>
    )
}
