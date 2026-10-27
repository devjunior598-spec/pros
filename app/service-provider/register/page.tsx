"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Wrench, ShieldCheck, Upload, Phone, Building2, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"

export default function ServiceProviderRegisterPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMsg, setSuccessMsg] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        tradeCategory: "Electrician",
        skills: "Wiring, DB Panel repair, Inverter setup",
        yearsExperience: "5",
        phone: "",
        address: "",
        bankName: "Wema Bank",
        bankAccountNumber: "",
        bankAccountName: "",
        serviceAreas: "Lekki, Victoria Island, Ikoyi"
    })

    const categories = [
        "Electrician", "Plumber", "Painter", "Cleaner", "Carpenter",
        "AC Technician", "Welder", "Generator Technician", "Internet Installer",
        "Security Installer", "CCTV Installer", "Locksmith"
    ]

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            const res = await fetch("/api/providers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    skills: formData.skills.split(",").map(s => s.trim()),
                    serviceAreas: formData.serviceAreas.split(",").map(a => a.trim())
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed to register service provider profile")

            setSuccessMsg("Provider registration submitted! Admin review pending.")
            setTimeout(() => {
                router.push("/service-provider/dashboard")
            }, 2000)
        } catch (err: any) {
            setError(err.message || "Registration failed.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
            <div className="max-w-3xl mx-auto space-y-6">
                <div>
                    <span className="text-xs font-mono text-blue-400 uppercase tracking-widest">PRMS MARKETPLACE</span>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-1">Service Provider Registration</h1>
                    <p className="text-sm text-slate-400 mt-1">Join the PRMS verified technician network to receive repair job dispatches.</p>
                </div>

                {error && (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs">
                        {error}
                    </div>
                )}

                {successMsg && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{successMsg}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-2">Primary Trade Skill *</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, tradeCategory: cat })}
                                    className={`p-2.5 rounded-xl border text-xs font-medium text-center transition ${formData.tradeCategory === cat
                                            ? "bg-blue-600 border-blue-500 text-white shadow-md"
                                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1.5">Phone Number *</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="(555) 555-0123"
                                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1.5">Years of Experience</label>
                            <input
                                type="number"
                                value={formData.yearsExperience}
                                onChange={(e) => setFormData({ ...formData, yearsExperience: e.target.value })}
                                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">Specific Skills (Comma-separated)</label>
                        <input
                            type="text"
                            value={formData.skills}
                            onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">Service Areas / Coverage Zones</label>
                        <input
                            type="text"
                            value={formData.serviceAreas}
                            onChange={(e) => setFormData({ ...formData, serviceAreas: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100"
                        />
                    </div>

                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
                        <h4 className="font-semibold text-xs text-blue-400 uppercase tracking-widest">Payout Bank Account Details</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-[11px] text-slate-400 mb-1">Bank Name</label>
                                <input
                                    type="text"
                                    value={formData.bankName}
                                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] text-slate-400 mb-1">NUBAN Account Number *</label>
                                <input
                                    type="text"
                                    value={formData.bankAccountNumber}
                                    onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] text-slate-400 mb-1">Account Holder Name</label>
                                <input
                                    type="text"
                                    value={formData.bankAccountName}
                                    onChange={(e) => setFormData({ ...formData, bankAccountName: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-lg flex items-center justify-center space-x-2 transition disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wrench className="w-4 h-4" />}
                        <span>Submit Provider Application</span>
                    </button>
                </form>
            </div>
        </div>
    )
}
