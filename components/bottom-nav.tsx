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
        { title: "Chat", href: "/messages", icon: MessageSquare },
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
        <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-white border-t border-gray-200 dark:bg-gray-950 dark:border-gray-800 md:hidden">
            <div className="grid h-full max-w-lg grid-cols-5 mx-auto font-medium">
                {items.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group"
                        >
                            <item.icon className={cn(
                                "w-6 h-6 mb-1 transition-colors",
                                isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                            )} />
                            <span className={cn(
                                "text-xs transition-colors",
                                isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400"
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
