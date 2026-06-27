"use client"

import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { SiteHeader } from "@/components/site-header"
import { DashboardGuard } from "@/components/dashboard-guard"
import { RoleGuard } from "@/components/role-guard"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Menu, X } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    return (
        <DashboardGuard>
            <RoleGuard allowedRoles={['admin']}>
                <div className="flex min-h-screen bg-background">
                    {/* Mobile Sidebar Overlay */}
                    <div
                        className={cn(
                            "fixed inset-0 z-50 bg-black/50 transition-opacity md:hidden",
                            isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                        )}
                        onClick={() => setIsSidebarOpen(false)}
                    />

                    {/* Sidebar */}
                    <aside className={cn(
                        "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static",
                        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                    )}>
                        <AdminSidebar />
                    </aside>

                    {/* Main Content */}
                    <div className="flex flex-1 flex-col min-w-0 h-screen overflow-hidden">
                        <header className="flex h-16 items-center justify-between border-b border-border bg-white px-4 md:px-8">
                            <button
                                className="p-2 -ml-2 md:hidden"
                                onClick={() => setIsSidebarOpen(true)}
                            >
                                <Menu className="h-6 w-6" />
                            </button>

                            <div className="flex-1 md:flex-none max-w-xl hidden md:block">
                                {/* Search placeholder as per requirements */}
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                                            <path d="M12.9 14.32a8 8 0 1 1 1.41-1.41l5.35 5.33-1.42 1.42-5.34-5.34ZM8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12Z" />
                                        </svg>
                                    </span>
                                    <input
                                        className="block w-full rounded-lg border-none bg-secondary py-2 pl-10 pr-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                        placeholder="Search everything..."
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <SiteHeader hideNav />
                            </div>
                        </header>

                        <ScrollArea className="flex-1 h-[calc(100vh-64px)]">
                            <main className="p-4 md:p-8">
                                {children}
                            </main>
                        </ScrollArea>
                    </div>
                </div>
            </RoleGuard>
        </DashboardGuard>
    )
}
