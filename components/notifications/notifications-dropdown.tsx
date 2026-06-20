"use client"

import { useState } from "react"
import { useNotifications, Notification } from "./notifications-provider"
import { Bell, Check, Trash2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

export function NotificationsDropdown() {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
    const [isOpen, setIsOpen] = useState(false)

    // Helper to format date relative to now (e.g., "5m ago")
    const formatTime = (dateString: string) => {
        try {
            return formatDistanceToNow(new Date(dateString), { addSuffix: true })
        } catch {
            return "Just now"
        }
    }

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-red-500 hover:bg-red-600 border-2 border-white dark:border-slate-950">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-[380px] p-0" sideOffset={8}>
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                    <DropdownMenuLabel className="p-0 font-semibold text-base">Notifications</DropdownMenuLabel>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.preventDefault()
                                markAllAsRead()
                            }}
                            className="h-auto px-2 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
                        >
                            <Check className="h-3 w-3 mr-1" />
                            Mark all read
                        </Button>
                    )}
                </div>

                <ScrollArea className="h-[350px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground p-6 text-center">
                            <Bell className="h-10 w-10 text-slate-200 dark:text-slate-800 mb-3" />
                            <p className="font-medium text-slate-900 dark:text-slate-100">All caught up!</p>
                            <p className="text-sm mt-1">You have no new notifications.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((notif: Notification) => {
                                const isUnread = !notif.read_at
                                return (
                                    <div
                                        key={notif.id}
                                        className={`px-4 py-3 border-b border-border/50 transition-colors last:border-0 hover:bg-muted/50 ${isUnread ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''}`}
                                        onClick={() => {
                                            if (isUnread) markAsRead(notif.id)
                                        }}
                                    >
                                        <div className="flex gap-3">
                                            {/* Status indicator */}
                                            <div className="mt-1.5 shrink-0">
                                                <div className={`h-2 w-2 rounded-full ${isUnread ? 'bg-blue-600' : 'bg-transparent'}`} />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 space-y-1">
                                                <p className={`text-sm leading-tight ${isUnread ? 'font-semibold text-foreground' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                                                    {notif.title}
                                                </p>
                                                <p className="text-sm text-muted-foreground line-clamp-2 leading-snug">
                                                    {notif.message}
                                                </p>

                                                <div className="flex items-center justify-between pt-1">
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        {formatTime(notif.created_at)}
                                                    </p>

                                                    {notif.link && (
                                                        <Link
                                                            href={notif.link}
                                                            onClick={(e) => {
                                                                if (isUnread) markAsRead(notif.id)
                                                                setIsOpen(false)
                                                            }}
                                                            className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                                        >
                                                            View <ExternalLink className="h-3 w-3" />
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
