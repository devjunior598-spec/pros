"use client"

import React, { useState } from "react"
import { AlertOctagon, Flame, Droplets, Zap, ShieldAlert, HeartPulse, Lock, Loader2, X, PhoneCall } from "lucide-react"

export function EmergencyHotlineButton({ propertyId }: { propertyId?: string }) {
    const [isOpen, setIsOpen] = useState(false)
    const [selectedType, setSelectedType] = useState<string | null>(null)
    const [locationNotes, setLocationNotes] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    const emergencyOptions = [
        { id: "Fire", label: "Fire Outbreak", icon: Flame, color: "text-rose-500 bg-rose-500/10 border-rose-500/30" },
        { id: "Flood", label: "Major Pipe Burst / Flood", icon: Droplets, color: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
        { id: "Gas Leak", label: "Gas Leak / Odor", icon: AlertOctagon, color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
        { id: "Electrical Hazard", label: "Electrical Hazard / Sparking", icon: Zap, color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30" },
        { id: "Break-in", label: "Security Breach / Break-in", icon: ShieldAlert, color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30" },
        { id: "Medical Emergency", label: "Medical Emergency", icon: HeartPulse, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
    ]

    const handleDispatch = async () => {
        if (!selectedType) return
        setIsSubmitting(true)
        try {
            const res = await fetch("/api/emergency", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    propertyId: propertyId || "default_property",
                    emergencyType: selectedType,
                    locationNotes
                })
            })
            const data = await res.json()
            if (res.ok) {
                setSuccessMessage(`EMERGENCY DISPATCHED: ${selectedType}. Rapid response team notified!`)
                setTimeout(() => {
                    setIsOpen(false)
                    setSuccessMessage(null)
                    setSelectedType(null)
                }, 3000)
            }
        } catch (err) {
            console.error("Emergency dispatch error:", err)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <>
            {/* Floating Trigger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-full shadow-2xl shadow-rose-600/50 flex items-center space-x-2 animate-pulse transition transform hover:scale-105"
            >
                <AlertOctagon className="w-6 h-6" />
                <span className="font-bold text-xs uppercase tracking-wider hidden sm:inline">Emergency Hotline</span>
            </button>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-rose-500/40 rounded-3xl p-6 max-w-md w-full space-y-5 text-slate-100 shadow-2xl relative">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
                            <div className="p-3 bg-rose-500/20 border border-rose-500/40 text-rose-400 rounded-2xl">
                                <PhoneCall className="w-6 h-6 animate-bounce" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-white">PRMS Emergency Hotline</h3>
                                <p className="text-xs text-rose-300">One-Click Immediate Incident Alert Dispatch</p>
                            </div>
                        </div>

                        {successMessage ? (
                            <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-2">
                                <AlertOctagon className="w-10 h-10 text-emerald-400 mx-auto" />
                                <h4 className="font-bold text-white text-base">Alert Dispatched!</h4>
                                <p className="text-xs text-emerald-300">{successMessage}</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <span className="text-xs font-semibold text-slate-300 block">Select Emergency Incident Type:</span>
                                <div className="grid grid-cols-2 gap-2.5">
                                    {emergencyOptions.map((opt) => {
                                        const IconComponent = opt.icon
                                        const isSelected = selectedType === opt.id
                                        return (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => setSelectedType(opt.id)}
                                                className={`p-3 rounded-2xl border text-left flex flex-col items-start space-y-2 transition ${isSelected
                                                        ? "bg-rose-600 text-white border-rose-500 shadow-lg"
                                                        : `bg-slate-950 ${opt.color} hover:border-rose-500/50`
                                                    }`}
                                            >
                                                <IconComponent className="w-5 h-5" />
                                                <span className="text-xs font-bold leading-tight">{opt.label}</span>
                                            </button>
                                        )
                                    })}
                                </div>

                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Unit Number / Specific Location Notes</label>
                                    <input
                                        type="text"
                                        value={locationNotes}
                                        onChange={(e) => setLocationNotes(e.target.value)}
                                        placeholder="e.g. Unit 302, Kitchen electrical panel sparking"
                                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                                    />
                                </div>

                                <button
                                    onClick={handleDispatch}
                                    disabled={!selectedType || isSubmitting}
                                    className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold rounded-2xl text-xs shadow-lg shadow-rose-600/30 flex items-center justify-center space-x-2 transition disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Dispatching Rapid Response...</span>
                                        </>
                                    ) : (
                                        <>
                                            <AlertOctagon className="w-4 h-4" />
                                            <span>DISPATCH EMERGENCY ALERT NOW</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}
