"use client"

import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Loader2,
    CheckCircle2,
    XCircle,
    User,
    Phone,
    Mail,
    Home,
    Calendar,
    FileText,
    Download,
    Eye,
    CalendarCheck,
    Clock,
    Search,
    Printer,
    Sparkles,
} from "lucide-react"
import { RentalStatus } from "@/types"

interface LandlordApplicationsListProps {
    landlordId: string
}

interface InspectionRecord {
    id: string
    property_id: string
    tenant_id: string
    inspection_date: string
    inspection_time: string
    inspection_type: string
    status: string
    notes?: string
}

interface ApplicationRecord {
    id: string
    property_id: string
    tenant_id: string
    rent_amount: number | null
    rent_start_date: string | null
    created_at: string
    status: string
    notes: string | null
    application_letter?: string | null
    application_letter_url?: string | null
    employment: string | null
    income: string | null
    property?: {
        id: string
        title: string | null
        address: string | null
        landlord_id: string | null
    }
    tenant?: {
        id?: string
        name: string | null
        full_name: string | null
        email: string | null
        phone: string | null
    }
    inspection?: InspectionRecord | null
}

interface SelectedLetterDetails {
    name: string
    letter: string
    url?: string | null
    propertyTitle?: string
    propertyAddress?: string
    date?: string
    email?: string
    phone?: string
    income?: string
    employment?: string
}

export function LandlordApplicationsList({ landlordId }: LandlordApplicationsListProps) {
    const [applications, setApplications] = useState<ApplicationRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [selectedLetter, setSelectedLetter] = useState<SelectedLetterDetails | null>(null)
    const [statusFilter, setStatusFilter] = useState<string>("pending")
    const [searchQuery, setSearchQuery] = useState<string>("")

    const fetchApplications = useCallback(async (signal?: AbortSignal) => {
        setLoading(true)
        try {
            const url = `/api/landlord/applications?status=${encodeURIComponent(statusFilter)}`
            const response = await fetch(url, {
                cache: "no-store",
                signal,
            })
            const result = await response.json()
            if (!response.ok) throw new Error(result.error || "Failed to load applications")
            if (!signal?.aborted) setApplications((result.applications as ApplicationRecord[]) || [])
        } catch (error: unknown) {
            if (!signal?.aborted) {
                console.error("Error in fetchApplications:", error)
            }
        } finally {
            if (!signal?.aborted) {
                setLoading(false)
            }
        }
    }, [landlordId, statusFilter])

    useEffect(() => {
        if (landlordId) {
            fetchApplications()
        }
    }, [fetchApplications, landlordId])

    const handleAction = async (requestId: string, propertyId: string, status: RentalStatus) => {
        setActionLoading(requestId)

        try {
            // 1. Update Rental Status
            const { error: rentalError } = await supabase
                .from('rentals')
                .update({ status })
                .eq('id', requestId)

            if (rentalError) throw rentalError

            // 2. If approved, update property status to 'rented' and CREATE INITIAL BILL
            if (status === 'approved') {
                const { error: propertyError } = await supabase
                    .from('properties')
                    .update({ status: 'rented' })
                    .eq('id', propertyId)

                if (propertyError) throw propertyError

                const app = applications.find(a => a.id === requestId)

                const { error: billError } = await supabase
                    .from('bills')
                    .insert({
                        rental_id: requestId,
                        type: 'rent',
                        amount: app?.rent_amount || 0,
                        due_date: app?.rent_start_date || new Date().toISOString().split('T')[0],
                        status: 'unpaid'
                    })

                if (billError) {
                    console.error("Failed to create automated bill:", billError)
                }

                if (app?.tenant_id) {
                    await supabase.from('notifications').insert({
                        user_id: app.tenant_id,
                        type: 'rental_approval',
                        title: 'Application Approved!',
                        message: `Your rental application for ${app.property?.title} was approved by the landlord.`,
                        link: '/my-property'
                    })
                }
            } else if (status === 'rejected') {
                const app = applications.find(a => a.id === requestId)
                if (app?.tenant_id) {
                    await supabase.from('notifications').insert({
                        user_id: app.tenant_id,
                        type: 'rental_rejection',
                        title: 'Application Update',
                        message: `Your application for ${app.property?.title} was not accepted at this time.`,
                        link: '/applications'
                    })
                }
            }

            await fetchApplications()
        } catch (error: unknown) {
            console.error(`Error during application ${status}:`, error)
            alert(`Failed to ${status} application.`)
        } finally {
            setActionLoading(null)
        }
    }

    const filteredApplications = applications.filter((app) => {
        if (!searchQuery.trim()) return true
        const query = searchQuery.toLowerCase()
        const applicantName = (app.tenant?.full_name || app.tenant?.name || "").toLowerCase()
        const propertyTitle = (app.property?.title || "").toLowerCase()
        const propertyAddress = (app.property?.address || "").toLowerCase()
        const email = (app.tenant?.email || "").toLowerCase()
        return (
            applicantName.includes(query) ||
            propertyTitle.includes(query) ||
            propertyAddress.includes(query) ||
            email.includes(query)
        )
    })

    return (
        <div className="space-y-6">
            {/* Filter Tabs & Search Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto">
                    {[
                        { id: "pending", label: "Pending Review" },
                        { id: "approved", label: "Approved" },
                        { id: "rejected", label: "Rejected" },
                        { id: "all", label: "All Applications" },
                    ].map((tab) => (
                        <Button
                            key={tab.id}
                            variant={statusFilter === tab.id ? "default" : "outline"}
                            size="sm"
                            className={`rounded-full text-xs font-semibold px-4 transition-all ${
                                statusFilter === tab.id
                                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                            onClick={() => setStatusFilter(tab.id)}
                        >
                            {tab.label}
                        </Button>
                    ))}
                </div>

                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search tenant or property..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9 text-xs rounded-xl"
                    />
                </div>
            </div>

            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold tracking-tight">
                    Tenant Application Letters ({filteredApplications.length})
                </h3>
                <Badge variant="outline" className="px-3 py-1 font-semibold text-xs">
                    Status: <span className="capitalize ml-1 font-bold">{statusFilter}</span>
                </Badge>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : filteredApplications.length === 0 ? (
                <div className="text-center p-12 border border-dashed rounded-2xl text-muted-foreground bg-muted/20">
                    <Home className="mx-auto h-12 w-12 mb-4 opacity-20" />
                    <h3 className="text-lg font-medium text-foreground">No applications found</h3>
                    <p className="text-sm mt-1">
                        {statusFilter === "pending"
                            ? "No pending tenant application letters to review right now."
                            : `No applications found with status '${statusFilter}'.`}
                    </p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {filteredApplications.map((app) => {
                        const applicantName = app.tenant?.full_name || app.tenant?.name || "Applicant"
                        const letterText = app.application_letter || app.notes || "No formal cover letter submitted."
                        const hasLetterDoc = Boolean(app.application_letter_url)
                        const insp = app.inspection

                        return (
                            <Card
                                key={app.id}
                                className={`overflow-hidden shadow-sm hover:shadow-md transition-all border-l-4 ${
                                    app.status === "approved"
                                        ? "border-l-green-600"
                                        : app.status === "rejected"
                                        ? "border-l-red-500"
                                        : "border-l-blue-600"
                                }`}
                            >
                                <CardHeader className="bg-muted/30 pb-4">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                        <div>
                                            <div className="flex items-center space-x-2">
                                                <CardTitle className="text-lg font-bold">{app.property?.title}</CardTitle>
                                                <Badge className="bg-primary/10 text-primary border-primary/20 font-bold">
                                                    ₦{app.rent_amount?.toLocaleString()}/mo
                                                </Badge>
                                                <Badge
                                                    className={`capitalize font-bold text-xs ${
                                                        app.status === "approved"
                                                            ? "bg-green-600 text-white"
                                                            : app.status === "rejected"
                                                            ? "bg-red-600 text-white"
                                                            : "bg-yellow-500 text-white"
                                                    }`}
                                                >
                                                    {app.status}
                                                </Badge>
                                            </div>
                                            <CardDescription className="flex items-center mt-1 text-xs">
                                                <Home className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                                                {app.property?.address}
                                            </CardDescription>
                                        </div>
                                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                            Received: {new Date(app.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="pt-6 space-y-6">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        {/* Left Column: Tenant Profile & Inspection Record */}
                                        <div className="space-y-4">
                                            <div className="space-y-3 p-4 bg-muted/30 rounded-xl border">
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center">
                                                    <User className="h-4 w-4 mr-2 text-primary" />
                                                    Applicant Profile
                                                </h4>
                                                <div className="space-y-1.5">
                                                    <p className="text-base font-bold text-foreground">{applicantName}</p>
                                                    <p className="text-xs flex items-center text-muted-foreground">
                                                        <Mail className="h-3.5 w-3.5 mr-2 text-primary" />
                                                        {app.tenant?.email || "N/A"}
                                                    </p>
                                                    {app.tenant?.phone && (
                                                        <p className="text-xs flex items-center text-muted-foreground">
                                                            <Phone className="h-3.5 w-3.5 mr-2 text-primary" />
                                                            {app.tenant?.phone}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="pt-2 border-t grid grid-cols-2 gap-3">
                                                    <div>
                                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Move-in Date</p>
                                                        <p className="text-xs font-semibold flex items-center mt-0.5">
                                                            <Calendar className="h-3.5 w-3.5 mr-1.5 text-primary" />
                                                            {app.rent_start_date ? new Date(app.rent_start_date).toLocaleDateString() : 'Immediate'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Monthly Income</p>
                                                        <p className="text-xs font-semibold text-green-600 dark:text-green-400 mt-0.5">
                                                            ₦{app.income || 'Not specified'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="pt-1">
                                                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Employment</p>
                                                    <p className="text-xs font-medium italic text-foreground mt-0.5">
                                                        {app.employment || 'Not specified'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Inspection Record */}
                                            <div className="p-4 rounded-xl border bg-blue-50/60 dark:bg-slate-900/50 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-2">
                                                        <CalendarCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                        <span className="text-xs font-bold uppercase tracking-wider text-blue-950 dark:text-blue-200">
                                                            Tenant Inspection Record
                                                        </span>
                                                    </div>
                                                    {insp ? (
                                                        <Badge className={`capitalize text-[10px] px-2 py-0.5 ${
                                                            insp.status === 'completed' ? 'bg-green-600' :
                                                            insp.status === 'approved' ? 'bg-blue-600' :
                                                            'bg-yellow-600'
                                                        }`}>
                                                            {insp.status}
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-[10px] text-muted-foreground">
                                                            No Inspection Booked
                                                        </Badge>
                                                    )}
                                                </div>

                                                {insp ? (
                                                    <div className="text-xs space-y-1 pt-1">
                                                        <p className="font-semibold text-foreground flex items-center">
                                                            <Clock className="h-3 w-3 mr-1 text-blue-600" />
                                                            {insp.inspection_type}: {new Date(insp.inspection_date).toLocaleDateString()} at {insp.inspection_time}
                                                        </p>
                                                        {insp.notes && (
                                                            <p className="text-muted-foreground italic text-[11px]">
                                                                Note: &quot;{insp.notes}&quot;
                                                            </p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-muted-foreground">
                                                        Tenant has not scheduled a property viewing yet.
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Right Column: Application Letter & Actions */}
                                        <div className="space-y-4 flex flex-col justify-between">
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center">
                                                        <FileText className="h-4 w-4 mr-2 text-primary" />
                                                        Application Letter from Tenant
                                                    </h4>
                                                    {hasLetterDoc && (
                                                        <a
                                                            href={app.application_letter_url!}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center text-xs text-blue-600 hover:underline font-semibold"
                                                        >
                                                            <Download className="h-3 w-3 mr-1" />
                                                            Attached File
                                                        </a>
                                                    )}
                                                </div>

                                                <div className="p-4 bg-muted/40 rounded-xl text-sm leading-relaxed border space-y-3 relative group">
                                                    <p className="whitespace-pre-line text-xs font-sans text-foreground max-h-[180px] overflow-y-auto pr-1">
                                                        {letterText}
                                                    </p>
                                                    <div className="pt-2 border-t flex justify-between items-center text-[11px] text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <Sparkles className="h-3 w-3 text-amber-500" /> Cover Letter
                                                        </span>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 text-[11px] px-2 text-primary hover:bg-primary/10"
                                                            onClick={() => setSelectedLetter({
                                                                name: applicantName,
                                                                letter: letterText,
                                                                url: app.application_letter_url,
                                                                propertyTitle: app.property?.title || "",
                                                                propertyAddress: app.property?.address || "",
                                                                date: new Date(app.created_at).toLocaleDateString(),
                                                                email: app.tenant?.email || "",
                                                                phone: app.tenant?.phone || "",
                                                                income: app.income || "",
                                                                employment: app.employment || "",
                                                            })}
                                                        >
                                                            <Eye className="h-3 w-3 mr-1" /> Review Full Letter
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            {app.status === "pending" ? (
                                                <div className="space-y-3 pt-2">
                                                    <div className="flex space-x-3">
                                                        <Button
                                                            variant="outline"
                                                            className="w-1/2 border-destructive text-destructive hover:bg-destructive hover:text-white"
                                                            disabled={actionLoading === app.id}
                                                            onClick={() => handleAction(app.id, app.property_id, 'rejected')}
                                                        >
                                                            <XCircle className="mr-2 h-4 w-4" />
                                                            Reject
                                                        </Button>
                                                        <Button
                                                            className="w-1/2 bg-green-600 hover:bg-green-700 text-white font-semibold shadow-sm"
                                                            disabled={actionLoading === app.id}
                                                            onClick={() => handleAction(app.id, app.property_id, 'approved')}
                                                        >
                                                            {actionLoading === app.id ? (
                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                                            )}
                                                            Approve Application
                                                        </Button>
                                                    </div>
                                                    <p className="text-[11px] text-muted-foreground text-center italic">
                                                        Approving will reserve the property for {applicantName} and issue initial billing.
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="pt-2 text-xs text-muted-foreground bg-muted/20 p-3 rounded-xl border flex items-center justify-between">
                                                    <span>Status: <strong className="capitalize text-foreground">{app.status}</strong></span>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-xs text-primary"
                                                        onClick={() => setSelectedLetter({
                                                            name: applicantName,
                                                            letter: letterText,
                                                            url: app.application_letter_url,
                                                            propertyTitle: app.property?.title || "",
                                                            propertyAddress: app.property?.address || "",
                                                            date: new Date(app.created_at).toLocaleDateString(),
                                                            email: app.tenant?.email || "",
                                                            phone: app.tenant?.phone || "",
                                                            income: app.income || "",
                                                            employment: app.employment || "",
                                                        })}
                                                    >
                                                        <Eye className="h-3 w-3 mr-1" /> View Letter
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Modal for reviewing full letter */}
            {selectedLetter && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <Card className="max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border-2">
                        <CardHeader className="border-b bg-muted/40 flex flex-row items-center justify-between py-4">
                            <div>
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-primary" /> Application Letter - {selectedLetter.name}
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Property: {selectedLetter.propertyTitle} ({selectedLetter.date})
                                </CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" className="rounded-full w-8 h-8 p-0" onClick={() => setSelectedLetter(null)}>✕</Button>
                        </CardHeader>

                        <CardContent className="p-6 overflow-y-auto space-y-6">
                            {/* Applicant Quick Info Summary */}
                            <div className="bg-muted/30 border p-3.5 rounded-xl text-xs grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div>
                                    <span className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">Applicant</span>
                                    <p className="font-semibold text-foreground mt-0.5">{selectedLetter.name}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">Email</span>
                                    <p className="font-semibold text-foreground mt-0.5 truncate">{selectedLetter.email || "N/A"}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">Employment</span>
                                    <p className="font-semibold text-foreground mt-0.5 truncate">{selectedLetter.employment || "N/A"}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">Income</span>
                                    <p className="font-semibold text-green-600 dark:text-green-400 mt-0.5">₦{selectedLetter.income || "N/A"}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h5 className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center">
                                    <FileText className="h-3.5 w-3.5 mr-1 text-primary" /> Application Letter Text
                                </h5>
                                <div className="p-4 bg-background border rounded-xl leading-relaxed text-sm font-sans whitespace-pre-line shadow-inner">
                                    {selectedLetter.letter}
                                </div>
                            </div>

                            {selectedLetter.url && (
                                <div className="p-4 border bg-blue-50/50 dark:bg-blue-950/20 rounded-xl flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-bold text-foreground">Attached Document</p>
                                        <p className="text-[11px] text-muted-foreground">Tenant uploaded a separate document file for this application.</p>
                                    </div>
                                    <a href={selectedLetter.url} target="_blank" rel="noreferrer">
                                        <Button size="sm" variant="outline" className="bg-white dark:bg-slate-900 shadow-sm text-xs">
                                            <Download className="h-3.5 w-3.5 mr-1.5" /> Download File
                                        </Button>
                                    </a>
                                </div>
                            )}
                        </CardContent>

                        <div className="p-4 border-t bg-muted/30 flex justify-between items-center">
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-xs"
                                onClick={() => window.print()}
                            >
                                <Printer className="h-3.5 w-3.5 mr-1.5" /> Print Letter
                            </Button>
                            <Button size="sm" className="bg-primary text-primary-foreground text-xs" onClick={() => setSelectedLetter(null)}>
                                Close Review
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    )
}
