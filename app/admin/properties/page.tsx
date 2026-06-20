"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Search,
    Building,
    MapPin,
    User,
    MoreVertical,
    ExternalLink,
    Ban,
    Loader2,
    Users,
    CheckCircle,
    CheckCircle2
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"

type ApprovalFilter = 'all' | 'approved' | 'pending' | 'suspended'

export default function AdminPropertiesPage() {
    const [properties, setProperties] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [approvalFilter, setApprovalFilter] = useState<ApprovalFilter>('all')
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    // Pagination state
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const PAGE_SIZE = 12

    const fetchProperties = async (currentPage = 1) => {
        setLoading(true)
        try {
            const res = await fetch(`/api/admin/properties?page=${currentPage}&limit=${PAGE_SIZE}`)
            if (!res.ok) throw new Error("Failed to fetch properties")
            const data = await res.json()
            setProperties(data.properties || [])
            setTotalPages(data.totalPages || 1)
        } catch (error) {
            console.error("Error fetching properties:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchProperties(page)
    }, [page])

    const handleApprove = async (propertyId: string) => {
        if (!confirm('Approve this property listing? It will be visible to all users.')) return
        setActionLoading(propertyId)
        try {
            const { error } = await supabase
                .from('properties')
                .update({ is_approved: true })
                .eq('id', propertyId)
            if (error) throw error
            setProperties(prev =>
                prev.map(p => p.id === propertyId ? { ...p, is_approved: true } : p)
            )
        } catch (err: any) {
            alert(err.message || 'Failed to approve property')
        } finally {
            setActionLoading(null)
        }
    }

    const handleUnapprove = async (propertyId: string) => {
        if (!confirm('Suspend/unapprove this property? It will be hidden from listings.')) return
        setActionLoading(propertyId)
        try {
            const { error } = await supabase
                .from('properties')
                .update({ is_approved: false })
                .eq('id', propertyId)
            if (error) throw error
            setProperties(prev =>
                prev.map(p => p.id === propertyId ? { ...p, is_approved: false } : p)
            )
        } catch (err: any) {
            alert(err.message || 'Failed to suspend property')
        } finally {
            setActionLoading(null)
        }
    }

    const handleSuspend = async (propertyId: string, currentStatus: string) => {
        const isSuspending = currentStatus !== 'suspended'
        if (!confirm(`Are you sure you want to ${isSuspending ? 'suspend' : 'activate'} this property listing?`)) return

        try {
            const res = await fetch('/api/admin/properties/suspend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ propertyId, suspend: isSuspending })
            })
            if (!res.ok) throw new Error("Failed to update status")
            alert(`Property ${isSuspending ? 'suspended' : 'activated'}.`)
            fetchProperties(page)
        } catch (error: any) {
            alert(error.message)
        }
    }

    const getApprovalStatus = (property: any): 'approved' | 'pending' | 'suspended' => {
        if (property.status === 'suspended') return 'suspended'
        if (property.is_approved === true) return 'approved'
        return 'pending'
    }

    const filteredProperties = properties.filter(p => {
        const matchesSearch =
            p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.landlord?.name?.toLowerCase().includes(searchTerm.toLowerCase())

        if (!matchesSearch) return false
        if (approvalFilter === 'all') return true

        const status = getApprovalStatus(p)
        return status === approvalFilter
    })

    const filterTabs: { key: ApprovalFilter; label: string }[] = [
        { key: 'all', label: 'All' },
        { key: 'approved', label: 'Approved' },
        { key: 'pending', label: 'Pending' },
        { key: 'suspended', label: 'Suspended' },
    ]

    const approvalCounts = {
        all: properties.length,
        approved: properties.filter(p => getApprovalStatus(p) === 'approved').length,
        pending: properties.filter(p => getApprovalStatus(p) === 'pending').length,
        suspended: properties.filter(p => getApprovalStatus(p) === 'suspended').length,
    }

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Property Management</h1>
                    <p className="text-muted-foreground">Monitor all listings and occupancy status across the platform.</p>
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search properties or addresses..."
                        className="pl-10 rounded-xl bg-white dark:bg-gray-950 border-none shadow-sm focus:ring-2 ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 flex-wrap">
                {filterTabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setApprovalFilter(tab.key)}
                        className={cn(
                            "px-4 py-1.5 rounded-xl text-sm font-bold transition-all border",
                            approvalFilter === tab.key
                                ? "bg-blue-600 text-white border-blue-600 shadow-md"
                                : "bg-white dark:bg-gray-950 text-gray-500 border-gray-200 dark:border-gray-800 hover:border-blue-400"
                        )}
                    >
                        {tab.label}
                        <span className={cn(
                            "ml-1.5 text-[10px] font-black px-1.5 py-0.5 rounded-full",
                            approvalFilter === tab.key
                                ? "bg-white/20 text-white"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                        )}>
                            {approvalCounts[tab.key]}
                        </span>
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                    </div>
                ) : filteredProperties.length === 0 ? (
                    <div className="col-span-full py-10 text-center text-muted-foreground italic">
                        No properties found matching your criteria.
                    </div>
                ) : (
                    filteredProperties.map((property) => {
                        const activeRental = property.rentals?.find((r: any) => r.status === 'active')
                        const approvalStatus = getApprovalStatus(property)
                        const isActioning = actionLoading === property.id

                        return (
                            <Card key={property.id} className="border-none shadow-sm bg-white dark:bg-gray-950 overflow-hidden group">
                                <div className="aspect-video w-full bg-gray-100 dark:bg-gray-900 relative">
                                    {property.image_url ? (
                                        <img src={property.image_url} alt={property.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex items-center justify-center w-full h-full text-gray-300">
                                            <Building className="h-10 w-10" />
                                        </div>
                                    )}
                                    {/* Occupancy badge */}
                                    <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
                                        <Badge className={cn(
                                            activeRental ? "bg-green-500" : "bg-blue-500"
                                        )}>
                                            {activeRental ? "Occupied" : "Vacant"}
                                        </Badge>
                                        {/* Approval status badge */}
                                        <Badge className={cn(
                                            "text-[9px] uppercase font-extrabold px-2 py-0.5 rounded-md border",
                                            approvalStatus === 'approved'
                                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                                : approvalStatus === 'suspended'
                                                ? "bg-red-500/20 text-red-400 border-red-500/30"
                                                : "bg-yellow-500/20 text-yellow-500 border-yellow-500/30"
                                        )}>
                                            {approvalStatus === 'approved' ? '✓ Approved' : approvalStatus === 'suspended' ? 'Suspended' : '● Pending'}
                                        </Badge>
                                    </div>
                                </div>
                                <CardContent className="p-5">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-lg leading-tight line-clamp-1">{property.title}</h3>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2" disabled={isActioning}>
                                                    {isActioning ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <MoreVertical className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-52 rounded-xl border-none shadow-xl">
                                                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                                    Actions
                                                </DropdownMenuLabel>
                                                <DropdownMenuItem asChild className="gap-2 cursor-pointer">
                                                    <Link href={`/listings/${property.id}`} target="_blank">
                                                        <ExternalLink className="h-4 w-4" /> View Listing
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="gap-2 cursor-pointer">
                                                    <User className="h-4 w-4" /> Owner Details
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                {/* Approve action */}
                                                <DropdownMenuItem
                                                    className="gap-2 cursor-pointer text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50 dark:focus:bg-emerald-900/20"
                                                    onClick={() => handleApprove(property.id)}
                                                    disabled={approvalStatus === 'approved'}
                                                >
                                                    <CheckCircle className="h-4 w-4" />
                                                    {approvalStatus === 'approved' ? 'Already Approved' : 'Approve Listing'}
                                                </DropdownMenuItem>
                                                {/* Suspend/Unapprove action */}
                                                <DropdownMenuItem
                                                    className="gap-2 cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-900/20"
                                                    onClick={() => handleUnapprove(property.id)}
                                                    disabled={approvalStatus === 'suspended'}
                                                >
                                                    <Ban className="h-4 w-4" />
                                                    {approvalStatus === 'suspended' ? 'Already Suspended' : 'Suspend / Unapprove'}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    <div className="space-y-3 text-sm">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <MapPin className="h-3 w-3" />
                                            <span className="line-clamp-1">{property.address}</span>
                                        </div>

                                        <div className="flex items-center justify-between pt-2 border-t">
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 w-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                                    <User className="h-3 w-3 text-gray-500" />
                                                </div>
                                                <span className="text-xs font-medium">{property.landlord?.name}</span>
                                            </div>
                                            <div className="font-bold text-blue-600">
                                                ₦{property.price?.toLocaleString()}
                                            </div>
                                        </div>

                                        {activeRental && (
                                            <div className="bg-green-50 dark:bg-green-900/10 p-2 rounded-lg flex items-center gap-2">
                                                <Users className="h-3 w-3 text-green-600" />
                                                <span className="text-[10px] text-green-700 font-medium">Tenant: {activeRental.tenant?.name}</span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })
                )}
            </div>

            {!loading && totalPages > 1 && (
                <div className="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-sm text-muted-foreground hidden md:block">
                        Showing page {page} of {totalPages}
                    </p>
                    <div className="flex gap-2 w-full md:w-auto justify-center md:justify-end">
                        <Button
                            variant="outline"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="w-24 bg-white dark:bg-gray-950 shadow-sm rounded-xl"
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="w-24 bg-white dark:bg-gray-950 shadow-sm rounded-xl"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ')
}
