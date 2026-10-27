"use client"

import React, { useState, useEffect } from "react"
import { LifeBuoy, CheckCircle2, Clock, MessageSquare, UserCheck, AlertTriangle, Loader2 } from "lucide-react"

export default function SupportAgentWorkbenchPage() {
    const [tickets, setTickets] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadAgentTickets()
    }, [])

    async function loadAgentTickets() {
        setLoading(true)
        try {
            const res = await fetch("/api/support/tickets?role=agent")
            if (res.ok) {
                const data = await res.json()
                setTickets(data.tickets || [])
            }
        } catch (err) {
            console.error("Error loading agent tickets:", err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div>
                    <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest">SUPPORT AGENT WORKBENCH</span>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-1">Agent Helpdesk Workbench</h1>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                        Loading open support tickets...
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {tickets.map((t) => (
                            <div key={t.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center space-x-2">
                                        <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-full text-[10px] font-bold">
                                            {t.department}
                                        </span>
                                        <span className="text-xs text-slate-500 font-mono">#{t.ticket_number}</span>
                                    </div>
                                    <h4 className="font-bold text-white text-base">{t.subject}</h4>
                                    <p className="text-xs text-slate-400">User: <strong className="text-slate-200">{t.user?.name}</strong> ({t.user?.email})</p>
                                </div>

                                <button
                                    onClick={() => alert(`Replying to support ticket ${t.ticket_number}`)}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow"
                                >
                                    Reply & Resolve
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
