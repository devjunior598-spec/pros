"use client"

import { useState } from "react"
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
    ArrowUpDown
} from "lucide-react"
import { Input } from "@/components/ui/input"

export default function AdminLogsPage() {
    const logs = [
        { id: 1, event: "USER_SUSPENDED", user: "Admin (justt)", target: "Jane Doe", date: new Date().toISOString(), status: "success" },
        { id: 2, event: "KYC_APPROVED", user: "Admin (justt)", target: "John Tenant", date: new Date(Date.now() - 3600000).toISOString(), status: "success" },
        { id: 3, event: "WITHDRAWAL_PAID", user: "Admin (justt)", target: "Landlord X", date: new Date(Date.now() - 7200000).toISOString(), status: "success" },
        { id: 4, event: "SYSTEM_CONFIG_UDPATE", user: "Admin (justt)", target: "Platform", date: new Date(Date.now() - 86400000).toISOString(), status: "success" },
    ]

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
                    <p className="text-muted-foreground">Track all administrative actions and system security events.</p>
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search logs..."
                        className="pl-10 rounded-xl bg-white dark:bg-gray-950 border-none shadow-sm focus:ring-2 ring-blue-500"
                    />
                </div>
            </div>

            <Card className="border-none shadow-sm bg-white dark:bg-gray-950">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>System Activity</CardTitle>
                        <CardDescription>A chronological record of platform audits.</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" className="gap-2"><ArrowUpDown className="h-4 w-4" /> Date</Button>
                </CardHeader>
                <CardContent>
                    <div className="relative overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-400 uppercase text-[10px]">
                                <tr>
                                    <th className="px-6 py-4">Event</th>
                                    <th className="px-6 py-4">Actor</th>
                                    <th className="px-6 py-4">Target</th>
                                    <th className="px-6 py-4">Timestamp</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-800">
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-[10px] font-bold">{log.event}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 w-6 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                                    <Shield className="h-3 w-3 text-blue-600" />
                                                </div>
                                                <span>{log.user}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <User className="h-3 w-3" />
                                                <span>{log.target}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-muted-foreground font-mono">
                                            {new Date(log.date).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="outline" className="text-[10px] h-4 py-0 border-green-200 text-green-600 bg-green-50">{log.status}</Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
