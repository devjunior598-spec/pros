"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { RoleGuard } from "@/components/role-guard"
import {
    ArrowLeft,
    Plus,
    X,
    FileText,
    Building2,
    Briefcase,
    Calendar,
    Save,
    Loader2
} from "lucide-react"

type LeaseProperty = {
    id: string
    title: string
    address: string | null
    status?: string | null
}

type LeaseTenant = {
    id: string
    name?: string | null
    email: string | null
    full_name?: string | null
}

type TenantAssignment = {
    rentalId: string
    propertyId: string
    tenant: LeaseTenant
}

// Preset details for templates
const TEMPLATE_PRESETS: Record<string, { terms: string; rules: string[] }> = {
    residential: {
        terms: `1. RENTAL UNIT OCCUPANCY: The Tenant agrees that the premises shall be occupied solely for private residential purposes. No other occupants are permitted without the Landlord's prior written approval.\n\n2. RENT AND VALUE: Rent is payable in advance in accordance with the billing frequency specified. Late fees of 5% will apply to payments received more than 5 days past the due date.\n\n3. MAINTENANCE AND REPAIRS: The Tenant shall maintain the interior of the premises in clean, sanitary, and good condition. The Landlord agrees to handle major structural repairs, including roof, plumbing mainlines, and electrical distribution systems, unless caused by Tenant negligence.\n\n4. SECURITY DEPOSIT: The security deposit will be held by the Landlord in escrow. It will be refunded within 30 days of move-out, minus any deductions for structural damage exceeding normal wear and tear, or outstanding bills.`,
        rules: [
            "No loud music or noise disruptions after 10:00 PM.",
            "No pets allowed on the premises without written consent.",
            "Keep common areas clean and free of personal items.",
            "No smoking inside the apartment interior."
        ]
    },
    commercial: {
        terms: `1. COMMERCIAL USE: The Tenant agrees to occupy and use the premises solely for commercial retail or office operations. The Tenant shall comply with all zoning and local business operating regulations.\n\n2. MODIFICATIONS AND FIXTURES: Any structural alterations, electrical modifications, or custom signage require prior written consent from the Landlord. All installations must meet local fire safety codes.\n\n3. MAINTENANCE AND UTILITIES: The Tenant is responsible for all internal maintenance, cleaning, electrical repairs, and utility bills associated with the shop/office space during the lease term.\n\n4. RENT AND ESCALATION: Rent must be paid promptly. A late penalty is charged for delays, and an annual rent escalation of 10% will apply upon renewal.`,
        rules: [
            "Business operating hours are restricted to 7:00 AM - 9:00 PM.",
            "No hazardous or highly flammable materials stored on site.",
            "Waste disposal must follow commercial garbage sorting protocols.",
            "Loading and unloading restricted to designated bays."
        ]
    },
    shortlet: {
        terms: `1. TEMPORARY SHORT-STAY: This agreement governs a temporary short-let rental. The Tenant acknowledges that this occupancy does not create a long-term tenancy relationship.\n\n2. FEES AND REFUNDS: Total rent and security deposit must be paid in full before key handover. Cancellations made less than 7 days prior to check-in are non-refundable.\n\n3. FIXTURES AND ELECTRONICS: The Tenant shall take care of all electrical appliances, furniture, and kitchenware. Any damages will be charged directly against the security deposit.\n\n4. UTILITIES AND ACCESS: High-speed Wi-Fi, water, and generator electricity are provided by the Landlord, subject to reasonable usage terms.`,
        rules: [
            "Check-in time is 2:00 PM; Check-out time is strictly 11:00 AM.",
            "No parties, large events, or external guests allowed without permission.",
            "Turn off air conditioners and heaters when leaving the unit.",
            "Quiet hours start at 9:00 PM."
        ]
    },
    custom: {
        terms: "Enter custom terms and conditions for this lease agreement here...",
        rules: []
    }
}

export default function LeaseBuilderPage() {
    const router = useRouter()
    const { toast } = useToast()
    
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [landlordId, setLandlordId] = useState<string | null>(null)
    const [properties, setProperties] = useState<LeaseProperty[]>([])
    const [tenantAssignments, setTenantAssignments] = useState<TenantAssignment[]>([])
    const [optionsError, setOptionsError] = useState("")

    // Form State
    const [title, setTitle] = useState("")
    const [selectedProperty, setSelectedProperty] = useState("")
    const [selectedTenant, setSelectedTenant] = useState("")
    const [templateType, setTemplateType] = useState("residential")
    const [rentAmount, setRentAmount] = useState("")
    const [paymentFrequency, setPaymentFrequency] = useState("monthly")
    const [securityDeposit, setSecurityDeposit] = useState("")
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [terms, setTerms] = useState("")
    const [rules, setRules] = useState<string[]>([])
    const [newRule, setNewRule] = useState("")
    const [rentDueDay, setRentDueDay] = useState("1")
    const [gracePeriod, setGracePeriod] = useState("5")
    const [lateFeePercent, setLateFeePercent] = useState("5")
    const [renewalType, setRenewalType] = useState("fixed")
    const [noticePeriod, setNoticePeriod] = useState("30")
    const [utilities, setUtilities] = useState("Tenant pays electricity, water, waste disposal, and internet charges.")
    const [reviewed, setReviewed] = useState(false)
    const [previewOpen, setPreviewOpen] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [templateEdited, setTemplateEdited] = useState(false)

    useEffect(() => {
        const fetchFormData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    router.push("/login")
                    return
                }
                setLandlordId(user.id)

                const response = await fetch("/api/leases/options", { cache: "no-store" })
                const options = await response.json()
                if (!response.ok) throw new Error(options.error || "Failed to load properties and tenants")
                setProperties(options.properties || [])
                setTenantAssignments(options.tenantAssignments || [])

                // Initialize preset residential terms
                setTerms(TEMPLATE_PRESETS.residential.terms)
                setRules(TEMPLATE_PRESETS.residential.rules)

            } catch (err) {
                console.error("Error loading builder data:", err)
                setOptionsError(err instanceof Error ? err.message : "Failed to load properties and tenants")
            } finally {
                setLoading(false)
            }
        }
        fetchFormData()
    }, [router])

    // Update terms and rules when template changes
    const handleTemplateChange = (type: string) => {
        if (templateEdited && !window.confirm("Changing the template will replace your edited terms and house rules. Continue?")) {
            return
        }
        setTemplateType(type)
        const preset = TEMPLATE_PRESETS[type]
        if (preset) {
            setTerms(preset.terms)
            setRules(preset.rules)
            setTemplateEdited(false)
        }
    }

    const handleAddRule = () => {
        if (!newRule.trim()) return
        setRules([...rules, newRule.trim()])
        setNewRule("")
    }

    const handleRemoveRule = (index: number) => {
        setRules(rules.filter((_, idx) => idx !== index))
    }

    const handleCreateLease = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!landlordId) return

        const nextErrors: Record<string, string> = {}
        if (!title.trim()) nextErrors.title = "Enter a clear lease title."
        if (!selectedProperty) nextErrors.property = "Select a property."
        if (!selectedTenant) nextErrors.tenant = "Select an approved tenant."
        if (!rentAmount || Number(rentAmount) <= 0) nextErrors.rentAmount = "Rent must be greater than zero."
        if (Number(securityDeposit) < 0) nextErrors.securityDeposit = "Deposit cannot be negative."
        if (!startDate) nextErrors.startDate = "Select the lease start date."
        if (!endDate) nextErrors.endDate = "Select the lease end date."
        if (startDate && endDate && new Date(startDate) >= new Date(endDate)) nextErrors.endDate = "End date must be after the start date."
        if (!terms.trim()) nextErrors.terms = "Add the lease terms and conditions."
        if (!reviewed) nextErrors.reviewed = "Confirm that you reviewed the agreement."
        setErrors(nextErrors)
        if (Object.keys(nextErrors).length > 0) {
            window.scrollTo({ top: 0, behavior: "smooth" })
            return
        }

        const operationalTerms = `PAYMENT AND RENEWAL DETAILS
Rent is due on day ${rentDueDay} of each payment period. A grace period of ${gracePeriod} day(s) applies, after which a late fee of ${lateFeePercent}% may be charged.
Renewal arrangement: ${renewalType === "fixed" ? "Fixed term; renewal requires a new written agreement." : renewalType === "automatic" ? "Automatic renewal unless valid notice is given." : "Converts to a month-to-month tenancy after the fixed term."}
Termination or non-renewal requires ${noticePeriod} days' written notice, subject to applicable law.
Utilities and services: ${utilities}

${terms}`

        setSaving(true)
        try {
            const res = await fetch("/api/leases/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    landlordId,
                    tenantId: selectedTenant,
                    propertyId: selectedProperty,
                    templateType,
                    title,
                    rentAmount: parseFloat(rentAmount),
                    paymentFrequency,
                    securityDeposit: parseFloat(securityDeposit) || 0,
                    startDate,
                    endDate,
                    houseRules: rules,
                    termsAndConditions: operationalTerms
                })
            })

            const result = await res.json()
            if (!res.ok) throw new Error(result.error || "Failed to create lease")

            toast({ title: "Lease Draft Created!", description: "Agreement saved as a draft. You can now send it to the tenant." })
            router.push("/dashboard/leases")
        } catch (error: unknown) {
            console.error(error)
            alert(error instanceof Error ? error.message : "Failed to save lease agreement.")
        } finally {
            setSaving(false)
        }
    }

    const formatCurrency = (value: string) =>
        value ? new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(Number(value)) : "—"

    const selectedPropertyDetails = properties.find((property) => property.id === selectedProperty)
    const availableTenants = tenantAssignments
        .filter((assignment) => assignment.propertyId === selectedProperty)
        .map((assignment) => assignment.tenant)
        .filter((tenant, index, tenants) => tenants.findIndex((item) => item.id === tenant.id) === index)
    const selectedTenantDetails = availableTenants.find((tenant) => tenant.id === selectedTenant)
    const leaseDuration = startDate && endDate
        ? Math.max(0, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000))
        : 0

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <RoleGuard allowedRoles={["landlord"]}>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 pb-20">
                <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6 md:p-8">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
                                <FileText className="h-7 w-7 text-blue-500" /> Create Lease Agreement
                            </h1>
                            <p className="text-sm text-slate-550 dark:text-slate-400">
                                Draft and format a new rental agreement using templates.
                            </p>
                        </div>
                        <Button 
                            variant="ghost" 
                            onClick={() => router.push("/dashboard/leases")} 
                            className="rounded-xl font-bold min-h-[44px]"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" /> Back
                        </Button>
                    </div>

                    <form onSubmit={handleCreateLease} className="space-y-6">
                        {optionsError && (
                            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                                {optionsError}
                            </div>
                        )}
                        
                        {/* Lease Config Card */}
                        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md rounded-2xl overflow-hidden">
                            <CardHeader className="border-b">
                                <CardTitle className="text-base font-extrabold flex items-center gap-2">
                                    <Building2 className="h-4.5 w-4.5 text-blue-500" /> 1. Agreement Configuration
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 grid gap-4 sm:grid-cols-2">
                                
                                <div className="sm:col-span-2 space-y-1.5">
                                    <Label htmlFor="title" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lease Title <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="title"
                                        placeholder="e.g. Residential Lease for Apartment 4B"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl"
                                        required
                                    />
                                    {errors.title && <p className="text-xs font-semibold text-red-500">{errors.title}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Property <span className="text-red-500">*</span></Label>
                                    <Select
                                        value={selectedProperty}
                                        onValueChange={(propertyId) => {
                                            setSelectedProperty(propertyId)
                                            setSelectedTenant("")
                                            setErrors((current) => ({ ...current, property: "", tenant: "" }))
                                        }}
                                        required
                                    >
                                        <SelectTrigger className="h-11 rounded-xl">
                                            <SelectValue placeholder="Choose property listing" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {properties.map(p => (
                                                <SelectItem key={p.id} value={p.id}>
                                                    {p.title}{p.address ? ` (${p.address.length > 24 ? `${p.address.substring(0, 24)}…` : p.address})` : ""}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {properties.length === 0 && (
                                        <div className="flex items-center justify-between gap-3 rounded-lg bg-amber-50 p-2.5">
                                            <p className="text-xs text-amber-700">No owned properties are available.</p>
                                            <Button asChild type="button" variant="outline" size="sm" className="h-8 shrink-0 rounded-lg">
                                                <Link href="/dashboard/landlord/properties/new">Add property</Link>
                                            </Button>
                                        </div>
                                    )}
                                    {errors.property && <p className="text-xs font-semibold text-red-500">{errors.property}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Tenant <span className="text-red-500">*</span></Label>
                                    <Select value={selectedTenant} onValueChange={setSelectedTenant} disabled={!selectedProperty || availableTenants.length === 0} required>
                                        <SelectTrigger className="h-11 rounded-xl">
                                            <SelectValue placeholder="Assign tenant" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableTenants.map(t => (
                                                <SelectItem key={t.id} value={t.id}>
                                                    {t.full_name || t.name || "Tenant"}{t.email ? ` (${t.email})` : ""}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {!selectedProperty && <p className="text-xs text-slate-500">Select a property to see its approved tenants.</p>}
                                    {selectedProperty && availableTenants.length === 0 && (
                                        <div className="flex items-center justify-between gap-3 rounded-lg bg-amber-50 p-2.5">
                                            <p className="text-xs text-amber-700">No approved or active tenant is linked to this property.</p>
                                            <Button asChild type="button" variant="outline" size="sm" className="h-8 shrink-0 rounded-lg">
                                                <Link href="/applications">Review applications</Link>
                                            </Button>
                                        </div>
                                    )}
                                    {errors.tenant && <p className="text-xs font-semibold text-red-500">{errors.tenant}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Agreement Template Preset</Label>
                                    <Select value={templateType} onValueChange={handleTemplateChange}>
                                        <SelectTrigger className="h-11 rounded-xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="residential">Residential Lease Template</SelectItem>
                                            <SelectItem value="commercial">Shop / Commercial Office Template</SelectItem>
                                            <SelectItem value="shortlet">Short-let Agreement Template</SelectItem>
                                            <SelectItem value="custom">Custom Agreement (Empty Draft)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Payment Frequency</Label>
                                    <Select value={paymentFrequency} onValueChange={setPaymentFrequency}>
                                        <SelectTrigger className="h-11 rounded-xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="monthly">Monthly Rent payments</SelectItem>
                                            <SelectItem value="yearly">Yearly Rent payments</SelectItem>
                                            <SelectItem value="quarterly">Quarterly Rent payments</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                            </CardContent>
                        </Card>

                        {/* Financials & Duration */}
                        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md rounded-2xl overflow-hidden">
                            <CardHeader className="border-b">
                                <CardTitle className="text-base font-extrabold flex items-center gap-2">
                                    <Briefcase className="h-4.5 w-4.5 text-blue-500" /> 2. Lease Financials & Timeline
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 grid gap-4 sm:grid-cols-2">
                                
                                <div className="space-y-1.5">
                                    <Label htmlFor="rentAmount" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rent per payment period (₦) <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="rentAmount"
                                        type="number"
                                        placeholder="e.g. 150000"
                                        value={rentAmount}
                                        onChange={(e) => setRentAmount(e.target.value)}
                                        className="h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl"
                                        required
                                    />
                                    <p className="text-xs text-slate-500">{formatCurrency(rentAmount)} per {paymentFrequency.replace("ly", "")}</p>
                                    {errors.rentAmount && <p className="text-xs font-semibold text-red-500">{errors.rentAmount}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="securityDeposit" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Security Deposit (₦)</Label>
                                    <Input
                                        id="securityDeposit"
                                        type="number"
                                        placeholder="e.g. 50000"
                                        value={securityDeposit}
                                        onChange={(e) => setSecurityDeposit(e.target.value)}
                                        className="h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl"
                                    />
                                    {errors.securityDeposit && <p className="text-xs font-semibold text-red-500">{errors.securityDeposit}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="startDate" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Start Date</Label>
                                    <Input
                                        id="startDate"
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl"
                                        required
                                    />
                                    {errors.startDate && <p className="text-xs font-semibold text-red-500">{errors.startDate}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="endDate" className="text-xs font-bold text-slate-400 uppercase tracking-wider">End Date</Label>
                                    <Input
                                        id="endDate"
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl"
                                        required
                                    />
                                    {errors.endDate && <p className="text-xs font-semibold text-red-500">{errors.endDate}</p>}
                                </div>

                                <div className="sm:col-span-2 rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-xs text-blue-800">
                                    {leaseDuration > 0 ? `Lease duration: ${leaseDuration} days.` : "Select valid dates to calculate the lease duration."}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md rounded-2xl overflow-hidden">
                            <CardHeader className="border-b">
                                <CardTitle className="text-base font-extrabold flex items-center gap-2">
                                    <Calendar className="h-4.5 w-4.5 text-blue-500" /> 3. Payment, Renewal & Responsibilities
                                </CardTitle>
                                <CardDescription>Define when rent is due and what happens at renewal or termination.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 grid gap-4 sm:grid-cols-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="rentDueDay" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rent due day</Label>
                                    <Input id="rentDueDay" type="number" min="1" max="31" value={rentDueDay} onChange={(e) => setRentDueDay(e.target.value)} className="h-11 rounded-xl" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="gracePeriod" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Grace period (days)</Label>
                                    <Input id="gracePeriod" type="number" min="0" value={gracePeriod} onChange={(e) => setGracePeriod(e.target.value)} className="h-11 rounded-xl" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="lateFee" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Late fee (%)</Label>
                                    <Input id="lateFee" type="number" min="0" max="100" value={lateFeePercent} onChange={(e) => setLateFeePercent(e.target.value)} className="h-11 rounded-xl" />
                                </div>
                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Renewal arrangement</Label>
                                    <Select value={renewalType} onValueChange={setRenewalType}>
                                        <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="fixed">Fixed term — new agreement required</SelectItem>
                                            <SelectItem value="automatic">Automatic renewal</SelectItem>
                                            <SelectItem value="month-to-month">Continue month-to-month</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="noticePeriod" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Notice period (days)</Label>
                                    <Input id="noticePeriod" type="number" min="0" value={noticePeriod} onChange={(e) => setNoticePeriod(e.target.value)} className="h-11 rounded-xl" />
                                </div>
                                <div className="space-y-1.5 sm:col-span-3">
                                    <Label htmlFor="utilities" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Utilities and service responsibilities</Label>
                                    <Textarea id="utilities" rows={3} value={utilities} onChange={(e) => setUtilities(e.target.value)} className="rounded-xl" />
                                </div>
                            </CardContent>
                        </Card>

                        {/* House Rules Section */}
                        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md rounded-2xl overflow-hidden">
                            <CardHeader className="border-b">
                                <CardTitle className="text-base font-extrabold flex items-center gap-2">
                                    <Calendar className="h-4.5 w-4.5 text-blue-500" /> 4. House Rules Checklist
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Add a new house rule item..."
                                        value={newRule}
                                        onChange={(e) => setNewRule(e.target.value)}
                                        className="h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl flex-1"
                                    />
                                    <Button
                                        type="button"
                                        onClick={handleAddRule}
                                        className="rounded-xl bg-blue-600 text-white hover:bg-blue-700 min-h-[44px] px-4 font-bold"
                                    >
                                        <Plus className="h-4 w-4 mr-1" /> Add
                                    </Button>
                                </div>

                                {rules.length === 0 ? (
                                    <p className="text-xs text-slate-400 italic text-center py-3">No specific house rules added yet.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {rules.map((rule, idx) => (
                                            <div key={idx} className="flex justify-between items-center p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-550/[0.01] dark:bg-slate-950/40 text-xs">
                                                <span className="font-semibold text-slate-700 dark:text-slate-350">{idx + 1}. {rule}</span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleRemoveRule(idx)}
                                                    className="h-7 w-7 text-red-500 hover:bg-red-50 rounded-lg"
                                                >
                                                    <X className="h-4.5 w-4.5" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Terms and Conditions */}
                        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md rounded-2xl overflow-hidden">
                            <CardHeader className="border-b">
                                <CardTitle className="text-base font-extrabold flex items-center gap-2">
                                    <FileText className="h-4.5 w-4.5 text-blue-500" /> 5. Terms and Conditions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <Textarea
                                    rows={10}
                                    placeholder="Enter full contract terms and details..."
                                    value={terms}
                                    onChange={(e) => {
                                        setTerms(e.target.value)
                                        setTemplateEdited(true)
                                    }}
                                    className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono leading-relaxed"
                                    required
                                />
                                <p className="mt-2 text-xs text-slate-500">Review this template for the property’s jurisdiction before sending it for signature.</p>
                                {errors.terms && <p className="mt-1 text-xs font-semibold text-red-500">{errors.terms}</p>}
                            </CardContent>
                        </Card>

                        <Card className="border border-blue-200 bg-blue-50/50 shadow-sm rounded-2xl">
                            <CardHeader>
                                <CardTitle className="text-base font-extrabold">Agreement Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
                                <div><span className="text-slate-500">Property:</span> <strong>{selectedPropertyDetails?.title || "Not selected"}</strong></div>
                                <div><span className="text-slate-500">Tenant:</span> <strong>{selectedTenantDetails?.full_name || selectedTenantDetails?.name || "Not selected"}</strong></div>
                                <div><span className="text-slate-500">Rent:</span> <strong>{formatCurrency(rentAmount)} / {paymentFrequency}</strong></div>
                                <div><span className="text-slate-500">Deposit:</span> <strong>{formatCurrency(securityDeposit)}</strong></div>
                                <div><span className="text-slate-500">Period:</span> <strong>{startDate || "—"} to {endDate || "—"}</strong></div>
                                <div><span className="text-slate-500">Renewal:</span> <strong>{renewalType.replaceAll("-", " ")}</strong></div>
                            </CardContent>
                        </Card>

                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                            <div className="flex items-start gap-3">
                                <Checkbox id="reviewed" checked={reviewed} onCheckedChange={(checked) => setReviewed(checked === true)} />
                                <Label htmlFor="reviewed" className="text-sm leading-relaxed">
                                    I confirm that I have reviewed the parties, property, financial terms, dates, rules, and conditions in this draft.
                                </Label>
                            </div>
                            {errors.reviewed && <p className="mt-2 text-xs font-semibold text-red-500">{errors.reviewed}</p>}
                        </div>

                        {/* Form submit */}
                        <div className="grid gap-3 sm:grid-cols-2">
                            <Button type="button" variant="outline" onClick={() => setPreviewOpen(true)} className="h-12 rounded-xl font-bold">
                                <FileText className="h-4.5 w-4.5 mr-2" /> Preview Agreement
                            </Button>
                            <Button
                                type="submit"
                                disabled={saving}
                                className="h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm tracking-wide shadow-lg shadow-green-600/10 flex items-center justify-center gap-2"
                            >
                            {saving ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Saving Lease Draft...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4.5 w-4.5" />
                                    Save Lease Draft Agreement
                                </>
                            )}
                            </Button>
                        </div>

                    </form>
                </div>
                <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                    <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{title || "Untitled Lease Agreement"}</DialogTitle>
                            <DialogDescription>Draft preview — review all information before saving or sending.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-5 text-sm">
                            <div className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
                                <p><strong>Property:</strong> {selectedPropertyDetails?.title || "Not selected"}<br />{selectedPropertyDetails?.address}</p>
                                <p><strong>Tenant:</strong> {selectedTenantDetails?.full_name || selectedTenantDetails?.name || "Not selected"}<br />{selectedTenantDetails?.email}</p>
                                <p><strong>Term:</strong> {startDate || "—"} to {endDate || "—"}</p>
                                <p><strong>Rent:</strong> {formatCurrency(rentAmount)} / {paymentFrequency}<br /><strong>Deposit:</strong> {formatCurrency(securityDeposit)}</p>
                            </div>
                            <section><h3 className="mb-2 font-bold">Payment and renewal</h3><p>Rent due on day {rentDueDay}; {gracePeriod}-day grace period; {lateFeePercent}% late fee. {noticePeriod} days’ written notice. Renewal: {renewalType.replaceAll("-", " ")}.</p></section>
                            <section><h3 className="mb-2 font-bold">Utilities</h3><p>{utilities}</p></section>
                            <section><h3 className="mb-2 font-bold">House rules</h3><ol className="list-decimal space-y-1 pl-5">{rules.map((rule) => <li key={rule}>{rule}</li>)}</ol></section>
                            <section><h3 className="mb-2 font-bold">Terms and conditions</h3><p className="whitespace-pre-wrap leading-relaxed">{terms}</p></section>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </RoleGuard>
    )
}
