"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Wrench,
    Clock,
    CheckCircle,
    AlertTriangle,
    Search,
    MoreVertical,
    User,
    Building,
    MessageSquare,
    Loader2,
    Briefcase,
    Eye,
    X,
    ImageIcon,
    Filter,
    ChevronRight,
    MapPin,
    Activity,
    RefreshCw,
    UserPlus
} from "lucide-react"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AdminMaintenancePage() {
    const [requests, setRequests] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [activeTab, setActiveTab] = useState("all")
    const [selectedRequest, setSelectedRequest] = useState<any | null>(null)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)

    const fetchRequests = useCallback(async (signal?: AbortSignal) => {
        setLoading(true)
        try {
            let query = supabase
                .from('maintenance_requests')
                .select(`
                    *,
                    rental:rentals (
                        id,
                        property:properties (title, address, images),
                        tenant:profiles (name, email)
                    ),
                    images:request_images (
                        id,
                        image_url
                    ),
                    assignments:repair_assignments (
                        id,
                        status,
                        provider:service_providers (
                            category,
                            user:profiles (name, phone)
                        )
                    )
                `)
                .order('created_at', { ascending: false })

            if (signal) {
                query = query
            }

            const { data, error } = await query

            if (error) {
                if (!signal?.aborted) throw error
            } else if (!signal?.aborted) {
                setRequests(data || [])
            }
        } catch (error) {
            if (signal?.aborted) return
            console.error("Error fetching maintenance requests:", error)
        } finally {
            if (!signal?.aborted) {
                setLoading(false)
            }
        }
    }, [])

    useEffect(() => {
        let mounted = true
        fetchRequests()
        return () => mounted = false
    }, [fetchRequests])

    const filtered = requests.filter(r => {
        const matchesSearch = (
            r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.rental?.property?.title?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        const matchesTab = activeTab === 'all' || r.status === activeTab
        return matchesSearch && matchesTab
    })

    const handleViewDetails = (request: any) => {
        setSelectedRequest(request)
        setIsDetailsOpen(true)
    }

    const categories = Array.from(new Set(requests.map(r => r.category))).filter(Boolean)

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Maintenance Control</h1>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <p>Monitor platform-wide repair requests and provider assignments.</p>
                        <Badge variant="outline" className="bg-blue-50/50 text-blue-700 border-blue-100">{requests.length} Total</Badge>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2 rounded-xl">
                        <Filter className="h-4 w-4" /> Filters
                    </Button>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search repairs..."
                            className="pl-10 rounded-xl bg-white dark:bg-gray-950 border-none shadow-sm focus:ring-2 ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard title="Pending" value={requests.filter(r => r.status === 'pending').length} icon={Clock} color="yellow" />
                <StatCard title="In Progress" value={requests.filter(r => r.status === 'in_progress').length} icon={Wrench} color="blue" />
                <StatCard title="Completed" value={requests.filter(r => r.status === 'completed').length} icon={CheckCircle} color="green" />
                <StatCard title="Emergency" value={requests.filter(r => r.priority === 'emergency').length} icon={AlertTriangle} color="red" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border-none shadow-sm bg-white dark:bg-gray-950">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Resolution Performance</CardTitle>
                            <CardDescription>Average time to close tickets per month.</CardDescription>
                        </div>
                        <Activity className="h-5 w-5 text-blue-500 opacity-50" />
                    </CardHeader>
                    <CardContent>
                        <div className="h-64 flex flex-col justify-end gap-2 px-4 pb-4">
                            <div className="flex items-end gap-1 h-full">
                                {[3, 5, 2, 8, 4, 6, 9, 7].map((h, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                        <div
                                            className="w-full bg-blue-100 dark:bg-blue-900 group-hover:bg-blue-600 transition-all rounded-t-lg relative"
                                            style={{ height: `${h * 10}%` }}
                                        >
                                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-[10px] font-bold text-blue-600 transition-opacity">
                                                {h}d
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground">M{i + 1}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white dark:bg-gray-950">
                    <CardHeader>
                        <CardTitle>Issue Categories</CardTitle>
                        <CardDescription>Frequency by type.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-5">
                            {[
                                { label: "Plumbing", count: 42, color: "bg-blue-500" },
                                { label: "Electrical", count: 28, color: "bg-yellow-500" },
                                { label: "HVAC", count: 15, color: "bg-cyan-500" },
                                { label: "Structural", count: 12, color: "bg-purple-500" },
                                { label: "Others", count: 8, color: "bg-gray-400" }
                            ].map((cat, i) => (
                                <div key={i} className="space-y-1.5">
                                    <div className="flex justify-between text-xs font-medium">
                                        <span>{cat.label}</span>
                                        <span className="text-muted-foreground">{cat.count}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className={cn("h-full transition-all duration-1000", cat.color)}
                                            style={{ width: `${cat.count}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="bg-white dark:bg-gray-950 p-1 border shadow-sm rounded-xl mb-6">
                    <TabsTrigger value="all" className="rounded-lg">All Requests</TabsTrigger>
                    <TabsTrigger value="pending" className="rounded-lg">Pending</TabsTrigger>
                    <TabsTrigger value="in_progress" className="rounded-lg">In Progress</TabsTrigger>
                    <TabsTrigger value="completed" className="rounded-lg">History</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab}>
                    <Card className="border-none shadow-sm bg-white dark:bg-gray-950">
                        <CardHeader>
                            <CardTitle>Global Repair List</CardTitle>
                            <CardDescription>Track all maintenance activities across the platform.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="relative overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-400 uppercase text-[10px]">
                                        <tr>
                                            <th className="px-6 py-4">Request Issue</th>
                                            <th className="px-6 py-4">Property & Tenant</th>
                                            <th className="px-6 py-4">Assignment</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y dark:divide-gray-800">
                                        {loading ? (
                                            <tr><td colSpan={5} className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" /></td></tr>
                                        ) : filtered.length === 0 ? (
                                            <tr><td colSpan={5} className="py-20 text-center text-muted-foreground italic">No maintenance requests found in this category.</td></tr>
                                        ) : (
                                            filtered.map((r) => {
                                                const assignment = r.assignments?.[0]
                                                return (
                                                    <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors group">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className={cn(
                                                                    "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                                                                    r.priority === 'emergency' ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                                                                )}>
                                                                    <Wrench className="h-5 w-5" />
                                                                </div>
                                                                <div>
                                                                    <div className="font-bold text-gray-900 dark:text-gray-100 line-clamp-1">{r.title}</div>
                                                                    <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                                                                        <Badge variant="outline" className={cn(
                                                                            "text-[8px] h-3.5 px-1 py-0 border-none capitalize font-bold",
                                                                            r.priority === 'emergency' ? "bg-red-600 text-white" : "bg-gray-100 text-gray-600"
                                                                        )}>{r.priority}</Badge>
                                                                        <span>{new Date(r.created_at).toLocaleDateString()}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-medium flex items-center gap-1"><Building className="h-3 w-3 opacity-40" /> {r.rental?.property?.title}</span>
                                                                <span className="text-[10px] text-muted-foreground flex items-center gap-1"><User className="h-3 w-3 opacity-40" /> {r.rental?.tenant?.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {assignment ? (
                                                                <div className="flex items-center gap-2 relative">
                                                                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center border-2 border-white dark:border-gray-900">
                                                                        <Briefcase className="h-4 w-4 text-blue-600" />
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-xs font-semibold">{assignment.provider?.user?.name}</span>
                                                                        <span className="text-[9px] text-muted-foreground uppercase tracking-tighter">{assignment.provider?.category}</span>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <Badge variant="secondary" className="text-[9px] bg-gray-100 text-gray-400 font-normal">Pending Assignment</Badge>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col gap-1">
                                                                <StatusBadge status={r.status} />
                                                                {r.images?.length > 0 && (
                                                                    <span className="text-[9px] text-blue-600 flex items-center gap-1 font-medium"><ImageIcon className="h-3 w-3" /> {r.images.length} Evidence</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 rounded-full hover:bg-white border hover:border-blue-200 text-blue-600"
                                                                    onClick={() => handleViewDetails(r)}
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                                                            <MoreVertical className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end" className="w-56 rounded-xl border-none shadow-xl">
                                                                        <DropdownMenuLabel>Moderation</DropdownMenuLabel>
                                                                        <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => handleViewDetails(r)}>
                                                                            <Eye className="h-4 w-4" /> Comprehensive Inspection
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem className="gap-2 cursor-pointer">
                                                                            <MessageSquare className="h-4 w-4" /> Communication Hub
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuSeparator />
                                                                        <DropdownMenuItem className="gap-2 cursor-pointer text-orange-600">
                                                                            <AlertTriangle className="h-4 w-4" /> Flag for Discipline
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem className="gap-2 cursor-pointer text-blue-600 font-bold">
                                                                            <RefreshCw className="h-4 w-4" /> Reassign Professional
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Inspection Dialog */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-3xl rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
                    {selectedRequest && (
                        <div className="flex flex-col h-[85vh]">
                            <div className="bg-blue-600 p-8 text-white relative">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsDetailsOpen(false)}
                                    className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full"
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                                <div className="flex items-center gap-3 mb-2">
                                    <Badge className="bg-white/20 text-white border-white/30 uppercase text-[10px]">{selectedRequest.priority}</Badge>
                                    <Badge className="bg-white text-blue-600 border-none uppercase text-[10px]">{selectedRequest.status}</Badge>
                                </div>
                                <h1 className="text-3xl font-bold mb-2">{selectedRequest.title}</h1>
                                <div className="flex items-center gap-4 text-blue-100 text-sm">
                                    <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {selectedRequest.rental?.property?.title}</span>
                                    <span className="flex items-center gap-1"><User className="h-4 w-4" /> {selectedRequest.rental?.tenant?.name}</span>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-8">
                                <section>
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Issue Description</h3>
                                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl italic">
                                        "{selectedRequest.description}"
                                    </p>
                                </section>

                                {selectedRequest.images?.length > 0 && (
                                    <section>
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                                            Evidence & Media <Badge variant="secondary" className="rounded-full h-5">{selectedRequest.images.length}</Badge>
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {selectedRequest.images.map((img: any) => (
                                                <div key={img.id} className="aspect-square rounded-2xl overflow-hidden border shadow-sm group relative">
                                                    <img
                                                        src={img.image_url}
                                                        alt="Maintenance evidence"
                                                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                <div className="grid md:grid-cols-2 gap-8">
                                    <section>
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Professional Assignment</h3>
                                        {selectedRequest.assignments?.[0] ? (
                                            <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/20">
                                                <div className="flex gap-4">
                                                    <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                                                        <Briefcase className="h-6 w-6 text-white" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-lg">{selectedRequest.assignments[0].provider?.user?.name}</div>
                                                        <div className="text-sm text-blue-700 dark:text-blue-400 font-medium">{selectedRequest.assignments[0].provider?.category}</div>
                                                        <Button variant="link" className="p-0 h-auto text-xs mt-2 text-blue-600">View Provider History</Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center gap-2 bg-gray-50 dark:bg-gray-950">
                                                <UserPlus className="h-8 w-8 text-gray-300" />
                                                <p className="text-xs text-muted-foreground font-medium">No professional has been assigned to this ticket yet.</p>
                                                <Button size="sm" className="mt-2 bg-blue-600 h-8 rounded-lg px-4">Find Provider</Button>
                                            </div>
                                        )}
                                    </section>

                                    <section>
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Engagement Logs</h3>
                                        <div className="space-y-3">
                                            <div className="flex gap-3 text-xs">
                                                <div className="h-2 w-2 rounded-full bg-green-500 mt-1.5 ring-4 ring-green-100" />
                                                <div>
                                                    <div className="font-bold">Ticket Issued</div>
                                                    <div className="text-muted-foreground">{new Date(selectedRequest.created_at).toLocaleString()}</div>
                                                </div>
                                            </div>
                                            <div className="h-8 w-0.5 bg-gray-100 ml-1" />
                                            <div className="flex gap-3 text-xs">
                                                <div className="h-2 w-2 rounded-full bg-orange-500 mt-1.5 ring-4 ring-orange-100" />
                                                <div className="opacity-50 italic">Waiting for landlord response...</div>
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            </div>

                            <div className="p-6 bg-gray-50 dark:bg-gray-900 border-t flex items-center justify-between">
                                <div className="flex gap-2">
                                    <Button variant="outline" className="rounded-xl px-6 gap-2">
                                        <MessageSquare className="h-4 w-4" /> Message Parties
                                    </Button>
                                    <Button variant="outline" className="rounded-xl px-6 border-red-200 text-red-600 hover:bg-red-50">
                                        <AlertTriangle className="h-4 w-4 mr-2" /> Dispute
                                    </Button>
                                </div>
                                <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl px-8 shadow-lg shadow-blue-500/20">
                                    Final Resolution
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

function StatCard({ title, value, icon: Icon, color }: any) {
    const colors = {
        blue: "text-blue-600 bg-blue-50",
        green: "text-green-600 bg-green-50",
        yellow: "text-yellow-600 bg-yellow-50",
        red: "text-red-600 bg-red-50"
    } as any

    return (
        <Card className="border-none shadow-sm bg-white dark:bg-gray-950 overflow-hidden group hover:shadow-md transition-all">
            <CardContent className="p-6 relative">
                <div className={cn("absolute -right-4 -bottom-4 opacity-5 group-hover:scale-125 transition-transform", colors[color])}>
                    <Icon className="h-24 w-24" />
                </div>
                <div className="flex items-center justify-between mb-4">
                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", colors[color])}>
                        <Icon className="h-5 w-5" />
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                </div>
                <div className="text-3xl font-bold tracking-tight mb-1">{value}</div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{title}</div>
            </CardContent>
        </Card>
    )
}

function StatusBadge({ status }: { status: string }) {
    const variants = {
        pending: "bg-yellow-50 text-yellow-700 border-yellow-100",
        in_progress: "bg-blue-50 text-blue-700 border-blue-100",
        completed: "bg-green-50 text-green-700 border-green-100",
        cancelled: "bg-red-50 text-red-700 border-red-100"
    } as any

    return (
        <Badge variant="outline" className={cn("capitalize px-2 py-0 h-5 text-[9px] border-none font-bold", variants[status] || "bg-gray-50")}>
            {status.replace('_', ' ')}
        </Badge>
    )
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ')
}
