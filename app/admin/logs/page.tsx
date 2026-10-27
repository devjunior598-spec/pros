"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    History,
    User,
    Shield,
    Clock,
    Database,
    Lock,
    Search,
    Filter,
    ArrowUpDown,
    Loader2,
    RefreshCw
} from "lucide-react"
import { Input } from "@/components/ui/input"

type LogItem = {
    id: string | number
    event: string
    user: string
    target: string
    date: string
    status: "success" | "warning" | "failed"
}

export default function AdminLogsPage() {
    const [searchTerm, setSearchTerm] = useState("")
    const [logs, setLogs] = useState<LogItem[]>([])
    const [loading, setLoading] = useState(true)

    const fetchLogs = useCallback(async (query: string = "") => {
        setLoading(true)
        try {
            const url = query ? `/api/admin/logs?query=${encodeURIComponent(query)}` : "/api/admin/logs"
            const res = await fetch(url)
            const data = await res.json()
            setLogs(data.logs || [])
        } catch (error) {
            console.error("Error loading logs:", error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchLogs(searchTerm)
        }, 300)
        return () => clearTimeout(timer)
    }, [searchTerm, fetchLogs])

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Audit Logs & Security</h1>
                    <p className="text-muted-foreground">Track administrative actions and system security events in real-time.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search logs by event, actor, or target..."
                            className="pl-10 rounded-xl bg-white dark:bg-gray-950 border-none shadow-sm focus:ring-2 ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => fetchLogs(searchTerm)}
                        className="rounded-xl shrink-0"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                </div>
            </div>

            <Card className="border-none shadow-sm bg-white dark:bg-gray-950">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>System Audit Trail</CardTitle>
                        <CardDescription>A chronological record of verified security activities and user governance.</CardDescription>
                    </div>
                    <Badge variant="outline" className="gap-1">
                        <History className="h-3 w-3" /> {logs.length} Log Entries
                    </Badge>
                </CardHeader>
                <CardContent>
                    <div className="relative overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-400 uppercase text-[10px]">
                                <tr>
                                    <th className="px-6 py-4">Event Type</th>
                                    <th className="px-6 py-4">Actor</th>
                                    <th className="px-6 py-4">Target Resource</th>
                                    <th className="px-6 py-4">Timestamp</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-800">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
                                        </td>
                                    </tr>
                                ) : logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-muted-foreground italic">
                                            No audit logs match the current search filter.
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                                            <td className="px-6 py-4 font-mono text-[11px] font-bold text-blue-900 dark:text-blue-200">
                                                {log.event}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-6 w-6 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                                        <Shield className="h-3 w-3 text-blue-600" />
                                                    </div>
                                                    <span className="font-medium text-xs">{log.user}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                                                    <User className="h-3 w-3" />
                                                    <span>{log.target}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-muted-foreground font-mono">
                                                {new Date(log.date).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[10px] h-4 py-0 ${
                                                        log.status === "success"
                                                            ? "border-green-200 text-green-600 bg-green-50"
                                                            : log.status === "failed"
                                                            ? "border-red-200 text-red-600 bg-red-50"
                                                            : "border-amber-200 text-amber-600 bg-amber-50"
                                                    }`}
                                                >
                                                    {log.status}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
