"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Bell,
    Send,
    Users,
    Building,
    Briefcase,
    Search,
    Clock,
    CheckCircle,
    AlertTriangle,
    Plus,
    Trash2,
    Eye
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export default function AdminNotificationsPage() {
    const [notifications, setNotifications] = useState([
        { id: 1, title: "System Maintenance", message: "Platform will be down for 2 hours.", target: "All Users", sent_at: new Date().toISOString(), status: "sent" },
        { id: 2, title: "KYC Deadline", message: "Please complete your verification.", target: "Tenants", sent_at: new Date(Date.now() - 86400000).toISOString(), status: "draft" },
    ])

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">System Announcements</h1>
                    <p className="text-muted-foreground">Broadcast updates and notifications to platform users.</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl gap-2 shadow-lg shadow-blue-500/20">
                    <Plus className="h-4 w-4" /> New Announcement
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-none shadow-sm bg-white dark:bg-gray-950">
                        <CardHeader>
                            <CardTitle>Sent History</CardTitle>
                            <CardDescription>Track previously broadcasted messages.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {notifications.map((n) => (
                                    <div key={n.id} className="p-4 border rounded-2xl group hover:border-blue-500/30 transition-all bg-gray-50/50 dark:bg-gray-900/50">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold">{n.title}</h4>
                                                <Badge variant={n.status === 'sent' ? 'default' : 'outline'} className="text-[10px] h-4">
                                                    {n.status}
                                                </Badge>
                                            </div>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><Eye className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-red-500"><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{n.message}</p>
                                        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium pt-3 border-t">
                                            <div className="flex items-center gap-3">
                                                <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {n.target}</span>
                                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(n.sent_at).toLocaleString()}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-green-600">
                                                <CheckCircle className="h-3 w-3" /> Delivered
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="border-none shadow-sm bg-white dark:bg-gray-950 sticky top-8">
                        <CardHeader>
                            <CardTitle>Composer</CardTitle>
                            <CardDescription>Draft a new system-wide message.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="target">Target Audience</Label>
                                <Select defaultValue="all">
                                    <SelectTrigger id="target" className="rounded-xl border-none bg-gray-50 dark:bg-gray-900 shadow-inner">
                                        <SelectValue placeholder="Select target..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Users</SelectItem>
                                        <SelectItem value="tenants">Tenants Only</SelectItem>
                                        <SelectItem value="landlords">Landlords Only</SelectItem>
                                        <SelectItem value="providers">Service Providers Only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="title">Subject</Label>
                                <Input id="title" placeholder="e.g. System Update" className="rounded-xl border-none bg-gray-50 dark:bg-gray-900 shadow-inner" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="message">Message</Label>
                                <Textarea id="message" placeholder="Type your announcement..." className="rounded-xl border-none bg-gray-50 dark:bg-gray-900 shadow-inner min-h-[120px]" />
                            </div>
                            <div className="pt-2">
                                <Button className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl gap-2 py-6 text-lg">
                                    <Send className="h-5 w-5" /> Broadcast Now
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
