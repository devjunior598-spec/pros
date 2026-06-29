"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Star,
    MessageSquare,
    Calendar,
    User,
    ThumbsUp,
    Loader2,
    Briefcase
} from "lucide-react"

export default function ProviderReviewsPage() {
    const [reviews, setReviews] = useState<any[]>([])
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true
        const fetchReviews = async () => {
            setLoading(true)
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (user && mounted) {
                    const { data: providerData } = await supabase
                        .from('service_providers')
                        .select('*')
                        .eq('user_id', user.id)
                        .single()

                    if (providerData && mounted) {
                        setStats({
                            rating: providerData.rating,
                            totalJobs: providerData.total_jobs_completed
                        })

                        const { data } = await supabase
                            .from('reviews')
                            .select(`
                                *,
                                reviewer:profiles!reviews_reviewer_id_fkey (name),
                                request:maintenance_requests (title)
                            `)
                            .eq('provider_id', providerData.id)
                            .order('created_at', { ascending: false })

                        if (mounted) {
                            setReviews(data || [])
                        }
                    }
                }
            } catch (error) {
                if (!mounted) return
                console.error("Error fetching reviews:", error)
            } finally {
                if (mounted) {
                    setLoading(false)
                }
            }
        }
        fetchReviews()
        return () => { mounted = false }
    }, [])

    return (
        <div className="space-y-6 pb-20">
            <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Client Reviews</h1>
                <p className="text-muted-foreground">Hear what landlords have to say about your work.</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            ) : (
                <>
                    <div className="grid gap-6 md:grid-cols-3">
                        <Card className="bg-blue-600 text-white border-none shadow-lg">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium opacity-80 uppercase tracking-wider">Average Rating</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-3">
                                    <div className="text-4xl font-bold">{stats?.rating || '0.0'}</div>
                                    <div className="flex flex-col">
                                        <div className="flex">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <Star
                                                    key={s}
                                                    className={`h-4 w-4 ${s <= Math.round(stats?.rating || 0) ? "fill-white" : "fill-blue-400 text-blue-400"}`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-xs opacity-70">Based on {reviews.length} reviews</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm bg-white dark:bg-gray-950">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Jobs Completed</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-3">
                                    <div className="text-4xl font-bold text-gray-900 dark:text-gray-100">{stats?.totalJobs || '0'}</div>
                                    <div className="p-2 bg-green-100 rounded-full">
                                        <Briefcase className="h-5 w-5 text-green-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm bg-white dark:bg-gray-950">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Satisfaction Rate</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-3">
                                    <div className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                                        {stats?.rating > 4 ? 'High' : stats?.rating > 3 ? 'Medium' : 'N/A'}
                                    </div>
                                    <div className="p-2 bg-blue-100 rounded-full">
                                        <ThumbsUp className="h-5 w-5 text-blue-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-6">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-blue-600" /> Recent Feedback
                        </h3>

                        {reviews.length === 0 ? (
                            <Card className="p-12 text-center border-dashed">
                                <p className="text-muted-foreground italic">No reviews yet. Complete your first job to start building your reputation!</p>
                            </Card>
                        ) : (
                            reviews.map((review) => (
                                <Card key={review.id} className="overflow-hidden border-none shadow-sm bg-white dark:bg-gray-950">
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                                                    <User className="h-6 w-6 text-gray-400" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-gray-100">{review.reviewer?.name}</p>
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {new Date(review.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex">
                                                {[1, 2, 3, 4, 5].map((s) => (
                                                    <Star
                                                        key={s}
                                                        className={`h-4 w-4 ${s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border-l-4 border-blue-500">
                                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed italic">
                                                    "{review.comment || 'No comment provided.'}"
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Badge variant="outline" className="h-5 text-[10px]">Job: {review.request?.title}</Badge>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
