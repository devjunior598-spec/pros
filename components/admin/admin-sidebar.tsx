"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { Logo } from "@/components/logo"
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
    LogOut,
    CreditCard
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
        { title: "Rent Payments", href: "/admin/payments", icon: CreditCard },
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
        <div className="flex h-full flex-col border-r border-border bg-white">
            <div className="flex h-16 items-center border-b border-border px-5">
                <Logo href="/admin/dashboard" />
            </div>
            <nav className="flex-1 space-y-0.5 overflow-y-auto p-3 scrollbar-none">
                {menuItems.map((item) => {
                    const isActive = pathname.startsWith(item.href)
                    return (
                        <Link key={item.href} href={item.href}>
                            <span className={cn(
                                "group mb-0.5 flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-primary text-white"
                                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                            )}>
                                <item.icon className={cn(
                                    "mr-3 h-5 w-5 transition-colors",
                                    isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground"
                                )} />
                                <span>{item.title}</span>
                            </span>
                        </Link>
                    )
                })}
            </nav>
            <div className="border-t border-border p-3">
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                    <LogOut className="mr-3 h-5 w-5" />
                    Logout
                </button>
            </div>
        </div>
    )
}
