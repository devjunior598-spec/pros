"use client"

import React, { useState, useEffect } from "react"
import { HelpCircle, Phone, MessageSquare, Mail, LifeBuoy, Plus, Search, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"

export default function CustomerSupportCentrePage() {
    const [tickets, setTickets] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showNewTicketModal, setShowNewTicketModal] = useState(false)

    const [subject, setSubject] = useState("")
    const [description, setDescription] = useState("")
    const [category, setCategory] = useState("General Inquiry")
    const [department, setDepartment] = useState("General")
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        loadUserTickets()
    }, [])

    async function loadUserTickets() {
        setLoading(true)
        try {
            const res = await fetch("/api/support/tickets")
            if (res.ok) {
                const data = await res.json()
                setTickets(data.tickets || [])
            }
        } catch (err) {
            console.error("Error loading tickets:", err)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            const res = await fetch("/api/support/tickets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subject, description, category, department })
            })
            if (res.ok) {
                setShowNewTicketModal(false)
                setSubject("")
                setDescription("")
                loadUserTickets()
            }
        } catch (err) {
            console.error("Ticket creation error:", err)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Title */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <span className="text-xs font-mono text-blue-400 uppercase tracking-widest">PRMS SUPPORT PORTAL</span>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-1">Customer Support Centre</h1>
                        <p className="text-sm text-slate-400 mt-1">Open a support ticket for help with your account, property, or maintenance request.</p>
                    </div>
                    <button
                        onClick={() => setShowNewTicketModal(true)}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg transition flex items-center space-x-2 shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Open Support Ticket</span>
                    </button>
                </div>

                {/* Support Communication Channels */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
                        <Phone className="w-5 h-5 text-blue-400" />
                        <h4 className="font-bold text-white text-sm">Account Support</h4>
                        <p className="text-xs text-slate-400">Open a ticket below</p>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
                        <MessageSquare className="w-5 h-5 text-emerald-400" />
                        <h4 className="font-bold text-white text-sm">Support Tickets</h4>
                        <p className="text-xs text-slate-400">Track requests in your account</p>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
                        <Mail className="w-5 h-5 text-indigo-400" />
                        <h4 className="font-bold text-white text-sm">U.S. service</h4>
                        <p className="text-xs text-slate-400">Support channels are being updated</p>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
                        <LifeBuoy className="w-5 h-5 text-amber-400" />
                        <h4 className="font-bold text-white text-sm">Knowledge Base</h4>
                        <p className="text-xs text-slate-400">FAQs & User Guides</p>
                    </div>
                </div>

                {/* User Support Tickets */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-white">Your Support Tickets</h2>

                    {loading ? (
                        <div className="p-8 text-center text-slate-400 text-xs">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                            Loading your support tickets...
                        </div>
                    ) : tickets.length === 0 ? (
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs">
                            You have no open support tickets.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {tickets.map((t) => (
                                <div key={t.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center space-x-2">
                                            <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-full text-[10px] font-bold">
                                                {t.department}
                                            </span>
                                            <span className="text-xs text-slate-500 font-mono">#{t.ticket_number}</span>
                                        </div>
                                        <h4 className="font-bold text-white text-base mt-1">{t.subject}</h4>
                                        <p className="text-xs text-slate-400 mt-1">{t.description}</p>
                                    </div>
                                    <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-xs font-semibold">
                                        {t.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Create Ticket Modal */}
                {showNewTicketModal && (
                    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <form onSubmit={handleCreateTicket} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 text-slate-100 shadow-2xl">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                                <h3 className="font-bold text-base text-white">Open Support Ticket</h3>
                                <button type="button" onClick={() => setShowNewTicketModal(false)} className="text-slate-400 hover:text-white text-xs">Close [X]</button>
                            </div>

                            <div>
                                <label className="block text-xs text-slate-300 mb-1">Target Department</label>
                                <select
                                    value={department}
                                    onChange={(e) => setDepartment(e.target.value)}
                                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                                >
                                    <option value="General">General Inquiries</option>
                                    <option value="Technical">Technical & App Support</option>
                                    <option value="Finance">Finance & Payment Support</option>
                                    <option value="Maintenance">Maintenance Dispatch</option>
                                    <option value="Inspection">Inspection Desk</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs text-slate-300 mb-1">Subject *</label>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-slate-300 mb-1">Description *</label>
                                <textarea
                                    rows={3}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs shadow-lg flex items-center justify-center space-x-2"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                <span>Submit Ticket</span>
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    )
}
