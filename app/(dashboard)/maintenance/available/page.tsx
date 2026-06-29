"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"
import {
    Briefcase,
    MapPin,
    Clock,
    AlertCircle,
    Search,
    Filter,
    MessageSquare,
    DollarSign,
    Loader2
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

const CATEGORIES = [
    "Plumbing", "Electrical", "Rewiring", "Carpentry",
    "Painting", "Tiling", "Roofing", "AC Repair",
    "Waste Disposal", "General Handyman"
]

export default function AvailableJobsPage() {
    const [jobs, setJobs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("All")
    const [provider, setProvider] = useState<any>(null)

    const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false)
    const [selectedJob, setSelectedJob] = useState<any>(null)
    const [quotePrice, setQuotePrice] = useState("")
    const [quoteMessage, setQuoteMessage] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        let mounted = true
        const fetchJobs = async () => {
            setLoading(true)
            try {
                // 1. Get current provider details to pre-filter
                const { data: { user } } = await supabase.auth.getUser()
                if (user && mounted) {
                    const { data: providerData } = await supabase
                        .from('service_providers')
                        .select('*')
                        .eq('user_id', user.id)
                        .single()

                    if (mounted) {
                        setProvider(providerData)
                        if (providerData) {
                            setSelectedCategory(providerData.category)
                        }
                    }
                }

                if (!mounted) return

                // 2. Fetch all pending jobs
                const { data: jobsData, error } = await supabase
                    .from('maintenance_requests')
                    .select(`
                        *,
                        property:properties (title, city, state),
                        images:request_images (image_url)
                    `)
                    .eq('status', 'pending')
                    .order('created_at', { ascending: false })

                if (error && mounted) throw error
                if (mounted) {
                    setJobs(jobsData || [])
                }
            } catch (error) {
                if (!mounted) return
                console.error("Error fetching jobs:", error)
            } finally {
                if (mounted) {
                    setLoading(false)
                }
            }
        }
        fetchJobs()
        return () => { mounted = false }
    }, [])

    const filteredJobs = jobs.filter(job => {
        const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.description.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = selectedCategory === "All" || job.category === selectedCategory
        return matchesSearch && matchesCategory
    })

    const handleOpenQuoteModal = (job: any) => {
        setSelectedJob(job)
        setIsQuoteModalOpen(true)
    }

    const handleSubmitQuote = async () => {
        if (!provider || !selectedJob) return
        setIsSubmitting(true)
        try {
            const { error } = await supabase
                .from('repair_quotes')
                .insert({
                    request_id: selectedJob.id,
                    provider_id: provider.id,
                    quoted_price: parseFloat(quotePrice),
                    message: quoteMessage,
                    status: 'pending'
                })

            if (error) throw error

            alert("Quote submitted successfully!")
            setIsQuoteModalOpen(false)
            setQuotePrice("")
            setQuoteMessage("")
        } catch (error: any) {
            console.error("Error submitting quote:", error)
            alert(error.message || "Failed to submit quote")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Available Jobs</h1>
                    <p className="text-muted-foreground">Find and bid on maintenance requests in your area.</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search jobs..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 shrink-0">
                    <select
                        className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                        <option value="All">All Categories</option>
                        {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            ) : filteredJobs.length === 0 ? (
                <Card className="p-12 text-center border-dashed">
                    <Briefcase className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
                    <h3 className="text-lg font-semibold">No jobs found</h3>
                    <p className="text-muted-foreground">Try adjusting your filters or search terms.</p>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredJobs.map((job) => (
                        <Card key={job.id} className="flex flex-col h-full hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3 border-b bg-gray-50/50 dark:bg-gray-950/50">
                                <div className="flex justify-between items-start gap-2">
                                    <Badge variant={
                                        job.priority === 'emergency' ? 'destructive' :
                                            job.priority === 'high' ? 'secondary' : 'outline'
                                    } className="capitalize">
                                        {job.priority}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {new Date(job.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <CardTitle className="mt-2 text-lg line-clamp-1">{job.title}</CardTitle>
                                <CardDescription className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {job.location_city}, {job.location_state}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 pt-4 space-y-4">
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Category</Label>
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                        <Briefcase className="h-4 w-4 text-blue-600" />
                                        {job.category}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Description</Label>
                                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                                        {job.description}
                                    </p>
                                </div>
                                {job.images && job.images.length > 0 && (
                                    <div className="flex gap-2 overflow-hidden rounded-md h-12">
                                        {job.images.slice(0, 3).map((img: any, idx: number) => (
                                            <img key={idx} src={img.image_url} alt="job" className="w-12 h-12 object-cover border" />
                                        ))}
                                        {job.images.length > 3 && (
                                            <div className="w-12 h-12 bg-gray-100 flex items-center justify-center text-[10px] text-muted-foreground">
                                                +{job.images.length - 3}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="pt-4 border-t gap-2">
                                <Button
                                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                                    onClick={() => handleOpenQuoteModal(job)}
                                >
                                    <MessageSquare className="h-4 w-4 mr-2" /> Send Quote
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            {/* Bidding Modal */}
            <Dialog open={isQuoteModalOpen} onOpenChange={setIsQuoteModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Submit a Quote</DialogTitle>
                        <DialogDescription>
                            Provide your estimate and a message to the landlord for:
                            <span className="font-bold text-gray-900 dark:text-gray-100 ml-1">
                                {selectedJob?.title}
                            </span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="price">Your Quoted Price (₦)</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="price"
                                    type="number"
                                    placeholder="0.00"
                                    className="pl-10"
                                    value={quotePrice}
                                    onChange={(e) => setQuotePrice(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="message">Message to Landlord</Label>
                            <Textarea
                                id="message"
                                placeholder="State why you are the best for this job, estimated time, etc."
                                className="min-h-[120px]"
                                value={quoteMessage}
                                onChange={(e) => setQuoteMessage(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsQuoteModalOpen(false)}>Cancel</Button>
                        <Button
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={handleSubmitQuote}
                            disabled={isSubmitting || !quotePrice}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Submitting...
                                </>
                            ) : "Submit Bid"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
