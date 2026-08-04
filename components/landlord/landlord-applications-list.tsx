"use client"

import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
} from "lucide-react"
import { RentalStatus } from "@/types"
import Link from "next/link"

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

export function LandlordApplicationsList({ landlordId }: LandlordApplicationsListProps) {
    const [applications, setApplications] = useState<ApplicationRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [selectedLetter, setSelectedLetter] = useState<{ name: string; letter: string; url?: string | null } | null>(null)

    const fetchApplications = useCallback(async (signal?: AbortSignal) => {
        setLoading(true)
        try {
            const response = await fetch("/api/landlord/applications", {
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
    }, [landlordId])

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

                // Find the specific application to get details for the bill
                const app = applications.find(a => a.id === requestId)

                // Create the initial rent bill
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

                // Send notification to tenant
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

            // 3. Refresh list
            await fetchApplications()
        } catch (error: unknown) {
            console.error(`Error during application ${status}:`, error)
            alert(`Failed to ${status} application.`)
        } finally {
            setActionLoading(null)
        }
    }

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

    if (applications.length === 0) {
        return (
            <div className="text-center p-12 border border-dashed rounded-lg text-muted-foreground bg-muted/20">
                <Home className="mx-auto h-12 w-12 mb-4 opacity-20" />
                <h3 className="text-lg font-medium">No pending applications</h3>
                <p>New rental applications and letters from prospective tenants will appear here.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold tracking-tight">Incoming Rental Applications ({applications.length})</h3>
                <Badge variant="outline" className="px-3 py-1 font-medium">
                    {applications.length} Action Needed
                </Badge>
            </div>

            <div className="grid gap-6">
                {applications.map((app) => {
                    const applicantName = app.tenant?.full_name || app.tenant?.name || "Applicant"
                    const letterText = app.application_letter || app.notes || "No formal cover letter submitted."
                    const hasLetterDoc = Boolean(app.application_letter_url)
                    const insp = app.inspection

                    return (
                        <Card key={app.id} className="overflow-hidden border-l-4 border-l-primary shadow-sm hover:shadow-md transition-all">
                            <CardHeader className="bg-muted/30 pb-4">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                    <div>
                                        <div className="flex items-center space-x-2">
                                            <CardTitle className="text-lg font-bold">{app.property?.title}</CardTitle>
                                            <Badge className="bg-primary/20 text-primary border-primary/30 font-bold">
                                                ₦{app.rent_amount?.toLocaleString()}/mo
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
                                    {/* Left Column: Tenant & Income Info */}
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
                                                    {app.tenant?.email}
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

                                        {/* Inspection Booking Status Card */}
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
                                                    Tenant has not scheduled a property viewing yet. You can approve the application directly or request an inspection first.
                                                </p>
                                            )}

                                            <div className="pt-2">
                                                <Link href="/dashboard/inspections">
                                                    <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-700 dark:text-blue-300 p-0 hover:bg-transparent hover:underline">
                                                        Manage Inspections Schedule →
                                                    </Button>
                                                </Link>
                                            </div>
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
                                                        Attached Letter Doc
                                                    </a>
                                                )}
                                            </div>

                                            <div className="p-4 bg-muted/40 rounded-xl text-sm leading-relaxed border space-y-3 relative group">
                                                <p className="whitespace-pre-line text-xs font-sans text-foreground max-h-[180px] overflow-y-auto pr-1">
                                                    {letterText}
                                                </p>
                                                <div className="pt-2 border-t flex justify-between items-center text-[11px] text-muted-foreground">
                                                    <span>Submitted by {applicantName}</span>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 text-[11px] px-2 text-primary"
                                                        onClick={() => setSelectedLetter({ name: applicantName, letter: letterText, url: app.application_letter_url })}
                                                    >
                                                        <Eye className="h-3 w-3 mr-1" /> Full Screen Letter
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
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
                                                    className="w-1/2 bg-green-600 hover:bg-green-700 text-white font-semibold"
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
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Modal for viewing full letter */}
            {selectedLetter && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                    <Card className="max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
                        <CardHeader className="border-b bg-muted/40 flex flex-row items-center justify-between py-4">
                            <div>
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-primary" /> Application Letter - {selectedLetter.name}
                                </CardTitle>
                                <CardDescription className="text-xs">Formal cover letter submitted with rental application</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedLetter(null)}>✕</Button>
                        </CardHeader>
                        <CardContent className="p-6 overflow-y-auto space-y-4 text-sm leading-relaxed font-sans whitespace-pre-line">
                            {selectedLetter.letter}
                        </CardContent>
                        {selectedLetter.url && (
                            <div className="p-4 border-t bg-muted/20 flex justify-between items-center">
                                <span className="text-xs text-muted-foreground">Original Document File Attached</span>
                                <a href={selectedLetter.url} target="_blank" rel="noreferrer">
                                    <Button size="sm" variant="outline">
                                        <Download className="h-4 w-4 mr-2" /> Download Attached File
                                    </Button>
                                </a>
                            </div>
                        )}
                    </Card>
                </div>
            )}
        </div>
    )
}
