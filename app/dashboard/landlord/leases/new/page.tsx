"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { FileText, Building2, User, Calendar, DollarSign, Shield, AlertCircle, Save, Send, Eye, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react"

function LeaseFormContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const appId = searchParams.get("appId")
    const propertyIdParam = searchParams.get("propertyId")

    const [loading, setLoading] = useState(false)
    const [fetchingInitial, setFetchingInitial] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [previewMode, setPreviewMode] = useState(false)

    // Data dropdowns
    const [properties, setProperties] = useState<any[]>([])
    const [tenants, setTenants] = useState<any[]>([])
    const [applications, setApplications] = useState<any[]>([])

    // Form state
    const [formData, setFormData] = useState({
        applicationId: appId || "",
        propertyId: propertyIdParam || "",
        unitId: "",
        tenantId: "",
        title: "Standard Residential Lease Agreement",
        templateType: "residential",
        rentAmount: "",
        paymentFrequency: "monthly",
        securityDeposit: "",
        serviceCharge: "0",
        otherCharges: "0",
        startDate: "",
        endDate: "",
        dueDay: "1",
        gracePeriodDays: "5",
        lateFeeType: "fixed",
        lateFeeAmount: "5000",
        renewalTerms: "Notice must be given 30 days prior to lease end for renewal eligibility.",
        noticePeriodDays: "30",
        propertyRules: "No unauthorized subletting. Keep noise levels reasonable between 10 PM and 7 AM.",
        maintenanceTerms: "Landlord responsible for structural repairs. Tenant responsible for minor consumables.",
        utilityTerms: "Tenant pays electricity and water bills directly.",
        guestPolicy: "Overnight guests allowed up to 7 consecutive days without approval.",
        petPolicy: "No pets allowed without prior written consent.",
        terminationTerms: "Either party may terminate with 30 days written notice or in breach of terms.",
        customTerms: "",
    })

    useEffect(() => {
        async function loadInitialData() {
            setFetchingInitial(true)
            try {
                // Fetch approved applications / rentals
                const rentalsRes = await fetch("/api/rentals?role=landlord")
                if (rentalsRes.ok) {
                    const rentalsData = await rentalsRes.json()
                    const approved = rentalsData.rentals?.filter((r: any) => r.status === "approved" || r.status === "pending") || []
                    setApplications(approved)

                    if (appId) {
                        const target = approved.find((r: any) => r.id === appId)
                        if (target) {
                            setFormData(prev => ({
                                ...prev,
                                applicationId: target.id,
                                propertyId: target.property_id || prev.propertyId,
                                tenantId: target.tenant_id || prev.tenantId,
                                rentAmount: target.rent_amount ? target.rent_amount.toString() : prev.rentAmount,
                                title: `Lease for ${target.property?.title || 'Property'}`
                            }))
                        }
                    }
                }

                // Fetch landlord properties
                const propsRes = await fetch("/api/listings?role=landlord")
                if (propsRes.ok) {
                    const propsData = await propsRes.json()
                    setProperties(propsData.listings || propsData.properties || [])
                }
            } catch (err) {
                console.error("Error loading lease form initial data:", err)
            } finally {
                setFetchingInitial(false)
            }
        }
        loadInitialData()
    }, [appId])

    const handleTemplateChange = (template: string) => {
        let defaultTitle = "Digital Lease Agreement"
        let rules = formData.propertyRules
        let terms = formData.terminationTerms

        switch (template) {
            case "residential":
                defaultTitle = "Residential Lease Agreement"
                break
            case "single_room":
                defaultTitle = "Single Room Tenancy Contract"
                break
            case "shared_apartment":
                defaultTitle = "Shared Apartment Occupancy Agreement"
                break
            case "hostel":
                defaultTitle = "Student Hostel Accommodation Contract"
                break
            case "commercial":
                defaultTitle = "Commercial Premises Lease Agreement"
                break
            case "office":
                defaultTitle = "Commercial Office Space Lease"
                break
            case "shop":
                defaultTitle = "Retail Shop Location Contract"
                break
            case "short_let":
                defaultTitle = "Short-Let Serviced Occupancy Agreement"
                break
            case "custom":
                defaultTitle = "Custom Tenancy Agreement"
                break
        }

        setFormData(prev => ({
            ...prev,
            templateType: template,
            title: defaultTitle
        }))
    }

    const handleSubmit = async (action: "save_draft" | "send_tenant") => {
        setError(null)
        setLoading(true)

        try {
            const res = await fetch("/api/leases", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    action
                })
            })

            const data = await res.json()
            if (!res.ok) {
                throw new Error(data.error || "Failed to process lease agreement")
            }

            router.push("/dashboard/landlord/leases")
        } catch (err: any) {
            setError(err.message || "An error occurred while creating lease.")
        } finally {
            setLoading(false)
        }
    }

    if (fetchingInitial) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="text-sm text-slate-400 font-medium">Loading lease creation engine...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Top Header Navigation */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center space-x-2 text-slate-400 hover:text-white text-sm font-medium transition"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Leases</span>
                    </button>
                    <div className="flex items-center space-x-3">
                        <button
                            type="button"
                            onClick={() => setPreviewMode(!previewMode)}
                            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 transition"
                        >
                            <Eye className="w-4 h-4 text-blue-400" />
                            <span>{previewMode ? "Edit Contract" : "Preview Contract"}</span>
                        </button>
                    </div>
                </div>

                {/* Header Title */}
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Create Digital Lease Agreement</h1>
                    <p className="text-sm text-slate-400 mt-1">Generate a legally binding electronic contract with digital signature enforcement.</p>
                </div>

                {error && (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start space-x-3 text-rose-300 text-sm">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                {previewMode ? (
                    /* Preview Mode View */
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
                        <div className="border-b border-slate-800 pb-4 flex justify-between items-start">
                            <div>
                                <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest">{formData.templateType} TEMPLATE</span>
                                <h2 className="text-xl font-bold text-white mt-1">{formData.title}</h2>
                            </div>
                            <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full text-xs font-medium">DRAFT PREVIEW</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-300">
                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                                <span className="text-xs text-slate-400 block mb-1 font-medium">Financial Terms</span>
                                <p className="font-semibold text-white">Rent: ${Number(formData.rentAmount || 0).toLocaleString()} / {formData.paymentFrequency}</p>
                                <p className="text-xs text-slate-400 mt-1">Security Deposit: ${Number(formData.securityDeposit || 0).toLocaleString()}</p>
                                <p className="text-xs text-slate-400">Service Charge: ${Number(formData.serviceCharge || 0).toLocaleString()}</p>
                            </div>
                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                                <span className="text-xs text-slate-400 block mb-1 font-medium">Tenancy Duration</span>
                                <p className="font-semibold text-white">Start: {formData.startDate || "Not set"}</p>
                                <p className="font-semibold text-white">End: {formData.endDate || "Not set"}</p>
                                <p className="text-xs text-slate-400 mt-1">Due Day: Day {formData.dueDay} | Grace Period: {formData.gracePeriodDays} Days</p>
                            </div>
                        </div>

                        <div className="space-y-4 text-xs leading-relaxed text-slate-300">
                            <div>
                                <h4 className="font-semibold text-sm text-blue-400 mb-1">House & Property Rules</h4>
                                <p className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">{formData.propertyRules || "None specified"}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm text-blue-400 mb-1">Maintenance & Utility Responsibilities</h4>
                                <p className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">{formData.maintenanceTerms}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm text-blue-400 mb-1">Termination Terms</h4>
                                <p className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">{formData.terminationTerms}</p>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => handleSubmit("save_draft")}
                                disabled={loading}
                                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition"
                            >
                                Save Draft
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSubmit("send_tenant")}
                                disabled={loading}
                                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition"
                            >
                                Send to Tenant Now
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Edit Form View */
                    <div className="space-y-8">
                        {/* Section 1: Template Selection */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                            <div className="flex items-center space-x-2 text-blue-400 font-semibold text-sm">
                                <FileText className="w-4 h-4" />
                                <span>1. Select Lease Template</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                                {[
                                    { id: "residential", label: "Residential" },
                                    { id: "single_room", label: "Single Room" },
                                    { id: "shared_apartment", label: "Shared Apt" },
                                    { id: "hostel", label: "Hostel" },
                                    { id: "commercial", label: "Commercial" },
                                    { id: "office", label: "Office" },
                                    { id: "shop", label: "Shop Location" },
                                    { id: "short_let", label: "Short-Let" },
                                    { id: "custom", label: "Custom" },
                                ].map((tpl) => (
                                    <button
                                        key={tpl.id}
                                        type="button"
                                        onClick={() => handleTemplateChange(tpl.id)}
                                        className={`p-3 rounded-xl border text-xs font-medium text-center transition ${formData.templateType === tpl.id
                                                ? "bg-blue-600/20 border-blue-500 text-white shadow-md"
                                                : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                                            }`}
                                    >
                                        {tpl.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Section 2: Property & Tenant Linkage */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                            <div className="flex items-center space-x-2 text-blue-400 font-semibold text-sm">
                                <Building2 className="w-4 h-4" />
                                <span>2. Property & Tenant Selection</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Property *</label>
                                    <select
                                        value={formData.propertyId}
                                        onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">-- Select Property --</option>
                                        {properties.map((p: any) => (
                                            <option key={p.id} value={p.id}>{p.title} ({p.address || p.city || 'Property'})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Tenant Application Link *</label>
                                    <select
                                        value={formData.applicationId}
                                        onChange={(e) => {
                                            const selectedApp = applications.find((a: any) => a.id === e.target.value)
                                            setFormData({
                                                ...formData,
                                                applicationId: e.target.value,
                                                tenantId: selectedApp?.tenant_id || formData.tenantId,
                                                propertyId: selectedApp?.property_id || formData.propertyId,
                                                rentAmount: selectedApp?.rent_amount ? selectedApp.rent_amount.toString() : formData.rentAmount
                                            })
                                        }}
                                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">-- Select Approved Application --</option>
                                        {applications.map((app: any) => (
                                            <option key={app.id} value={app.id}>
                                                App #{app.id.substring(0, 8)} - {app.tenant?.name || 'Tenant'} ({app.property?.title || 'Property'})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Rent & Financial Terms */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                            <div className="flex items-center space-x-2 text-blue-400 font-semibold text-sm">
                                <DollarSign className="w-4 h-4" />
                                <span>3. Rent & Financial Structure</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Rent Amount ($) *</label>
                                    <input
                                        type="number"
                                        value={formData.rentAmount}
                                        onChange={(e) => setFormData({ ...formData, rentAmount: e.target.value })}
                                        placeholder="e.g. 1200000"
                                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Payment Frequency *</label>
                                    <select
                                        value={formData.paymentFrequency}
                                        onChange={(e) => setFormData({ ...formData, paymentFrequency: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="monthly">Monthly</option>
                                        <option value="quarterly">Quarterly</option>
                                        <option value="biannual">Biannual (6 Months)</option>
                                        <option value="yearly">Annual / Yearly</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Security Deposit ($)</label>
                                    <input
                                        type="number"
                                        value={formData.securityDeposit}
                                        onChange={(e) => setFormData({ ...formData, securityDeposit: e.target.value })}
                                        placeholder="e.g. 200000"
                                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Service Charge ($)</label>
                                    <input
                                        type="number"
                                        value={formData.serviceCharge}
                                        onChange={(e) => setFormData({ ...formData, serviceCharge: e.target.value })}
                                        placeholder="e.g. 50000"
                                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 4: Lease Dates & Late Terms */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                            <div className="flex items-center space-x-2 text-blue-400 font-semibold text-sm">
                                <Calendar className="w-4 h-4" />
                                <span>4. Lease Duration & Late Terms</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Lease Start Date *</label>
                                    <input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Lease End Date *</label>
                                    <input
                                        type="date"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Grace Period (Days)</label>
                                    <input
                                        type="number"
                                        value={formData.gracePeriodDays}
                                        onChange={(e) => setFormData({ ...formData, gracePeriodDays: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Late Fee Amount ($)</label>
                                    <input
                                        type="number"
                                        value={formData.lateFeeAmount}
                                        onChange={(e) => setFormData({ ...formData, lateFeeAmount: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 5: Specific Rules & Clauses */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                            <div className="flex items-center space-x-2 text-blue-400 font-semibold text-sm">
                                <Shield className="w-4 h-4" />
                                <span>5. Property Rules & Custom Clauses</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-1.5">House & Property Rules</label>
                                    <textarea
                                        rows={3}
                                        value={formData.propertyRules}
                                        onChange={(e) => setFormData({ ...formData, propertyRules: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Maintenance & Utility Terms</label>
                                    <textarea
                                        rows={3}
                                        value={formData.maintenanceTerms}
                                        onChange={(e) => setFormData({ ...formData, maintenanceTerms: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit Action Buttons */}
                        <div className="flex items-center justify-end space-x-4 pt-4">
                            <button
                                type="button"
                                onClick={() => handleSubmit("save_draft")}
                                disabled={loading}
                                className="px-6 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white font-semibold text-xs rounded-xl flex items-center space-x-2 transition disabled:opacity-50"
                            >
                                <Save className="w-4 h-4 text-slate-400" />
                                <span>Save Draft</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSubmit("send_tenant")}
                                disabled={loading}
                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/20 flex items-center space-x-2 transition disabled:opacity-50"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                                <span>Send to Tenant for Signature</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function NewLeaseAgreementPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8 text-slate-400 text-xs">
                <Loader2 className="w-6 h-6 animate-spin mr-2 text-blue-500" />
                <span>Loading lease editor...</span>
            </div>
        }>
            <LeaseFormContent />
        </Suspense>
    )
}

