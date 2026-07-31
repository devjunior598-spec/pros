"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { useChat } from "@/components/chat/chat-provider"
import {
    LayoutDashboard,
    Building,
    MessageSquare,
    Settings,
    CreditCard,
    Users,
    Wrench,
    LogOut,
    BarChart,
    ClipboardList,
    Image,
    Star,
    Search,
    Calendar,
    FileText
} from "lucide-react"

interface DashboardNavProps extends React.HTMLAttributes<HTMLElement> {
    userRole?: string | null
    isVerified?: boolean
    onClick?: () => void
}

export function DashboardNav({ className, userRole, isVerified, ...props }: DashboardNavProps) {
    void isVerified
    const router = useRouter()
    const pathname = usePathname()
    const { unreadMessageCount: unreadCount } = useChat()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push("/login")
    }

    const items = [
        // Shared
        {
            title: "Dashboard",
            href: "/dashboard",
            icon: LayoutDashboard,
            roles: ["landlord", "tenant", "service_provider"],
        },
        {
            title: "Inspections",
            href: "/dashboard/inspections",
            icon: Calendar,
            roles: ["landlord", "tenant"],
        },
        {
            title: "Payments",
            href: "/payments",
            icon: CreditCard,
            roles: ["landlord", "tenant"],
        },
        {
            title: "Lease Agreements",
            href: "/dashboard/leases",
            icon: FileText,
            roles: ["landlord", "tenant"],
        },
        // Provider Specific
        {
            title: "Available Jobs",
            href: "/maintenance/available",
            icon: Search,
            roles: ["service_provider"],
        },
        {
            title: "Assigned Jobs",
            href: "/maintenance/assigned",
            icon: ClipboardList,
            roles: ["service_provider"],
        },
        {
            title: "My Portfolio",
            href: "/portfolio",
            icon: Image,
            roles: ["service_provider"],
        },
        {
            title: "Reviews",
            href: "/reviews",
            icon: Star,
            roles: ["service_provider"],
        },
        // Tenant Specific
        {
            title: "My Property",
            href: "/my-property",
            icon: Building,
            roles: ["tenant"],
        },
        {
            title: "Maintenance",
            href: "/requests",
            icon: Wrench,
            roles: ["tenant"],
        },
        // Landlord Specific
        {
            title: "Properties",
            href: "/properties",
            icon: Building,
            roles: ["landlord"],
        },
        {
            title: "Applications",
            href: "/applications",
            icon: ClipboardList,
            roles: ["landlord"],
        },
        {
            title: "Tenants",
            href: "/tenants",
            icon: Users,
            roles: ["landlord"],
        },
        {
            title: "Maintenance",
            href: "/requests",
            icon: Wrench,
            roles: ["landlord"],
        },
        {
            title: "Reports",
            href: "/reports",
            icon: BarChart,
            roles: ["landlord"],
        },
        // Shared
        {
            title: "Messages",
            href: "/messages",
            icon: MessageSquare,
            roles: ["landlord", "tenant", "service_provider"],
            badge: true, // flag: show unread badge
        },
        {
            title: "Settings",
            href: "/settings",
            icon: Settings,
            roles: ["landlord", "tenant", "service_provider"],
        },
    ]

    // Only show items if role is confirmed
    const filteredItems = userRole
        ? items.filter(item => {
            const hasRole = item.roles.includes(userRole)
            if (!hasRole) return false
            return true
        })
        : []

    return (
        <nav className={cn("flex flex-col space-y-1", className)} {...props}>
            {filteredItems.map((item) => {
                const isActive = pathname === item.href
                const showBadge = "badge" in item && item.badge && unreadCount > 0

                return (
                    <Link key={item.href} href={item.href} onClick={props.onClick}>
                        <span className={cn(
                            "group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors mb-0.5",
                            isActive
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        )}>
                            <span className="relative mr-3 flex-shrink-0">
                                <item.icon className={cn(
                                    "h-5 w-5",
                                    isActive ? "text-primary" : "text-muted-foreground"
                                )} />
                                {showBadge && (
                                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none shadow-sm">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </span>
                            <span>{item.title}</span>
                            {/* Inline text badge for extra clarity */}
                            {showBadge && (
                                <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </span>
                    </Link>
                )
            })}
            <button
                onClick={handleLogout}
                className="group flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 mt-4 transition-colors"
            >
                <LogOut className="mr-3 h-5 w-5" />
                <span>Logout</span>
            </button>
        </nav>
    )
}
