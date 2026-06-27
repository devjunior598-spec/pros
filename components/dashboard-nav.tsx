"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { useEffect, useState, useRef } from "react"
import {
    LayoutDashboard,
    Building,
    MessageSquare,
    Settings,
    CreditCard,
    Users,
    Wallet,
    Wrench,
    History,
    Bell,
    LogOut,
    BarChart,
    ArrowUpRight,
    DollarSign,
    Briefcase,
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
    const router = useRouter()
    const pathname = usePathname()
    const [unreadCount, setUnreadCount] = useState(0)
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push("/login")
    }

    // ── Unread messages badge ───────────────────────────────────────────────────
    useEffect(() => {
        let userId: string | null = null
        // Track when this session started to count "new" messages since then
        const sessionStart = new Date().toISOString()

        const fetchUnreadCount = async (uid: string) => {
            // Get all conversations this user is part of
            const { data: convs } = await supabase
                .from('conversations')
                .select('id')
                .or(`tenant_id.eq.${uid},landlord_id.eq.${uid}`)

            if (!convs || convs.length === 0) {
                setUnreadCount(0)
                return
            }

            const convIds = convs.map(c => c.id)

            // Count messages in those conversations not sent by this user, arrived after session start
            const { count } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .in('conversation_id', convIds)
                .neq('sender_id', uid)
                .gte('created_at', sessionStart)

            setUnreadCount(count ?? 0)
        }

        const init = async () => {
            try {
                const { data } = await supabase.auth.getUser()
                userId = data.user?.id ?? null
            } catch {
                return
            }
            if (!userId) return

            // 1. Initial fetch (will be 0 at session start)
            await fetchUnreadCount(userId)

            // 2. Realtime subscription for new messages
            channelRef.current = supabase
                .channel(`nav-messages-${userId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'messages',
                    },
                    async (payload) => {
                        // Only count if not sent by this user
                        if (payload.new.sender_id !== userId) {
                            setUnreadCount(prev => prev + 1)
                        }
                    }
                )
                .subscribe()
        }

        init()

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current)
                channelRef.current = null
            }
        }
    }, [])

    // ── Reset badge when visiting messages page ─────────────────────────────────
    useEffect(() => {
        if (pathname === '/messages' && unreadCount > 0) {
            // Optimistically clear — actual mark-as-read happens in the messages page
            setUnreadCount(0)
        }
    }, [pathname, unreadCount])

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
            href: "/dashboard/payments",
            icon: CreditCard,
            roles: ["landlord"],
        },
        {
            title: "Rent Payments",
            href: "/dashboard/rent-payments",
            icon: CreditCard,
            roles: ["tenant"],
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
            title: "My Wallet",
            href: "/wallet",
            icon: Wallet,
            roles: ["tenant"],
        },
        {
            title: "Pay Bills",
            href: "/pay-bills",
            icon: CreditCard,
            roles: ["tenant"],
        },
        {
            title: "Maintenance",
            href: "/requests",
            icon: Wrench,
            roles: ["tenant"],
        },
        {
            title: "History",
            href: "/history",
            icon: History,
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
            title: "Tenants",
            href: "/tenants",
            icon: Users,
            roles: ["landlord"],
        },
        {
            title: "Earnings",
            href: "/earnings",
            icon: DollarSign,
            roles: ["landlord", "service_provider"],
        },
        {
            title: "Withdrawals",
            href: "/withdrawals",
            icon: ArrowUpRight,
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
                const showBadge = (item as any).badge && unreadCount > 0

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
