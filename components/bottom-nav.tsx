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
        { title: "Add", href: "/properties/new", icon: PlusCircle },
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

    let items = landlordItems // default
    if (userRole === 'tenant') items = tenantItems
    if (userRole === 'service_provider') items = providerItems

    return (
        <div className="fixed bottom-0 left-0 z-50 w-full bg-white border-t border-gray-200 dark:bg-gray-950 dark:border-gray-800 md:hidden pb-safe">
            <div className="grid h-16 max-w-lg grid-cols-5 mx-auto font-medium">
                {items.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="inline-flex flex-col items-center justify-center min-h-[48px] hover:bg-gray-50 dark:hover:bg-gray-800 group active:scale-95 transition-transform"
                        >
                            <item.icon className={cn(
                                "w-5 h-5 mb-0.5 transition-colors",
                                isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                            )} />
                            <span className={cn(
                                "text-[10px] transition-colors",
                                isActive ? "text-blue-600 dark:text-blue-400 font-semibold" : "text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                            )}>
                                {item.title}
                            </span>
                            {isActive && (
                                <div className="w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400 mt-0.5" />
                            )}
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
