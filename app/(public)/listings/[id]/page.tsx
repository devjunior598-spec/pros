"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { 
    Loader2, 
    ArrowLeft, 
    MapPin, 
    Bed, 
    Bath, 
    Share2, 
    ChevronLeft, 
    ChevronRight, 
    Bookmark, 
    User, 
    Check, 
    Calendar,
    MessageSquare,
    ShieldCheck,
    AlertCircle,
    Copy,
    Building2,
    Compass
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { PropertyReviews } from "@/components/listings/property-reviews"

interface PropertyDetails {
    id: string
    title: string
    description: string
    price: number
    address: string
    city: string
    state: string
    zip_code: string
    bedrooms: number
    bathrooms: number
    square_footage: number
    amenities: string[]
    images: string[]
    status: string
    type: string
    landlord_id: string
    created_at: string
    virtual_tour_url?: string
}

interface LandlordProfile {
    id: string
    name: string
    email: string
    phone?: string
    bio?: string
    is_verified?: boolean
    profile_image_url?: string
}

export default function PublicPropertyDetailsPage() {
    const params = useParams()
    const router = useRouter()
    
    // Property state
    const [property, setProperty] = useState<PropertyDetails | null>(null)
    const [landlord, setLandlord] = useState<LandlordProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [user, setUser] = useState<any>(null)
    
    // Bookmark state
    const [isSaved, setIsSaved] = useState(false)
    const [copied, setCopied] = useState(false)
    
    // Inspection modal state
    const [isBookingOpen, setIsBookingOpen] = useState(false)
    const [bookingDate, setBookingDate] = useState("")
    const [bookingTime, setBookingTime] = useState("")
    const [bookingLoading, setBookingLoading] = useState(false)

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
        }
        fetchUser()
    }, [])

    useEffect(() => {
        const fetchPropertyAndLandlord = async () => {
            if (!params.id) return

            setLoading(true)
            try {
                // 1. Fetch Property
                const { data: propData, error: propError } = await supabase
                    .from('properties')
                    .select('*')
                    .eq('id', params.id)
                    .single()

                if (propError) throw propError
                const typedProperty = propData as PropertyDetails
                setProperty(typedProperty)

                // Check bookmark status
                const saved = localStorage.getItem("saved_properties")
                if (saved) {
                    const savedList = JSON.parse(saved) as string[]
                    setIsSaved(savedList.includes(typedProperty.id))
                }

                // 2. Fetch Landlord Profile
                if (typedProperty.landlord_id) {
                    const { data: profileData, error: profileError } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', typedProperty.landlord_id)
                        .maybeSingle()

                    if (profileError) {
                        console.error("Error fetching landlord profile:", profileError)
                    } else if (profileData) {
                        setLandlord(profileData as LandlordProfile)
                    }
                }
            } catch (error: any) {
                console.error("Error fetching details:", error?.message || error)
            } finally {
                setLoading(false)
            }
        }

        fetchPropertyAndLandlord()
    }, [params.id])

    const nextImage = () => {
        if (!property?.images) return
        setCurrentImageIndex((prev) => (prev + 1) % property.images.length)
    }

    const prevImage = () => {
        if (!property?.images) return
        setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length)
    }

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const toggleSave = () => {
        if (!property) return
        const saved = localStorage.getItem("saved_properties")
        let savedList: string[] = []
        if (saved) {
            savedList = JSON.parse(saved)
        }

        if (isSaved) {
            savedList = savedList.filter(id => id !== property.id)
            setIsSaved(false)
        } else {
            savedList.push(property.id)
            setIsSaved(true)
        }
        localStorage.setItem("saved_properties", JSON.stringify(savedList))
        window.dispatchEvent(new Event("saved_properties_changed"))
    }

    const getOrCreateConversation = async (tenantId: string, landlordId: string) => {
        // Check for existing conversation
        const { data: existingConv } = await supabase
            .from('conversations')
            .select('id')
            .eq('tenant_id', tenantId)
            .eq('landlord_id', landlordId)
            .maybeSingle()

        if (existingConv) {
            return existingConv.id
        }

        // Create new conversation
        const { data: newConv, error } = await supabase
            .from('conversations')
            .insert({
                tenant_id: tenantId,
                landlord_id: landlordId
            })
            .select()
            .single()

        if (error) throw error
        return newConv.id
    }

    const handleMessageLandlord = async () => {
        if (!user) {
            router.push("/login")
            return
        }

        if (!property) return

        try {
            const convId = await getOrCreateConversation(user.id, property.landlord_id)
            router.push(`/messages?convId=${convId}`)
        } catch (error) {
            console.error("Error creating chat:", error)
            alert("Failed to contact landlord. Please try again.")
        }
    }

    const handleBookInspection = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) {
            router.push("/login")
            return
        }

        if (!property || !bookingDate || !bookingTime) return

        setBookingLoading(true)
        try {
            const convId = await getOrCreateConversation(user.id, property.landlord_id)
            
            // Format message
            const inspectionMessage = `📅 **Inspection Booking Request**\nProperty: *${property.title}*\nDate: *${bookingDate}*\nTime: *${bookingTime}*\n\n*(Sent via Book Inspection request)*`

            const { error: msgError } = await supabase
                .from('messages')
                .insert({
                    conversation_id: convId,
                    sender_id: user.id,
                    message: inspectionMessage
                })

            if (msgError) throw msgError

            alert("Inspection request sent! Check your Messages for the landlord's response.")
            setIsBookingOpen(false)
            router.push(`/messages?convId=${convId}`)
        } catch (error: any) {
            console.error("Error booking inspection:", error)
            alert(`Failed to send inspection request: ${error.message}`)
        } finally {
            setBookingLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="container flex justify-center items-center min-h-[60vh] bg-slate-50 dark:bg-slate-950">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            </div>
        )
    }

    if (!property) {
        return (
            <div className="container py-20 text-center bg-slate-50 dark:bg-slate-950 min-h-[80vh] flex flex-col justify-center items-center">
                <Building2 className="h-12 w-12 text-slate-400 mb-4" />
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Property Not Found</h2>
                <p className="text-slate-450 dark:text-slate-400 text-xs mt-2 max-w-sm">The property you are looking for might have been unlisted, rented, or removed from the directory.</p>
                <Button className="mt-6 rounded-xl bg-blue-600 text-white font-bold" onClick={() => router.push('/listings')}>
                    Back to Listings
                </Button>
            </div>
        )
    }

    const hasImages = property.images && property.images.length > 0
    const multipleImages = hasImages && property.images.length > 1
    const amenitiesList = property.amenities || []

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 font-sans">
            <div className="container py-6 sm:py-8 md:py-12 text-slate-900 dark:text-slate-100">
                
                {/* Back and Action Buttons */}
                <div className="flex items-center justify-between mb-6 sm:mb-8">
                    <Button variant="ghost" size="sm" onClick={() => router.back()} className="rounded-xl font-bold dark:hover:bg-slate-900 min-h-[44px]">
                        <ArrowLeft className="mr-1.5 h-4 w-4" />
                        <span className="hidden sm:inline">Back to Listings</span>
                        <span className="sm:hidden">Back</span>
                    </Button>
                    <div className="flex items-center gap-2">
                        {/* Bookmark Button */}
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={toggleSave}
                            className={cn(
                                "rounded-xl font-bold dark:bg-slate-900 border-slate-200 dark:border-slate-800",
                                isSaved && "bg-red-500 hover:bg-red-600 border-red-500 text-white dark:bg-red-500 dark:hover:bg-red-600"
                            )}
                        >
                            <Bookmark className={cn("mr-2 h-4 w-4", isSaved && "fill-current")} />
                            {isSaved ? "Saved" : "Save"}
                        </Button>

                        {/* Share Button */}
                        <Button variant="outline" size="sm" onClick={handleShare} className="rounded-xl font-bold dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                            {copied ? (
                                <>
                                    <Check className="mr-2 h-4 w-4 text-emerald-500" />
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <Share2 className="mr-2 h-4 w-4" />
                                    Share
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 sm:gap-8 lg:grid-cols-12">
                    
                    {/* Left Column: Image Gallery and Info */}
                    <div className="lg:col-span-8 space-y-8">
                        
                        {/* Image Gallery Showcase */}
                        <div className="space-y-4">
                            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 group">
                                {hasImages ? (
                                    <>
                                        <Image
                                            src={property.images[currentImageIndex]}
                                            alt={property.title}
                                            fill
                                            className="object-cover transition-opacity duration-300"
                                            priority
                                        />
                                        {multipleImages && (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 text-white hover:bg-black/60 rounded-full h-9 w-9 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity min-h-[44px] min-w-[44px]"
                                                    onClick={prevImage}
                                                >
                                                    <ChevronLeft className="h-5 w-5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 text-white hover:bg-black/60 rounded-full h-9 w-9 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity min-h-[44px] min-w-[44px]"
                                                    onClick={nextImage}
                                                >
                                                    <ChevronRight className="h-5 w-5" />
                                                </Button>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex h-full items-center justify-center bg-slate-100 dark:bg-slate-900/50">
                                        <Building2 className="h-16 w-16 text-slate-300 dark:text-slate-800" />
                                    </div>
                                )}
                                
                                <Badge className="absolute top-4 right-4 text-xs uppercase font-extrabold px-3 py-1 rounded-lg border bg-blue-600 border-blue-500 text-white">
                                    {property.type}
                                </Badge>
                            </div>

                            {/* Thumbnail Selector */}
                            {multipleImages && (
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                                    {property.images.map((img, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentImageIndex(i)}
                                            className={cn(
                                                "relative flex-shrink-0 w-16 sm:w-24 aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all",
                                                i === currentImageIndex 
                                                    ? "border-blue-600 shadow-md scale-95" 
                                                    : "border-transparent opacity-60 hover:opacity-100"
                                            )}
                                        >
                                            <Image
                                                src={img}
                                                alt={`${property.title} thumbnail ${i + 1}`}
                                                fill
                                                className="object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Title and location */}
                        <div className="space-y-4 border-b border-slate-200 dark:border-slate-850 pb-6">
                            <div className="flex items-center text-blue-600 dark:text-blue-400 text-[10px] uppercase font-bold tracking-widest gap-1">
                                <ShieldCheck className="h-4 w-4" /> PRMS verified property
                            </div>
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                                {property.title}
                            </h1>
                            <div className="flex items-center text-sm font-semibold text-slate-500 dark:text-slate-400 gap-1.5">
                                <MapPin className="h-4.5 w-4.5 text-red-500" />
                                <span>{property.address && `${property.address}, `}{property.city}, {property.state || 'Nigeria'}</span>
                            </div>
                        </div>

                        {/* Specifications Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-white dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Property Type</span>
                                <span className="font-extrabold text-sm text-slate-855 dark:text-slate-200">{property.type || 'Apartment'}</span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Bedrooms</span>
                                <div className="flex items-center gap-1.5 text-slate-855 dark:text-slate-200 font-extrabold text-sm">
                                    <Bed className="h-4 w-4 text-blue-500" />
                                    <span>{property.bedrooms ?? '-'} Rooms</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Bathrooms</span>
                                <div className="flex items-center gap-1.5 text-slate-855 dark:text-slate-200 font-extrabold text-sm">
                                    <Bath className="h-4 w-4 text-blue-500" />
                                    <span>{property.bathrooms ?? '-'} Baths</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Area Size</span>
                                <div className="flex items-center gap-1.5 text-slate-855 dark:text-slate-200 font-extrabold text-sm">
                                    <Compass className="h-4 w-4 text-blue-500" />
                                    <span>{property.square_footage ? `${property.square_footage} sqft` : '-'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-3">
                            <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">About This Property</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed whitespace-pre-line">
                                {property.description || "No description provided for this listing."}
                            </p>
                        </div>

                        {/* Amenities checklist */}
                        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-850">
                            <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">Amenities Offered</h3>
                            {amenitiesList.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {amenitiesList.map((amenity, i) => (
                                        <div key={i} className="flex items-center gap-2 p-3 bg-white dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800/50 rounded-xl">
                                            <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                                <Check className="h-3 w-3" />
                                            </div>
                                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{amenity}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-slate-450 dark:text-slate-500">No specific amenities declared by the landlord.</p>
                            )}
                        </div>

                        {/* Reviews Section */}
                        <PropertyReviews propertyId={property.id} currentUserId={user?.id} />

                    </div>

                    {/* Right Column: Pricing, Booking & Landlord Profile Cards */}
                    <div className="lg:col-span-4 space-y-6">
                        
                        {/* Action Card */}
                        <Card className="border border-slate-200/60 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/85 backdrop-blur shadow-xl rounded-2xl overflow-hidden font-sans">
                            <CardHeader className="pb-4">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-0.5">Annual Rent</span>
                                <CardTitle className="text-3xl font-black text-blue-600 dark:text-blue-400">
                                    ₦{property.price.toLocaleString()}
                                    <span className="text-xs font-normal text-slate-400 ml-1">/ year</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center text-xs border-b border-slate-100 dark:border-slate-800 pb-3">
                                    <span className="font-semibold text-slate-400">Listing Status</span>
                                    <Badge className={cn("uppercase text-[9px] font-bold px-2 py-0.5 rounded-lg border", 
                                        property.status === 'available' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" : "bg-yellow-500/10 border-yellow-500/20 text-yellow-600"
                                    )}>
                                        {property.status}
                                    </Badge>
                                </div>

                                <div className="space-y-2 pt-2">
                                    {/* Apply trigger */}
                                    <Button
                                        className="w-full h-11 text-sm font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/10"
                                        onClick={() => {
                                            localStorage.setItem("pending_application_id", property.id)
                                            router.push("/signup")
                                        }}
                                        disabled={property.status !== 'available'}
                                    >
                                        Apply for Lease
                                    </Button>

                                    {/* Message Landlord */}
                                    <Button
                                        variant="outline"
                                        className="w-full h-11 text-sm font-bold rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-900"
                                        onClick={handleMessageLandlord}
                                    >
                                        <MessageSquare className="mr-2 h-4 w-4" /> Message Landlord
                                    </Button>

                                    {/* Book Inspection */}
                                    <Button
                                        variant="secondary"
                                        className="w-full h-11 text-sm font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white"
                                        onClick={() => setIsBookingOpen(true)}
                                    >
                                        <Calendar className="mr-2 h-4 w-4" /> Book Inspection
                                    </Button>

                                    {/* Virtual Tour Button */}
                                    {property.virtual_tour_url && (
                                        <a href={property.virtual_tour_url} target="_blank" rel="noopener noreferrer">
                                            <Button variant="outline" className="w-full h-11 text-sm font-bold rounded-xl border-slate-800 dark:bg-slate-900">
                                                <Compass className="mr-2 h-4 w-4" /> Take Virtual Tour
                                            </Button>
                                        </a>
                                    )}
                                </div>
                                <p className="text-[10px] text-center text-slate-400 leading-normal">
                                    Account creation and identity verification is required to sign leases and send payment escrows.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Landlord Profile Card */}
                        <Card className="border border-slate-200/60 dark:border-slate-800/80 bg-white/85 dark:bg-slate-900/85 backdrop-blur shadow-md rounded-2xl font-sans">
                            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                                <CardTitle className="text-sm font-extrabold uppercase tracking-widest text-slate-400">Landlord Profile</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-5 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-slate-200 dark:border-slate-800 flex items-center justify-center bg-slate-100 dark:bg-slate-900 text-slate-400">
                                        {landlord?.profile_image_url ? (
                                            <img src={landlord.profile_image_url} alt="Profile" className="h-full w-full object-cover" />
                                        ) : (
                                            <User className="h-6 w-6" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1">
                                            {landlord?.name || 'Vetted Landlord'}
                                            {landlord?.is_verified && (
                                                <span title="Identity Verified">
                                                    <ShieldCheck className="h-4 w-4 text-blue-500" />
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">PRMS Account Owner</p>
                                    </div>
                                </div>

                                {landlord?.bio && (
                                    <p className="text-xs text-slate-450 dark:text-slate-400 leading-relaxed italic border-t border-slate-100 dark:border-slate-800 pt-3">
                                        "{landlord.bio}"
                                    </p>
                                )}

                                <div className="text-[10px] font-bold text-slate-400 space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-3">
                                    <div className="flex justify-between">
                                        <span>Identity Checked:</span>
                                        <span className="text-blue-500 uppercase">{landlord?.is_verified ? "Yes" : "Pending Approval"}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Safety Escrow Tips Card */}
                        <Card className="border border-slate-200/60 dark:border-slate-800/80 bg-white/85 dark:bg-slate-900/85 backdrop-blur shadow-md rounded-2xl font-sans">
                            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                                <CardTitle className="text-sm font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1.5"><AlertCircle className="h-4 w-4 text-blue-500" /> Secure Escrow Tips</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <ul className="text-xs space-y-2.5 text-slate-500 dark:text-slate-400 list-disc pl-4 font-semibold leading-relaxed">
                                    <li>Always execute inspections before transfer.</li>
                                    <li>Use our secure wallet ledger for payments.</li>
                                    <li>No landlord can access rent payouts prior to digital lease execution.</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>

                </div>
            </div>

            {/* Book Inspection Expanded Modal (Dialog-like popup) */}
            {isBookingOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl overflow-hidden font-sans p-6 space-y-5 animate-in zoom-in-95 duration-200 text-slate-900 dark:text-slate-100">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-black leading-none">Schedule Inspection</h3>
                                <p className="text-xs text-slate-400 mt-1.5">Select a convenient date and time to visit.</p>
                            </div>
                            <button onClick={() => setIsBookingOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleBookInspection} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="date" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date of Inspection</Label>
                                <Input 
                                    id="date" 
                                    type="date" 
                                    required 
                                    min={new Date().toISOString().split("T")[0]}
                                    value={bookingDate} 
                                    onChange={(e) => setBookingDate(e.target.value)}
                                    className="h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="time" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Convenient Time</Label>
                                <Input 
                                    id="time" 
                                    type="time" 
                                    required 
                                    value={bookingTime} 
                                    onChange={(e) => setBookingTime(e.target.value)}
                                    className="h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl"
                                />
                            </div>

                            <Button 
                                type="submit" 
                                disabled={bookingLoading} 
                                className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm tracking-wide mt-2"
                            >
                                {bookingLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending request...
                                    </>
                                ) : (
                                    "Request Inspection"
                                )}
                            </Button>
                        </form>
                    </div>
                </div>
            )}

        </div>
    )
}

// X Icon placeholder helper
function X(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
        </svg>
    )
}
