"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    ArrowLeft, Building2, Calendar, CreditCard, FileText, Home, Loader2,
    Mail, MessageSquare, Phone, Receipt, ShieldCheck, User
} from "lucide-react"

type TenantProfile = {
    id: string
    name: string | null
    full_name: string | null
    email: string | null
    phone: string | null
    is_verified: boolean | null
    verification_status: string | null
}

type RentalDetails = {
    id: string
    tenant_id: string
    property_id: string
    rent_amount: number | null
    rent_start_date: string | null
    status: string
    created_at: string
    property: { title: string | null; address: string | null; city: string | null } | null
    tenant: TenantProfile | null
}

type BillRecord = { id: string; type: string; amount: number; due_date: string | null; status: string }
type PaymentRecord = { id: string; amount: number; status: string; created_at: string; payment_method?: string | null }
type LeaseRecord = { id: string; title: string; status: string; start_date: string; end_date: string }
type MaintenanceRecord = { id: string; title: string; status: string; created_at: string }
type DocumentRecord = { id: string; name: string; type: string; url: string; created_at: string }

export default function TenantManagementPage() {
    const params = useParams<{ id: string }>()
    const { user, isLandlord, loading: authLoading } = useAuth()
    const [rental, setRental] = useState<RentalDetails | null>(null)
    const [bills, setBills] = useState<BillRecord[]>([])
    const [payments, setPayments] = useState<PaymentRecord[]>([])
    const [leases, setLeases] = useState<LeaseRecord[]>([])
    const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([])
    const [documents, setDocuments] = useState<DocumentRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    const loadTenant = useCallback(async () => {
        if (!user || !params.id) return
        setLoading(true)
        setError("")

        try {
            const { data: rentalData, error: rentalError } = await supabase
                .from("rentals")
                .select(`
                    id, tenant_id, property_id, rent_amount, rent_start_date, status, created_at,
                    property:properties(title, address, city),
                    tenant:profiles!rentals_tenant_id_fkey(id, name, full_name, email, phone, is_verified, verification_status)
                `)
                .eq("id", params.id)
                .eq("landlord_id", user.id)
                .in("status", ["approved", "active"])
                .maybeSingle()

            if (rentalError) throw rentalError
            if (!rentalData) throw new Error("Approved tenant record not found.")

            const typedRental = rentalData as unknown as RentalDetails
            setRental(typedRental)

            const [billResult, paymentResult, leaseResult, maintenanceResult, documentResult] = await Promise.all([
                supabase.from("bills").select("id, type, amount, due_date, status").eq("rental_id", typedRental.id).order("due_date", { ascending: false }),
                supabase.from("payments").select("id, amount, status, created_at, payment_method").eq("rental_id", typedRental.id).order("created_at", { ascending: false }),
                supabase.from("lease_agreements").select("id, title, status, start_date, end_date").eq("property_id", typedRental.property_id).eq("tenant_id", typedRental.tenant_id).order("created_at", { ascending: false }),
                supabase.from("maintenance_requests").select("id, title, status, created_at").eq("rental_id", typedRental.id).order("created_at", { ascending: false }),
                supabase.from("documents").select("id, name, type, url, created_at").eq("rental_id", typedRental.id).order("created_at", { ascending: false }),
            ])

            setBills((billResult.data || []) as BillRecord[])
            setPayments((paymentResult.data || []) as PaymentRecord[])
            setLeases((leaseResult.data || []) as LeaseRecord[])
            setMaintenance((maintenanceResult.data || []) as MaintenanceRecord[])
            setDocuments((documentResult.data || []) as DocumentRecord[])
        } catch (caughtError: unknown) {
            setError(caughtError instanceof Error ? caughtError.message : "Unable to load tenant workspace.")
        } finally {
            setLoading(false)
        }
    }, [params.id, user])

    useEffect(() => { void loadTenant() }, [loadTenant])

    if (authLoading || loading) return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    if (!isLandlord) return <div className="p-8 text-center text-muted-foreground">Only landlords can manage tenant records.</div>
    if (error || !rental) return <div className="space-y-4 p-8"><Button asChild variant="outline"><Link href="/tenants"><ArrowLeft className="mr-2 h-4 w-4" />Back to tenants</Link></Button><p className="text-red-600">{error || "Tenant not found."}</p></div>

    const tenantName = rental.tenant?.full_name || rental.tenant?.name || "Tenant"
    const totalPaid = payments.filter((payment) => ["success", "paid", "completed"].includes(payment.status)).reduce((sum, payment) => sum + Number(payment.amount), 0)
    const outstanding = bills.filter((bill) => bill.status !== "paid").reduce((sum, bill) => sum + Number(bill.amount), 0)

    return (
        <div className="mx-auto max-w-7xl space-y-6 pb-12">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Button asChild variant="outline" size="icon"><Link href="/tenants"><ArrowLeft className="h-4 w-4" /></Link></Button>
                    <div><h1 className="text-2xl font-bold">{tenantName}</h1><p className="text-sm text-muted-foreground">Tenant management workspace</p></div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline"><Link href="/messages"><MessageSquare className="mr-2 h-4 w-4" />Message</Link></Button>
                    <Button asChild variant="outline"><Link href="/payments"><CreditCard className="mr-2 h-4 w-4" />Payments</Link></Button>
                    <Button asChild><Link href="/dashboard/leases/new"><FileText className="mr-2 h-4 w-4" />Create Lease</Link></Button>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Summary title="Property" value={rental.property?.title || "—"} icon={Building2} />
                <Summary title="Monthly Rent" value={`₦${Number(rental.rent_amount || 0).toLocaleString()}`} icon={Home} />
                <Summary title="Total Paid" value={`₦${totalPaid.toLocaleString()}`} icon={Receipt} />
                <Summary title="Outstanding" value={`₦${outstanding.toLocaleString()}`} icon={CreditCard} />
            </div>

            <Card><CardContent className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
                <Info icon={Mail} label="Email" value={rental.tenant?.email || "Not provided"} />
                <Info icon={Phone} label="Phone" value={rental.tenant?.phone || "Not provided"} />
                <Info icon={Calendar} label="Move-in" value={rental.rent_start_date ? new Date(rental.rent_start_date).toLocaleDateString() : "Not set"} />
                <Info icon={ShieldCheck} label="Identity" value={rental.tenant?.is_verified ? "Verified" : rental.tenant?.verification_status || "Unverified"} />
            </CardContent></Card>

            <Tabs defaultValue="overview" className="space-y-5">
                <TabsList className="grid h-auto w-full grid-cols-3 gap-1 p-1 md:grid-cols-6">
                    <TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="billing">Billing</TabsTrigger><TabsTrigger value="payments">Payments</TabsTrigger><TabsTrigger value="leases">Leases</TabsTrigger><TabsTrigger value="maintenance">Maintenance</TabsTrigger><TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>
                <TabsContent value="overview"><Card><CardHeader><CardTitle>Tenancy Overview</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><div className="flex items-center"><strong>Status:</strong> <Badge className="ml-2 capitalize">{rental.status}</Badge></div><p><strong>Property:</strong> {rental.property?.title}</p><p><strong>Address:</strong> {[rental.property?.address, rental.property?.city].filter(Boolean).join(", ") || "Not provided"}</p><p><strong>Rental record created:</strong> {new Date(rental.created_at).toLocaleDateString()}</p></CardContent></Card></TabsContent>
                <TabsContent value="billing"><RecordList empty="No bills for this tenant." rows={bills.map((bill) => ({ id: bill.id, title: bill.type, detail: `₦${Number(bill.amount).toLocaleString()} · Due ${bill.due_date ? new Date(bill.due_date).toLocaleDateString() : "not set"}`, status: bill.status }))} /></TabsContent>
                <TabsContent value="payments"><RecordList empty="No payments recorded." rows={payments.map((payment) => ({ id: payment.id, title: `₦${Number(payment.amount).toLocaleString()}`, detail: new Date(payment.created_at).toLocaleDateString(), status: payment.status }))} /></TabsContent>
                <TabsContent value="leases"><RecordList empty="No lease agreement created yet." rows={leases.map((lease) => ({ id: lease.id, title: lease.title, detail: `${new Date(lease.start_date).toLocaleDateString()} – ${new Date(lease.end_date).toLocaleDateString()}`, status: lease.status }))} /></TabsContent>
                <TabsContent value="maintenance"><RecordList empty="No maintenance requests." rows={maintenance.map((request) => ({ id: request.id, title: request.title, detail: new Date(request.created_at).toLocaleDateString(), status: request.status }))} /></TabsContent>
                <TabsContent value="documents"><RecordList empty="No shared documents." rows={documents.map((document) => ({ id: document.id, title: document.name, detail: document.type, status: "available", href: document.url }))} /></TabsContent>
            </Tabs>
        </div>
    )
}

function Summary({ title, value, icon: Icon }: { title: string; value: string; icon: typeof User }) {
    return <Card><CardContent className="flex items-center gap-3 p-5"><div className="rounded-xl bg-primary/10 p-2.5"><Icon className="h-5 w-5 text-primary" /></div><div><p className="text-xs text-muted-foreground">{title}</p><p className="font-semibold">{value}</p></div></CardContent></Card>
}

function Info({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
    return <div className="flex items-start gap-2"><Icon className="mt-0.5 h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">{label}</p><p className="text-sm font-medium capitalize">{value}</p></div></div>
}

function RecordList({ rows, empty }: { rows: { id: string; title: string; detail: string; status: string; href?: string }[]; empty: string }) {
    return <Card><CardContent className="p-5">{rows.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">{empty}</p> : <div className="divide-y">{rows.map((row) => <div key={row.id} className="flex items-center justify-between gap-4 py-3"><div>{row.href ? <a className="font-medium text-primary hover:underline" href={row.href} target="_blank" rel="noreferrer">{row.title}</a> : <p className="font-medium capitalize">{row.title}</p>}<p className="text-xs text-muted-foreground">{row.detail}</p></div><Badge variant="outline" className="capitalize">{row.status.replaceAll("_", " ")}</Badge></div>)}</div>}</CardContent></Card>
}
