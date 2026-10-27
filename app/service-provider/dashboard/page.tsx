"use client"

import React, { useState, useEffect } from "react"
import { Wrench, CheckCircle2, Clock, MapPin, Navigation, DollarSign, Camera, ShieldCheck, Loader2 } from "lucide-react"

export default function ServiceProviderDashboardPage() {
    const [jobs, setJobs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

    useEffect(() => {
        loadJobs()
    }, [])

    async function loadJobs() {
        setLoading(true)
        try {
            const res = await fetch("/api/providers/jobs")
            if (res.ok) {
                const data = await res.json()
                setJobs(data.jobs || [])
            }
        } catch (err) {
            console.error("Error loading provider jobs:", err)
        } finally {
            setLoading(false)
        }
    }

    const handleJobAction = async (jobId: string, action: string) => {
        setActionLoadingId(jobId)
        try {
            const res = await fetch("/api/providers/jobs", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ jobId, action })
            })
            if (res.ok) {
                loadJobs()
            }
        } catch (err) {
            console.error("Error executing job action:", err)
        } finally {
            setActionLoadingId(null)
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-6">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest">TECHNICIAN WORKSTATION</span>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-1">Provider Dispatch Desk</h1>
                    </div>
                    <div className="px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-semibold shrink-0">
                        Status: Available for Dispatch
                    </div>
                </div>

                {loading ? (
                    <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-3">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        <p className="text-xs text-slate-400">Loading assigned jobs...</p>
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs">
                        No active jobs assigned at this moment. You will be notified when a new dispatch arrives.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {jobs.map((job) => (
                            <div key={job.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-full text-[10px] font-bold">
                                            {job.status}
                                        </span>
                                        <h3 className="font-bold text-white text-base mt-2">{job.ticket?.title}</h3>
                                        <p className="text-xs text-slate-400 mt-1">📍 {job.property?.title} — {job.property?.address}</p>
                                    </div>
                                    <span className="text-xs text-slate-500 font-mono">#{job.ticket?.ticket_number}</span>
                                </div>

                                <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800">
                                    {job.ticket?.description}
                                </p>

                                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                                    <div className="text-xs text-slate-400">
                                        <span>Customer: <strong className="text-white">{job.tenant?.name}</strong> ({job.tenant?.phone || 'No Phone'})</span>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        {job.status === "Assigned" && (
                                            <button
                                                onClick={() => handleJobAction(job.id, "accept")}
                                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow transition"
                                            >
                                                Accept Job
                                            </button>
                                        )}

                                        {job.status === "Accepted" && (
                                            <button
                                                onClick={() => handleJobAction(job.id, "start_travel")}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow transition flex items-center space-x-1.5"
                                            >
                                                <Navigation className="w-3.5 h-3.5" />
                                                <span>Start Travel (En-Route)</span>
                                            </button>
                                        )}

                                        {job.status === "Travelling" && (
                                            <button
                                                onClick={() => handleJobAction(job.id, "start_work")}
                                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow transition flex items-center space-x-1.5"
                                            >
                                                <Wrench className="w-3.5 h-3.5" />
                                                <span>Arrived & Start Work</span>
                                            </button>
                                        )}

                                        {job.status === "Working" && (
                                            <button
                                                onClick={() => handleJobAction(job.id, "complete")}
                                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow transition flex items-center space-x-1.5"
                                            >
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                <span>Mark Work Completed</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
