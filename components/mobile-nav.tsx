"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DashboardNav } from "@/components/dashboard-nav"
import { MainNav } from "@/components/main-nav"

interface MobileNavProps extends React.HTMLAttributes<HTMLDivElement> {
    userRole?: string | null
    isVerified?: boolean
    profile?: any
}

export function MobileNav({ className, userRole, isVerified, profile }: MobileNavProps) {
    const [open, setOpen] = React.useState(false)
    const pathname = usePathname()
    const isDashboard = pathname.startsWith('/dashboard') ||
        pathname.startsWith('/properties') ||
        pathname.startsWith('/tenants') ||
        pathname.startsWith('/earnings') ||
        pathname.startsWith('/wallet') ||
        pathname.startsWith('/messages') ||
        pathname.startsWith('/settings') ||
        pathname.startsWith('/my-property') ||
        pathname.startsWith('/pay-bills') ||
        pathname.startsWith('/requests')

    // Prevent body scroll when menu is open
    React.useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden"
        } else {
            document.body.style.overflow = "unset"
        }
        return () => {
            document.body.style.overflow = "unset"
        }
    }, [open])

    return (
        <div className={className}>
            <Button
                variant="ghost"
                className={cn(
                    "md:hidden px-2 min-h-[44px] min-w-[44px]",
                    isDashboard
                        ? "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                        : "text-white hover:bg-gray-800"
                )}
                onClick={() => setOpen(!open)}
            >
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
            </Button>

            {open && (
                <div className="fixed inset-0 z-50 flex md:hidden">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={() => setOpen(false)}
                    />

                    {/* Sidebar — slide in from left */}
                    <div className="fixed inset-y-0 left-0 w-[85%] max-w-[320px] border-r border-gray-800 bg-gray-950 p-5 shadow-2xl text-white overflow-y-auto animate-in slide-in-from-left duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <Link href="/" className="font-bold text-xl" onClick={() => setOpen(false)}>
                                PRMS
                            </Link>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-gray-400 hover:text-white hover:bg-gray-800 min-h-[44px] min-w-[44px]"
                                onClick={() => setOpen(false)}
                            >
                                <X className="h-5 w-5" />
                                <span className="sr-only">Close Menu</span>
                            </Button>
                        </div>

                        <div className="flex flex-col space-y-6">
                            {/* Dashboard Links (if logged in) */}
                            {profile && (
                                <div className="flex flex-col space-y-3">
                                    <h4 className="font-medium text-gray-400 text-xs uppercase tracking-wider">Dashboard</h4>
                                    <DashboardNav
                                        userRole={userRole}
                                        isVerified={isVerified}
                                        onClick={() => setOpen(false)}
                                        className="flex-col space-x-0 space-y-1"
                                    />
                                </div>
                            )}

                            {/* Main Navigation */}
                            <div className="flex flex-col space-y-3">
                                <h4 className="font-medium text-gray-400 text-xs uppercase tracking-wider">Menu</h4>
                                <div className="flex flex-col space-y-1">
                                    <Link href="/" onClick={() => setOpen(false)} className="text-sm font-medium hover:text-blue-400 py-3 min-h-[44px] flex items-center">Home</Link>
                                    <Link href="/listings" onClick={() => setOpen(false)} className="text-sm font-medium hover:text-blue-400 py-3 min-h-[44px] flex items-center">Listings</Link>
                                    <Link href="/about" onClick={() => setOpen(false)} className="text-sm font-medium hover:text-blue-400 py-3 min-h-[44px] flex items-center">About</Link>
                                    <Link href="/features" onClick={() => setOpen(false)} className="text-sm font-medium hover:text-blue-400 py-3 min-h-[44px] flex items-center">Features</Link>
                                    <Link href="/contact" onClick={() => setOpen(false)} className="text-sm font-medium hover:text-blue-400 py-3 min-h-[44px] flex items-center">Contact</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
