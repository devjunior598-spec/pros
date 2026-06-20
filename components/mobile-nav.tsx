"use client"

import * as React from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area" // Assuming this exists or I will check
import { DashboardNav } from "@/components/dashboard-nav"
import { MainNav } from "@/components/main-nav"

interface MobileNavProps extends React.HTMLAttributes<HTMLDivElement> {
    userRole?: string | null
    isVerified?: boolean
    profile?: any
}

export function MobileNav({ className, userRole, isVerified, profile }: MobileNavProps) {
    const [open, setOpen] = React.useState(false)

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
                className="md:hidden px-2 text-white hover:bg-gray-800"
                onClick={() => setOpen(!open)}
            >
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
            </Button>

            {open && (
                <div className="fixed inset-0 z-50 flex md:hidden">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-all duration-100 ease-in-out"
                        onClick={() => setOpen(false)}
                    />

                    {/* Sidebar */}
                    <div className="fixed inset-y-0 left-0 w-3/4 max-w-xs border-r border-gray-800 bg-gray-950 p-6 shadow-xl transition-transform duration-300 ease-in-out text-white overflow-y-auto">
                        <div className="flex items-center justify-between mb-8">
                            <Link href="/" className="font-bold text-xl" onClick={() => setOpen(false)}>
                                PRMS
                            </Link>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-gray-400 hover:text-white hover:bg-gray-800"
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
                                <div className="flex flex-col space-y-2">
                                    <Link href="/" onClick={() => setOpen(false)} className="text-sm font-medium hover:text-blue-400">Home</Link>
                                    <Link href="/listings" onClick={() => setOpen(false)} className="text-sm font-medium hover:text-blue-400">Listings</Link>
                                    <Link href="/about" onClick={() => setOpen(false)} className="text-sm font-medium hover:text-blue-400">About</Link>
                                    <Link href="/features" onClick={() => setOpen(false)} className="text-sm font-medium hover:text-blue-400">Features</Link>
                                    <Link href="/contact" onClick={() => setOpen(false)} className="text-sm font-medium hover:text-blue-400">Contact</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
