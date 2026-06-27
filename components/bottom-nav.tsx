"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    Wallet,
    MessageSquare,
    Settings,
    Building,
    PlusCircle,
    Search,
    ClipboardList
} from "lucide-react"

interface BottomNavProps {
    userRole?: string | null
}

export function BottomNav({ userRole }: BottomNavProps) {
    const pathname = usePathname()

    const tenantItems = [
        { title: "Home", href: "/dashboard", icon: LayoutDashboard },
        { title: "Wallet", href: "/wallet", icon: Wallet },
        { title: "Pay", href: "/pay-bills", icon: PlusCircle },
        { title: "Chat", href: "/messages", icon: MessageSquare },
        { title: "Settings", href: "/settings", icon: Settings },
    ]

    const landlordItems = [
        { title: "Home", href: "/dashboard", icon: LayoutDashboard },
        { title: "Properties", href: "/properties", icon: Building },
        { title: "Add", href: "/dashboard/landlord/properties/new", icon: PlusCircle },
        { title: "Messages", href: "/messages", icon: MessageSquare },
        { title: "Settings", href: "/settings", icon: Settings },
    ]

    const providerItems = [
        { title: "Home", href: "/dashboard", icon: LayoutDashboard },
        { title: "Find Jobs", href: "/maintenance/available", icon: Search },
        { title: "My Jobs", href: "/maintenance/assigned", icon: ClipboardList },
        { title: "Chat", href: "/messages", icon: MessageSquare },
        { title: "Settings", href: "/settings", icon: Settings },
    ]

    let items = landlordItems
    if (userRole === 'tenant') items = tenantItems
    if (userRole === 'service_provider') items = providerItems

    return (
        <div className="fixed bottom-0 left-0 z-50 w-full border-t border-border bg-white md:hidden pb-safe shadow-[0_-2px_12px_rgba(15,23,42,0.06)]">
            <div className="mx-auto grid h-16 max-w-lg grid-cols-5 font-medium">
                {items.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="inline-flex min-h-[48px] flex-col items-center justify-center transition-colors active:scale-95"
                        >
                            <item.icon className={cn(
                                "mb-0.5 h-5 w-5 transition-colors",
                                isActive ? "text-primary" : "text-muted-foreground"
                            )} />
                            <span className={cn(
                                "text-[10px] transition-colors",
                                isActive ? "font-semibold text-primary" : "text-muted-foreground"
                            )}>
                                {item.title}
                            </span>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
