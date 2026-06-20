"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import {
    LayoutDashboard,
    Users,
    ShieldCheck,
    Building,
    Wallet,
    ArrowUpRight,
    Wrench,
    Briefcase,
    BarChart,
    MessageSquare,
    Settings,
    ShieldAlert,
    Bell,
    LogOut,
    Activity
} from "lucide-react"

export function AdminSidebar() {
    const pathname = usePathname()
    const router = useRouter()

    const menuItems = [
        { title: "Dashboard Overview", href: "/admin/dashboard", icon: LayoutDashboard },
        { title: "Users", href: "/admin/users", icon: Users },
        { title: "KYC & Verification", href: "/admin/kyc", icon: ShieldCheck },
        { title: "Properties", href: "/admin/properties", icon: Building },
        { title: "Wallet & Transactions", href: "/admin/finances", icon: Wallet },
        { title: "Withdrawals", href: "/admin/withdrawals", icon: ArrowUpRight },
        { title: "Maintenance", href: "/admin/maintenance", icon: Wrench },
        { title: "Service Providers", href: "/admin/providers", icon: Briefcase },
        { title: "Reports & Analytics", href: "/admin/reports", icon: BarChart },
        { title: "Disputes & Complaints", href: "/admin/disputes", icon: MessageSquare },
        { title: "System Settings", href: "/admin/settings", icon: Settings },
        { title: "Logs & Security", href: "/admin/logs", icon: ShieldAlert },
    ]

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push("/login")
    }

    return (
        <div className="flex h-full flex-col bg-white dark:bg-gray-950 border-r">
            <div className="flex h-16 items-center border-b px-6">
                <Link href="/admin/dashboard" className="flex items-center gap-2">
                    <Activity className="h-6 w-6 text-blue-600" />
                    <span className="font-bold text-xl uppercase tracking-tighter">PRMS ADMIN</span>
                </Link>
            </div>
            <nav className="flex-1 space-y-1 p-4 overflow-y-auto scrollbar-none">
                {menuItems.map((item) => {
                    const isActive = pathname.startsWith(item.href)
                    return (
                        <Link key={item.href} href={item.href}>
                            <span className={cn(
                                "group flex items-center rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 mb-1",
                                isActive
                                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-gray-100"
                            )}>
                                <item.icon className={cn(
                                    "mr-3 h-5 w-5 transition-colors",
                                    isActive ? "text-white" : "text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100"
                                )} />
                                <span>{item.title}</span>
                            </span>
                        </Link>
                    )
                })}
            </nav>
            <div className="p-4 border-t">
                <button
                    onClick={handleLogout}
                    className="group flex w-full items-center rounded-xl px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                >
                    <LogOut className="mr-3 h-5 w-5 text-red-400 group-hover:text-red-600" />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    )
}
