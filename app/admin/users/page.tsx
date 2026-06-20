"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Search,
    MoreVertical,
    User,
    Mail,
    Shield,
    Ban,
    RotateCcw,
    Trash2,
    Loader2,
    ChevronRight,
    Filter
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [activeTab, setActiveTab] = useState("all")

    const fetchUsers = async (role?: string) => {
        setLoading(true)
        try {
            let query = supabase.from('profiles').select('*')

            if (role && role !== 'all') {
                query = query.eq('role', role)
            }

            const { data } = await query.order('created_at', { ascending: false })
            setUsers(data || [])
        } catch (error) {
            console.error("Error fetching users:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers(activeTab)
    }, [activeTab])

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleSuspend = async (userId: string, currentStatus: string) => {
        const isSuspending = currentStatus !== 'suspended'
        if (!confirm(`Are you sure you want to ${isSuspending ? 'suspend' : 'activate'} this user?`)) return

        try {
            const res = await fetch(`/api/admin/users/${userId}/suspend`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ suspend: isSuspending, status: isSuspending ? 'suspended' : 'active' })
            })

            if (!res.ok) throw new Error("Failed to update user status")

            alert(`User successfully ${isSuspending ? 'suspended' : 'activated'}.`)
            fetchUsers(activeTab)
        } catch (error: any) {
            alert(error.message)
        }
    }

    const handleDelete = async (userId: string) => {
        if (!confirm("Are you sure you want to PERMANENTLY delete this user? This action cannot be undone.")) return
        alert("Account deletion is restricted for data integrity. Please contact system admin.")
    }

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                    <p className="text-muted-foreground">Monitor and moderate all users on the platform.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2">
                        <Filter className="h-4 w-4" /> Filter
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700">Add New Admin</Button>
                </div>
            </div>

            <Card className="border-none shadow-sm bg-white dark:bg-gray-950">
                <CardHeader className="pb-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <Tabs defaultValue="all" className="w-full md:w-auto" onValueChange={setActiveTab}>
                            <TabsList className="bg-gray-100 dark:bg-gray-900 border-none p-1">
                                <TabsTrigger value="all" className="rounded-lg">All Users</TabsTrigger>
                                <TabsTrigger value="tenant" className="rounded-lg">Tenants</TabsTrigger>
                                <TabsTrigger value="landlord" className="rounded-lg">Landlords</TabsTrigger>
                                <TabsTrigger value="service_provider" className="rounded-lg">Providers</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search by name or email..."
                                className="pl-10 rounded-xl bg-gray-50 border-none focus:ring-2 ring-blue-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="relative overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50/50 dark:bg-gray-900/50 dark:text-gray-400">
                                <tr>
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Joined</th>
                                    <th className="px-6 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center">
                                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                                        </td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-10 text-center italic">
                                            No users found matching your search.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <tr key={user.id} className="bg-white border-b dark:bg-gray-950 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center overflow-hidden">
                                                        {user.profile_image_url ? (
                                                            <img src={user.profile_image_url} alt="" className="h-full w-full object-cover" />
                                                        ) : (
                                                            <User className="h-5 w-5 text-blue-600" />
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-900 dark:text-gray-100">{user.name}</span>
                                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                                            <Mail className="h-3 w-3" /> {user.email}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="outline" className="capitalize">
                                                    {user.role}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn(
                                                            "h-2 w-2 rounded-full",
                                                            user.is_verified ? "bg-green-500" : "bg-yellow-500 shadow-sm"
                                                        )} />
                                                        <span className="text-xs">
                                                            {user.is_verified ? "Verified" : "Pending KYC"}
                                                        </span>
                                                    </div>
                                                    {user.status === 'suspended' && (
                                                        <Badge variant="destructive" className="text-[10px] w-fit">Suspended</Badge>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48 rounded-xl border-none shadow-xl">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem className="gap-2 cursor-pointer">
                                                            <Shield className="h-4 w-4" /> View Profile
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="gap-2 cursor-pointer">
                                                            <RotateCcw className="h-4 w-4" /> Reset Password
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="gap-2 cursor-pointer text-orange-600 focus:text-orange-600"
                                                            onClick={() => handleSuspend(user.id, user.status)}
                                                        >
                                                            <Ban className="h-4 w-4" /> {user.status === 'suspended' ? 'Activate Account' : 'Suspend Account'}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDelete(user.id)} className="gap-2 cursor-pointer text-red-700 focus:text-red-700 font-medium">
                                                            <Trash2 className="h-4 w-4" /> Delete Account
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
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
