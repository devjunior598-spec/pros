"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
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
    Loader2,
    Users
} from "lucide-react"

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
    const [properties, setProperties] = useState<any[]>([])
    const [tenants, setTenants] = useState<any[]>([])

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

    useEffect(() => {
        const fetchFormData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    router.push("/login")
                    return
                }
                setLandlordId(user.id)

                // 1. Fetch Landlord Properties
                const { data: props } = await supabase
                    .from("properties")
                    .select("id, title, address")
                    .eq("landlord_id", user.id)
                setProperties(props || [])

                // 2. Fetch Tenants
                const { data: profiles } = await supabase
                    .from("profiles")
                    .select("id, name, email, fullname")
                    .eq("role", "tenant")
                setTenants(profiles || [])

                // Initialize preset residential terms
                setTerms(TEMPLATE_PRESETS.residential.terms)
                setRules(TEMPLATE_PRESETS.residential.rules)

            } catch (err) {
                console.error("Error loading builder data:", err)
            } finally {
                setLoading(false)
            }
        }
        fetchFormData()
    }, [router])

    // Update terms and rules when template changes
    const handleTemplateChange = (type: string) => {
        setTemplateType(type)
        const preset = TEMPLATE_PRESETS[type]
        if (preset) {
            setTerms(preset.terms)
            setRules(preset.rules)
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

        if (!selectedProperty || !selectedTenant || !title || !rentAmount || !startDate || !endDate) {
            alert("Please fill in all required fields.")
            return
        }

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
                    termsAndConditions: terms
                })
            })

            const result = await res.json()
            if (!res.ok) throw new Error(result.error || "Failed to create lease")

            toast({ title: "Lease Draft Created!", description: "Agreement saved as a draft. You can now send it to the tenant." })
            router.push("/dashboard/leases")
        } catch (error: any) {
            console.error(error)
            alert(error.message || "Failed to save lease agreement.")
        } finally {
            setSaving(false)
        }
    }

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
                        
                        {/* Lease Config Card */}
                        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md rounded-2xl overflow-hidden">
                            <CardHeader className="border-b">
                                <CardTitle className="text-base font-extrabold flex items-center gap-2">
                                    <Building2 className="h-4.5 w-4.5 text-blue-500" /> 1. Agreement Configuration
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 grid gap-4 sm:grid-cols-2">
                                
                                <div className="sm:col-span-2 space-y-1.5">
                                    <Label htmlFor="title" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lease Title</Label>
                                    <Input
                                        id="title"
                                        placeholder="e.g. Residential Lease for Apartment 4B"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl"
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Property</Label>
                                    <Select value={selectedProperty} onValueChange={setSelectedProperty} required>
                                        <SelectTrigger className="h-11 rounded-xl">
                                            <SelectValue placeholder="Choose property listing" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {properties.map(p => (
                                                <SelectItem key={p.id} value={p.id}>
                                                    {p.title} ({p.address.substring(0, 20)}...)
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Tenant</Label>
                                    <Select value={selectedTenant} onValueChange={setSelectedTenant} required>
                                        <SelectTrigger className="h-11 rounded-xl">
                                            <SelectValue placeholder="Assign tenant" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {tenants.map(t => (
                                                <SelectItem key={t.id} value={t.id}>
                                                    {t.fullname || t.name} ({t.email})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
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
                                    <Label htmlFor="rentAmount" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rent Price (₦)</Label>
                                    <Input
                                        id="rentAmount"
                                        type="number"
                                        placeholder="e.g. 150000"
                                        value={rentAmount}
                                        onChange={(e) => setRentAmount(e.target.value)}
                                        className="h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl"
                                        required
                                    />
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
                                </div>

                            </CardContent>
                        </Card>

                        {/* House Rules Section */}
                        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md rounded-2xl overflow-hidden">
                            <CardHeader className="border-b">
                                <CardTitle className="text-base font-extrabold flex items-center gap-2">
                                    <Calendar className="h-4.5 w-4.5 text-blue-500" /> 3. House Rules Checklist
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
                                    <FileText className="h-4.5 w-4.5 text-blue-500" /> 4. Terms and Conditions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <Textarea
                                    rows={10}
                                    placeholder="Enter full contract terms and details..."
                                    value={terms}
                                    onChange={(e) => setTerms(e.target.value)}
                                    className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono leading-relaxed"
                                    required
                                />
                            </CardContent>
                        </Card>

                        {/* Form submit */}
                        <Button
                            type="submit"
                            disabled={saving}
                            className="w-full h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm tracking-wide shadow-lg shadow-green-600/10 flex items-center justify-center gap-2"
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

                    </form>
                </div>
            </div>
        </RoleGuard>
    )
}
