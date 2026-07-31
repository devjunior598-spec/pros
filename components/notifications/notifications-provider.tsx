"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export interface Notification {
    id: string
    user_id: string
    type: string
    title: string
    message: string
    link?: string
    read_at: string | null
    created_at: string
}

interface NotificationsContextType {
    notifications: Notification[]
    unreadCount: number
    markAsRead: (id: string) => Promise<void>
    markAllAsRead: () => Promise<void>
    loading: boolean
}

const NotificationsContext = createContext<NotificationsContextType>({
    notifications: [],
    unreadCount: 0,
    markAsRead: async () => { },
    markAllAsRead: async () => { },
    loading: true
})

export const useNotifications = () => useContext(NotificationsContext)

export const NotificationsProvider = ({ children }: { children: React.ReactNode }) => {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const [userId, setUserId] = useState<string | null>(null)
    const [notificationsAvailable, setNotificationsAvailable] = useState(true)

    useEffect(() => {
        // Initialize user
        supabase.auth.getUser().then(({ data }) => {
            if (data?.user) setUserId(data.user.id)
        })

        // Listen for auth state changes
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            if (session?.user) {
                setUserId(session.user.id)
            } else {
                setUserId(null)
                setNotifications([])
            }
        })

        return () => {
            authListener.subscription.unsubscribe()
        }
    }, [])

    useEffect(() => {
        if (!userId) return

        let isMounted = true
        let channel: ReturnType<typeof supabase.channel> | null = null

        const initializeNotifications = async () => {
            setLoading(true)
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(50) // Keep recent 50 in state

            if (error) {
                if (isMounted) {
                    setNotifications([])
                    setNotificationsAvailable(false)
                    setLoading(false)
                }
                return
            }
            if (!isMounted) return

            setNotifications(data || [])
            setNotificationsAvailable(true)
            setLoading(false)

            // Subscribe only after confirming the notifications table is available.
            channel = supabase.channel(`notifications:user_id=eq.${userId}`)

            channel.on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${userId}`
            },
            (payload) => {
                const newNotification = payload.new as Notification
                setNotifications((prev) => {
                    // Avoid duplicates if multiple triggers fire
                    if (prev.some(n => n.id === newNotification.id)) return prev
                    return [newNotification, ...prev]
                })
            }
        )

            channel.on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${userId}`
            },
            (payload) => {
                const updated = payload.new as Notification
                setNotifications((prev) =>
                    prev.map(n => n.id === updated.id ? updated : n)
                )
            }
        )

            channel.subscribe()
        }

        initializeNotifications()

        return () => {
            isMounted = false
            if (channel) supabase.removeChannel(channel)
        }
    }, [userId])

    const markAsRead = async (id: string) => {
        if (!notificationsAvailable) return
        // Optimistic UI update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n))

        await supabase
            .from('notifications')
            .update({ read_at: new Date().toISOString() })
            .eq('id', id)
            .eq('user_id', userId) // Security safety net
    }

    const markAllAsRead = async () => {
        if (!notificationsAvailable) return
        const now = new Date().toISOString()
        setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at ? n.read_at : now })))

        await supabase
            .from('notifications')
            .update({ read_at: now })
            .eq('user_id', userId)
            .is('read_at', null)
    }

    const unreadCount = notifications.filter(n => !n.read_at).length

    return (
        <NotificationsContext.Provider value={{
            notifications,
            unreadCount,
            markAsRead,
            markAllAsRead,
            loading
        }}>
            {children}
        </NotificationsContext.Provider>
    )
}
