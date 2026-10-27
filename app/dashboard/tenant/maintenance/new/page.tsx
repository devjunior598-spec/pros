"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Wrench, AlertOctagon, Camera, Calendar, Clock, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from "lucide-react"

import { supabase } from "@/lib/supabase"

export default function NewMaintenanceTicketPage() {
    const router = useRouter()
    const [properties, setProperties] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        propertyId: "",
        unitId: "",
        title: "",
        category: "Electrical",
        priority: "Medium",
        isEmergency: false,
        description: "",
        preferredVisitDate: "",
        preferredVisitTime: "09:00 AM - 12:00 PM",
        specialInstructions: "",
        images: [] as string[]
    })

    useEffect(() => {
        async function fetchTenantProperties() {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                const { data: rentalData } = await supabase
                    .from("rentals")
                    .select("id, property_id, property:properties(id, title, address)")
                    .eq("tenant_id", user.id)
                    .in("status", ["approved", "active", "accepted"])

                if (rentalData && rentalData.length > 0) {
                    const validProps = rentalData
                        .map((r: any) => r.property)
                        .filter(Boolean)
                    setProperties(validProps)
                    if (validProps[0]?.id) {
                        setFormData(prev => ({ ...prev, propertyId: validProps[0].id }))
                    }
                }
            } catch (err) {
                console.error("Error fetching properties:", err)
            }
        }
        fetchTenantProperties()
    }, [])

    const categories = [
        "Electrical", "Plumbing", "Roof", "Painting", "Cleaning", "Security",
        "Air Conditioning", "Generator", "Water Supply", "Internet", "Appliances",
        "Furniture", "Doors", "Windows", "Locks", "Others"
    ]

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            const res = await fetch("/api/maintenance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed to submit maintenance request")

            router.push("/dashboard/tenant/payments")
        } catch (err: any) {
            setError(err.message || "Failed to create maintenance ticket.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
            <div className="max-w-3xl mx-auto space-y-6">
                <button
                    onClick={() => router.back()}
                    className="flex items-center space-x-2 text-slate-400 hover:text-white text-xs font-medium transition"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                </button>

                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Report Maintenance Issue</h1>
                    <p className="text-sm text-slate-400 mt-1">Submit a repair ticket to your landlord & property manager.</p>
                </div>

                {error && (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start space-x-3 text-rose-300 text-xs">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
                    {/* Emergency Toggle */}
                    <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <AlertOctagon className="w-6 h-6 text-rose-400" />
                            <div>
                                <h4 className="font-bold text-white text-sm">Is this an Urgent Emergency?</h4>
                                <p className="text-xs text-rose-300">Gas leaks, pipe bursts, active fire, electrical sparks.</p>
                            </div>
                        </div>
                        <input
                            type="checkbox"
                            checked={formData.isEmergency}
                            onChange={(e) => setFormData({ ...formData, isEmergency: e.target.checked, priority: e.target.checked ? "Urgent" : formData.priority })}
                            className="w-5 h-5 rounded border-slate-700 text-rose-600 focus:ring-rose-500"
                        />
                    </div>

                    {/* Property Selection */}
                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">Property Location *</label>
                        <select
                            value={formData.propertyId}
                            onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="">-- Select Property --</option>
                            {properties.map((p: any) => (
                                <option key={p.id} value={p.id}>{p.title} ({p.address})</option>
                            ))}
                        </select>
                    </div>

                    {/* Category Selection */}
                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-2">Category *</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, category: cat })}
                                    className={`py-2 px-3 rounded-xl border text-xs font-medium text-center transition ${formData.category === cat
                                            ? "bg-blue-600 border-blue-500 text-white shadow-md"
                                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Title & Priority */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-slate-300 mb-1.5">Problem Title *</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g. Master Bedroom AC Not Cooling"
                                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1.5">Priority</label>
                            <select
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Urgent">Urgent</option>
                            </select>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">Detailed Description *</label>
                        <textarea
                            rows={4}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Describe what happened, error sounds, or specific location in unit..."
                            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    {/* Preferred Visit Time */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1.5">Preferred Visit Date</label>
                            <input
                                type="date"
                                value={formData.preferredVisitDate}
                                onChange={(e) => setFormData({ ...formData, preferredVisitDate: e.target.value })}
                                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1.5">Preferred Time Window</label>
                            <select
                                value={formData.preferredVisitTime}
                                onChange={(e) => setFormData({ ...formData, preferredVisitTime: e.target.value })}
                                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="09:00 AM - 12:00 PM">09:00 AM - 12:00 PM (Morning)</option>
                                <option value="12:00 PM - 03:00 PM">12:00 PM - 03:00 PM (Afternoon)</option>
                                <option value="03:00 PM - 06:00 PM">03:00 PM - 06:00 PM (Evening)</option>
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-600/20 flex items-center justify-center space-x-2 transition disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Generating Ticket Number...</span>
                            </>
                        ) : (
                            <>
                                <Wrench className="w-4 h-4" />
                                <span>Submit Maintenance Ticket</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}
