"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { User as SupabaseUser } from "@supabase/supabase-js"
import { Loader2, ArrowLeft, MapPin, BedDouble, Bath, User, Ruler, Home, CheckCircle2, Tag, CalendarDays, PhoneCall, Mail, Building, ChevronLeft, ChevronRight, ImageOff } from "lucide-react"
import Image from "next/image"

import { RentalApplicationForm } from "@/components/tenant/rental-application-form"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

interface PropertyDetails {
    id: string
    title: string
    description: string
    price: number
    address: string
    city: string
    state: string
    area?: string
    bedrooms: number
    bathrooms: number
    square_footage?: number
    amenities?: string[]
    images: string[]
    status: string
    type: string
    monthly_rent: number
    created_at: string
    landlord_id: string
    rentals: {
        id: string
        status: string
        tenant_id: string
        tenant: {
            name: string
            email: string
            phone: string
        }
    }[]
}

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
    available:   { label: "Available",   color: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25", dot: "bg-emerald-400" },
    rented:      { label: "Rented",      color: "bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/25",         dot: "bg-blue-400" },
    pending:     { label: "Pending",     color: "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/25",       dot: "bg-amber-400" },
    maintenance: { label: "Maintenance", color: "bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/25",   dot: "bg-orange-400" },
}

function placeholderGradient(id: string) {
    const gradients = [
        "from-violet-600/20 to-blue-600/20",
        "from-blue-600/20 to-cyan-600/20",
        "from-emerald-600/20 to-teal-600/20",
        "from-amber-600/20 to-orange-600/20",
        "from-pink-600/20 to-rose-600/20",
        "from-indigo-600/20 to-purple-600/20",
    ]
    return gradients[id.charCodeAt(0) % gradients.length]
}

export default function PropertyDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const [property, setProperty] = useState<PropertyDetails | null>(null)
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<SupabaseUser | null>(null)
    const [userRole, setUserRole] = useState<string | null>(null)
    const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false)
    const [hasApplied, setHasApplied] = useState(false)
    const [activeImg, setActiveImg] = useState(0)

    useEffect(() => {
        const fetchData = async () => {
            if (!params.id) return

            const { data: { user }, error: userError } = await supabase.auth.getUser()
            if (userError) console.error("Error getting user:", userError)
            setUser(user)

            if (user) {
                const { data: profiles } = await supabase
                    .from("profiles")
                    .select("role")
                    .eq("id", user.id)
                if (profiles && profiles.length > 0) setUserRole(profiles[0].role)
            }

            const { data, error } = await supabase
                .from("properties")
                .select(`
                    *,
                    rentals (
                        id,
                        status,
                        tenant_id,
                        tenant:profiles!tenant_id ( name, email, phone )
                    )
                `)
                .eq("id", params.id)
                .single()

            if (error) {
                console.error("Property fetch error:", error.message)
            } else {
                const typedData = data as unknown as PropertyDetails
                setProperty(typedData)
                if (user) {
                    const existingApp = typedData.rentals?.find(r => r.tenant_id === user.id)
                    if (existingApp) setHasApplied(true)
                }
            }
            setLoading(false)
        }

        fetchData()
    }, [params.id])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                    <p className="text-sm text-slate-400">Loading property…</p>
                </div>
            </div>
        )
    }

    if (!property) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 border border-slate-700">
                    <Home className="h-8 w-8 text-slate-500" />
                </div>
                <p className="text-slate-300 font-semibold">Property not found</p>
                <button onClick={() => router.back()} className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                    ← Go back
                </button>
            </div>
        )
    }

    const activeRental = property.rentals?.find(r => r.status === "approved" || r.status === "active")
    const isOwner = user?.id === property.landlord_id
    const isTenant = userRole === "tenant"
    const statusCfg = STATUS_CONFIG[property.status] ?? STATUS_CONFIG.available
    const images = property.images?.filter(Boolean) ?? []

    const handleApplySuccess = () => {
        setIsApplyDialogOpen(false)
        setHasApplied(true)
    }

    const prevImg = () => setActiveImg(i => (i - 1 + images.length) % images.length)
    const nextImg = () => setActiveImg(i => (i + 1) % images.length)

    return (
        <div className="flex-1 space-y-6 p-6 md:p-8 pt-6 max-w-7xl mx-auto">

            {/* ── Back button ── */}
            <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors group"
            >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                Back to Properties
            </button>

            <div className="grid gap-6 lg:grid-cols-3">

                {/* ── LEFT: Image + Details ── */}
                <div className="lg:col-span-2 space-y-5">

                    {/* Image gallery */}
                    <div className="relative rounded-2xl overflow-hidden border border-slate-700/40 bg-slate-800/60 shadow-xl">
                        {/* Main image */}
                        <div className="relative aspect-video w-full">
                            {images.length > 0 ? (
                                <Image
                                    src={images[activeImg]}
                                    alt={`${property.title} – image ${activeImg + 1}`}
                                    fill
                                    className="object-cover transition-opacity duration-300"
                                    priority
                                />
                            ) : (
                                <div className={`h-full w-full bg-gradient-to-br ${placeholderGradient(property.id)} flex flex-col items-center justify-center gap-3`}>
                                    <ImageOff className="h-12 w-12 text-slate-600" />
                                    <span className="text-xs text-slate-500">No images uploaded</span>
                                </div>
                            )}

                            {/* Status badge over image */}
                            <div className="absolute top-4 left-4">
                                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-md ${statusCfg.color}`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot} animate-pulse`} />
                                    {statusCfg.label}
                                </span>
                            </div>

                            {/* Image nav arrows */}
                            {images.length > 1 && (
                                <>
                                    <button
                                        onClick={prevImg}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/70 backdrop-blur-sm border border-slate-700/50 text-slate-200 hover:bg-slate-800 transition-all"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={nextImg}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/70 backdrop-blur-sm border border-slate-700/50 text-slate-200 hover:bg-slate-800 transition-all"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                    {/* Dot indicators */}
                                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                                        {images.map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setActiveImg(i)}
                                                className={`h-1.5 rounded-full transition-all duration-200 ${i === activeImg ? "w-5 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70"}`}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Thumbnail strip */}
                        {images.length > 1 && (
                            <div className="flex gap-2 p-3 overflow-x-auto scrollbar-none bg-slate-900/40">
                                {images.map((src, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setActiveImg(i)}
                                        className={`relative flex-shrink-0 h-16 w-24 rounded-lg overflow-hidden border-2 transition-all duration-150 ${i === activeImg ? "border-blue-500 scale-105 shadow-md shadow-blue-500/20" : "border-slate-700/40 hover:border-slate-500/60"}`}
                                    >
                                        <Image src={src} alt={`Thumbnail ${i + 1}`} fill className="object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Property info card */}
                    <div className="rounded-2xl border border-slate-700/40 bg-slate-800/60 backdrop-blur-sm shadow-lg p-6 space-y-5">
                        {/* Title + location */}
                        <div>
                            <h1 className="text-2xl font-bold text-slate-100 leading-tight">{property.title}</h1>
                            <div className="flex items-center gap-1.5 mt-2 text-sm text-slate-400">
                                <MapPin className="h-4 w-4 flex-shrink-0 text-slate-500" />
                                <span>{[property.address, property.area, property.city, property.state].filter(Boolean).join(", ")}</span>
                            </div>
                        </div>

                        {/* Stats row */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                                { icon: BedDouble, label: "Bedrooms",    value: property.bedrooms   ?? "—" },
                                { icon: Bath,      label: "Bathrooms",   value: property.bathrooms  ?? "—" },
                                { icon: Ruler,     label: "Sq. Footage", value: property.square_footage ? `${Number(property.square_footage).toLocaleString()} sqft` : "—" },
                                { icon: Building,  label: "Type",        value: property.type ?? "—" },
                            ].map(({ icon: Icon, label, value }) => (
                                <div key={label} className="flex flex-col items-center justify-center gap-1 rounded-xl bg-slate-700/30 border border-slate-700/40 py-3 px-2 text-center">
                                    <Icon className="h-4 w-4 text-slate-400" />
                                    <span className="text-sm font-semibold text-slate-100">{String(value)}</span>
                                    <span className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</span>
                                </div>
                            ))}
                        </div>

                        {/* Description */}
                        {property.description && (
                            <div className="space-y-2 border-t border-slate-700/40 pt-4">
                                <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Description</h2>
                                <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-line">{property.description}</p>
                            </div>
                        )}

                        {/* Amenities */}
                        {property.amenities && property.amenities.length > 0 && (
                            <div className="space-y-3 border-t border-slate-700/40 pt-4">
                                <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Amenities</h2>
                                <div className="flex flex-wrap gap-2">
                                    {property.amenities.map(a => (
                                        <span key={a} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-700/50 border border-slate-600/40 px-3 py-1 text-xs text-slate-300">
                                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                                            {a}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── RIGHT: Pricing + Tenant ── */}
                <div className="space-y-5">

                    {/* Pricing card */}
                    <div className="rounded-2xl border border-slate-700/40 bg-slate-800/60 backdrop-blur-sm shadow-lg p-6 space-y-4">
                        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Pricing</h2>

                        <div className="flex items-end gap-1">
                            <span className="text-3xl font-extrabold text-slate-100">₦{Number(property.price).toLocaleString()}</span>
                            <span className="text-slate-500 mb-1 text-sm">/month</span>
                        </div>

                        <div className="space-y-2 border-t border-slate-700/40 pt-4 text-sm">
                            {[
                                { icon: Tag,          label: "Property Type", value: property.type || "N/A" },
                                { icon: CalendarDays, label: "Listed",        value: new Date(property.created_at).toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" }) },
                            ].map(({ icon: Icon, label, value }) => (
                                <div key={label} className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Icon className="h-3.5 w-3.5" />
                                        {label}
                                    </div>
                                    <span className="text-slate-200 font-medium">{value}</span>
                                </div>
                            ))}
                        </div>

                        {/* Tenant CTA */}
                        {isTenant && !isOwner && (
                            <div className="border-t border-slate-700/40 pt-4">
                                {hasApplied ? (
                                    <div className="flex items-start gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-semibold text-emerald-300">Application Submitted</p>
                                            <p className="text-xs text-emerald-500 mt-0.5">The landlord will review your request shortly.</p>
                                        </div>
                                    </div>
                                ) : property.status === "available" ? (
                                    <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
                                        <DialogTrigger asChild>
                                            <button className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all duration-150 hover:shadow-blue-500/30">
                                                Apply Now
                                            </button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Apply for {property.title}</DialogTitle>
                                                <DialogDescription>Confirm your interest in renting this property.</DialogDescription>
                                            </DialogHeader>
                                            <RentalApplicationForm
                                                propertyId={property.id}
                                                tenantId={user?.id || ""}
                                                rentAmount={property.price}
                                                onSuccess={handleApplySuccess}
                                            />
                                        </DialogContent>
                                    </Dialog>
                                ) : (
                                    <button disabled className="w-full rounded-xl bg-slate-700 py-3 text-sm font-bold text-slate-500 cursor-not-allowed">
                                        Not Available
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Owner badge */}
                        {isOwner && (
                            <div className="border-t border-slate-700/40 pt-4">
                                <div className="flex items-center justify-center gap-2 rounded-xl bg-blue-600/10 border border-blue-500/20 py-2.5 px-4">
                                    <Building className="h-4 w-4 text-blue-400" />
                                    <span className="text-sm font-semibold text-blue-300">You own this property</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Current tenant card (owner only) */}
                    {isOwner && activeRental && (
                        <div className="rounded-2xl border border-slate-700/40 bg-slate-800/60 backdrop-blur-sm shadow-lg p-6 space-y-4">
                            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Current Tenant</h2>

                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600/20 border border-blue-500/20 flex-shrink-0">
                                    <User className="h-6 w-6 text-blue-400" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-semibold text-slate-100 truncate">{activeRental.tenant?.name || "Unknown"}</p>
                                    <span className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                                        activeRental.status === "approved" || activeRental.status === "active"
                                            ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
                                            : "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20"
                                    }`}>
                                        {activeRental.status}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2 border-t border-slate-700/40 pt-3 text-sm">
                                {activeRental.tenant?.email && (
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                                        <span className="truncate">{activeRental.tenant.email}</span>
                                    </div>
                                )}
                                {activeRental.tenant?.phone && (
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <PhoneCall className="h-3.5 w-3.5 flex-shrink-0" />
                                        <span>{activeRental.tenant.phone}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
