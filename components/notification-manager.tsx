"use client"

import * as React from "react"
import { useEffect, useState, useCallback, useRef, createContext, useContext } from "react"
import { supabase } from "@/lib/supabase"
import { ToastNotification, NotificationToast } from "./notification-toast"
import {
    Bell, DollarSign, Wrench, MessageSquare, X, CheckCheck,
    CalendarDays, Info
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface PersistentNotification {
    id: string
    title: string
    description: string
    type: 'payment' | 'maintenance' | 'message' | 'system'
    createdAt: Date
    read: boolean
    link?: string
}

type CategoryTab = 'All' | 'Payments' | 'Maintenance' | 'Messages' | 'System'

// ─── Shared context ────────────────────────────────────────────────────────────
interface NotifCtx {
    panelNotifs: PersistentNotification[]
    toasts: ToastNotification[]
    panelOpen: boolean
    unreadCount: number
    setPanelOpen: (v: boolean) => void
    markAllRead: () => void
    markRead: (id: string) => void
    addPanelNotif: (title: string, description: string, type: PersistentNotification['type']) => void
    addToast: (notif: Omit<ToastNotification, 'id'>) => void
    removeToast: (id: string) => void
}

const NotifContext = createContext<NotifCtx | null>(null)

function useNotifCtx() {
    const ctx = useContext(NotifContext)
    if (!ctx) throw new Error("useNotifCtx must be used inside NotificationManager")
    return ctx
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function getDateGroup(date: Date): string {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    if (d.getTime() === today.getTime()) return "Today"
    if (d.getTime() === yesterday.getTime()) return "Yesterday"
    return "Earlier"
}

function NotifIcon({ type, className }: { type: PersistentNotification['type'], className?: string }) {
    const base = cn("h-4 w-4", className)
    switch (type) {
        case 'payment':     return <DollarSign className={cn(base, "text-green-400")} />
        case 'maintenance': return <Wrench className={cn(base, "text-orange-400")} />
        case 'message':     return <MessageSquare className={cn(base, "text-blue-400")} />
        default:            return <Info className={cn(base, "text-slate-400")} />
    }
}

async function requestBrowserPermission(): Promise<boolean> {
    if (!("Notification" in window)) return false
    if (Notification.permission === "granted") return true
    if (Notification.permission === "denied") return false
    const result = await Notification.requestPermission()
    return result === "granted"
}

function sendBrowserNotification(title: string, body: string) {
    if (!("Notification" in window) || Notification.permission !== "granted") return
    try { new Notification(title, { body, icon: "/favicon.ico" }) } catch { /* ignore */ }
}

// ─── Notification Centre Panel ─────────────────────────────────────────────────
function NotificationCentre({
    notifications,
    onMarkAllRead,
    onMarkRead,
    onClose,
}: {
    notifications: PersistentNotification[]
    onMarkAllRead: () => void
    onMarkRead: (id: string) => void
    onClose: () => void
}) {
    const [activeTab, setActiveTab] = useState<CategoryTab>('All')
    const tabs: CategoryTab[] = ['All', 'Payments', 'Maintenance', 'Messages', 'System']

    const typeMap: Record<CategoryTab, PersistentNotification['type'] | null> = {
        All: null,
        Payments: 'payment',
        Maintenance: 'maintenance',
        Messages: 'message',
        System: 'system',
    }

    const filtered = activeTab === 'All'
        ? notifications
        : notifications.filter(n => n.type === typeMap[activeTab])

    const groups: Record<string, PersistentNotification[]> = {}
    const ORDER = ['Today', 'Yesterday', 'Earlier']
    for (const n of filtered) {
        const g = getDateGroup(n.createdAt)
        if (!groups[g]) groups[g] = []
        groups[g].push(n)
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/60">
                <h2 className="text-sm font-bold text-slate-100 tracking-wide">Notifications</h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onMarkAllRead}
                        className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium"
                    >
                        <CheckCheck className="h-3.5 w-3.5" />
                        Mark all read
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-700/50 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-3 py-2 border-b border-slate-700/60 overflow-x-auto scrollbar-none">
                {tabs.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            "whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium transition-colors",
                            activeTab === tab
                                ? "bg-blue-600 text-white"
                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                        )}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-12 gap-3 text-slate-500">
                        <Bell className="h-8 w-8 opacity-30" />
                        <p className="text-sm">No notifications here</p>
                    </div>
                ) : (
                    ORDER.filter(g => groups[g]?.length).map(group => (
                        <div key={group}>
                            <div className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500 bg-slate-900/40 sticky top-0">
                                {group}
                            </div>
                            {groups[group].map(notif => (
                                <button
                                    key={notif.id}
                                    onClick={() => onMarkRead(notif.id)}
                                    className={cn(
                                        "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors border-b border-slate-800/40",
                                        notif.read
                                            ? "hover:bg-slate-800/30"
                                            : "bg-blue-500/5 hover:bg-blue-500/10"
                                    )}
                                >
                                    <div className={cn(
                                        "mt-0.5 flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center",
                                        notif.type === 'payment'     ? "bg-green-500/10"  :
                                        notif.type === 'maintenance' ? "bg-orange-500/10" :
                                        notif.type === 'message'     ? "bg-blue-500/10"   :
                                                                       "bg-slate-500/10"
                                    )}>
                                        <NotifIcon type={notif.type} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            {!notif.read && (
                                                <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500" />
                                            )}
                                            <p className={cn(
                                                "text-sm font-semibold truncate",
                                                notif.read ? "text-slate-300" : "text-slate-100"
                                            )}>
                                                {notif.title}
                                            </p>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                                            {notif.description}
                                        </p>
                                        <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                                            <CalendarDays className="h-3 w-3" />
                                            {formatDistanceToNow(notif.createdAt, { addSuffix: true })}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

// ─── Inline Bell (rendered inside SiteHeader) ──────────────────────────────────
export function NotificationBell() {
    const { panelNotifs, panelOpen, unreadCount, setPanelOpen, markAllRead, markRead } = useNotifCtx()
    const panelRef = useRef<HTMLDivElement>(null)

    // Close on outside click
    useEffect(() => {
        if (!panelOpen) return
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setPanelOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [panelOpen, setPanelOpen])

    return (
        <div ref={panelRef} className="relative flex items-center">
            {/* Bell button — inherits h-16 row via flex, so it is always vertically centered */}
            <button
                onClick={() => setPanelOpen(!panelOpen)}
                className={cn(
                    "relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200",
                    panelOpen
                        ? "bg-blue-600/20 text-blue-400 ring-1 ring-blue-500/30"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
                aria-label="Open notifications"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none shadow">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown panel — clamped so it never overflows on any screen size */}
            <div className={cn(
                "absolute right-0 top-11",
                // width: 360 px on desktop, full viewport minus 2 × 1rem gutter on mobile
                "w-[min(360px,calc(100vw-2rem))]",
                // height: 520 px on desktop, dynamic viewport height minus header + bottom-nav on mobile
                "max-h-[min(520px,calc(100dvh-5rem))]",
                "flex flex-col",
                "bg-slate-900/95 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl",
                "transition-all duration-200 origin-top-right z-50",
                panelOpen
                    ? "opacity-100 scale-100 pointer-events-auto"
                    : "opacity-0 scale-95 pointer-events-none"
            )}>
                <NotificationCentre
                    notifications={panelNotifs}
                    onMarkAllRead={markAllRead}
                    onMarkRead={markRead}
                    onClose={() => setPanelOpen(false)}
                />
            </div>
        </div>
    )
}

// ─── NotificationManager — Provider + Toasts + Realtime subscriptions ──────────
export function NotificationManager({ children }: { children?: React.ReactNode }) {
    const [toasts, setToasts]           = useState<ToastNotification[]>([])
    const [panelNotifs, setPanelNotifs] = useState<PersistentNotification[]>([])
    const [panelOpen, setPanelOpen]     = useState(false)
    const [userId, setUserId]           = useState<string | null>(null)
    const isTabFocused                  = useRef(true)

    // Track tab focus for browser push notifications
    useEffect(() => {
        const onFocus = () => { isTabFocused.current = true }
        const onBlur  = () => { isTabFocused.current = false }
        window.addEventListener('focus', onFocus)
        window.addEventListener('blur',  onBlur)
        requestBrowserPermission()
        return () => {
            window.removeEventListener('focus', onFocus)
            window.removeEventListener('blur',  onBlur)
        }
    }, [])

    const addToast = useCallback((notif: Omit<ToastNotification, 'id'>) => {
        const id = Math.random().toString(36).substring(7)
        setToasts(prev => [...prev, { ...notif, id }])
    }, [])

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(n => n.id !== id))
    }, [])

    const addPanelNotif = useCallback((
        title: string,
        description: string,
        type: PersistentNotification['type']
    ) => {
        const notif: PersistentNotification = {
            id: Math.random().toString(36).substring(7),
            title,
            description,
            type,
            createdAt: new Date(),
            read: false,
        }
        setPanelNotifs(prev => [notif, ...prev])
        addToast({ title, description, type: type === 'payment' ? 'system' : type as ToastNotification['type'] })
        if (!isTabFocused.current) sendBrowserNotification(title, description)
    }, [addToast])

    const markAllRead = useCallback(() => {
        setPanelNotifs(prev => prev.map(n => ({ ...n, read: true })))
    }, [])

    const markRead = useCallback((id: string) => {
        setPanelNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    }, [])

    const unreadCount = panelNotifs.filter(n => !n.read).length

    // ── Supabase Realtime Subscriptions ──────────────────────────────────────
    useEffect(() => {
        const initSubscriptions = async () => {
            let user
            try {
                const { data } = await supabase.auth.getUser()
                user = data.user
            } catch (error) {
                console.error("Error getting user for notifications:", error)
                return
            }

            if (!user) return
            setUserId(user.id)

            // 1. Messages
            const messageSub = supabase
                .channel('realtime_messages')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' },
                    async (payload) => {
                        if (payload.new.sender_id === user.id) return
                        const { data: conv } = await supabase
                            .from('conversations')
                            .select('id, tenant_id, landlord_id')
                            .eq('id', payload.new.conversation_id)
                            .single()
                        if (conv && (conv.tenant_id === user.id || conv.landlord_id === user.id)) {
                            addPanelNotif("New Message", payload.new.message, 'message')
                        }
                    }
                )
                .subscribe()

            // 2. Maintenance Requests
            const maintenanceSub = supabase
                .channel('realtime_maintenance')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance_requests' },
                    async (payload) => {
                        if (payload.eventType === 'INSERT') {
                            const { data: rental } = await supabase
                                .from('rentals')
                                .select('landlord_id, property:properties(title)')
                                .eq('id', payload.new.rental_id)
                                .single()
                            if (rental && (rental as any).landlord_id === user.id) {
                                addPanelNotif(
                                    "New Maintenance Request",
                                    `New issue reported for ${(rental as any).property?.title || 'your property'}: ${payload.new.title}`,
                                    'maintenance'
                                )
                            }
                        } else if (payload.eventType === 'UPDATE') {
                            if (payload.old.status !== payload.new.status) {
                                const { data: req } = await supabase
                                    .from('maintenance_requests')
                                    .select('title, tenant_id, rental:rentals(landlord_id)')
                                    .eq('id', payload.new.id)
                                    .single()
                                const landlordId = (req as any)?.rental?.landlord_id
                                if (req && (req.tenant_id === user.id || landlordId === user.id)) {
                                    addPanelNotif(
                                        "Maintenance Update",
                                        `"${req.title}" is now ${payload.new.status.replace('_', ' ')}`,
                                        'maintenance'
                                    )
                                }
                            }
                        }
                    }
                )
                .subscribe()

            // 3. Rental Applications
            const rentalSub = supabase
                .channel('realtime_rentals')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'rentals' },
                    async (payload) => {
                        if (payload.eventType === 'INSERT') {
                            if (payload.new.landlord_id === user.id) {
                                const { data: prop } = await supabase
                                    .from('properties')
                                    .select('title')
                                    .eq('id', payload.new.property_id)
                                    .single()
                                addPanelNotif(
                                    "New Application",
                                    `A new application has been submitted for ${(prop as any)?.title || 'your property'}.`,
                                    'system'
                                )
                            }
                        } else if (payload.eventType === 'UPDATE') {
                            if (payload.old.status !== payload.new.status && payload.new.tenant_id === user.id) {
                                const { data: prop } = await supabase
                                    .from('properties')
                                    .select('title')
                                    .eq('id', payload.new.property_id)
                                    .single()
                                addPanelNotif(
                                    "Application Updated",
                                    `Your application for ${(prop as any)?.title || 'the property'} has been ${payload.new.status}.`,
                                    'system'
                                )
                            }
                        }
                    }
                )
                .subscribe()

            // 4. Payments
            const paymentSub = supabase
                .channel('realtime_payments')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'payments' },
                    async (payload) => {
                        if (payload.new.status === 'success') {
                            addPanelNotif(
                                "Payment Confirmed",
                                `Your payment of ₦${Number(payload.new.amount).toLocaleString()} was successful.`,
                                'payment'
                            )
                        }
                    }
                )
                .subscribe()

            return () => {
                supabase.removeChannel(messageSub)
                supabase.removeChannel(maintenanceSub)
                supabase.removeChannel(rentalSub)
                supabase.removeChannel(paymentSub)
            }
        }

        initSubscriptions()
    }, [addPanelNotif])

    const ctx: NotifCtx = {
        panelNotifs, toasts, panelOpen, unreadCount,
        setPanelOpen, markAllRead, markRead,
        addPanelNotif, addToast, removeToast,
    }

    return (
        <NotifContext.Provider value={ctx}>
            {children}

            {/* Toast stack — bottom of screen, raised above mobile bottom-nav */}
            <div className="fixed bottom-20 right-4 z-50 flex flex-col gap-2 md:bottom-4">
                {toasts.map(notif => (
                    <NotificationToast
                        key={notif.id}
                        notification={notif}
                        onClose={removeToast}
                    />
                ))}
            </div>
        </NotifContext.Provider>
    )
}
