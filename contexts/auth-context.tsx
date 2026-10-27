"use client"

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import { supabase } from "@/lib/supabase"
import type { User, Session } from "@supabase/supabase-js"

export interface AuthProfile {
    id: string
    role: "landlord" | "tenant" | "service_provider" | string
    is_verified: boolean
    full_name?: string
    email?: string
    phone?: string
    avatar_url?: string
    [key: string]: any
}

export interface AuthContextValue {
    user: User | null
    session: Session | null
    profile: AuthProfile | null
    providerStatus: string | null
    loading: boolean
    authError: string | null
    retryAuth: () => void
    isAuthenticated: boolean
    isLandlord: boolean
    isTenant: boolean
    isProvider: boolean
    isVerified: boolean
}

const AuthContext = createContext<AuthContextValue>({
    user: null, session: null, profile: null, providerStatus: null, loading: true,
    authError: null, retryAuth: () => {}, isAuthenticated: false, isLandlord: false,
    isTenant: false, isProvider: false, isVerified: false,
})

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [profile, setProfile] = useState<AuthProfile | null>(null)
    const [providerStatus, setProviderStatus] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [authError, setAuthError] = useState<string | null>(null)
    const [attempt, setAttempt] = useState(0)
    const currentUserId = useRef<string | null>(null)

    useEffect(() => {
        let active = true
        let revision = 0
        const timers = new Set<ReturnType<typeof setTimeout>>()
        setLoading(true)
        setAuthError(null)

        const applySession = (nextSession: Session | null) => {
            if (!active) return
            const requestRevision = ++revision
            const nextUserId = nextSession?.user.id ?? null
            if (currentUserId.current !== nextUserId) {
                setProfile(null)
                setProviderStatus(null)
            }
            currentUserId.current = nextUserId
            setSession(nextSession)
            setUser(nextSession?.user ?? null)
            setAuthError(null)
            if (!nextUserId) { setLoading(false); return }
            setLoading(true)
            const timer = setTimeout(async () => {
                timers.delete(timer)
                try {
                    const { data, error } = await supabase.from("profiles").select("*").eq("id", nextUserId).maybeSingle()
                    if (error) throw error
                    if (!data) throw new Error("Account profile is unavailable")
                    let status: string | null = null
                    if (data.role === "service_provider") {
                        const result = await supabase.from("service_providers").select("approval_status").eq("user_id", nextUserId).maybeSingle()
                        if (result.error) throw result.error
                        status = result.data?.approval_status ?? "incomplete"
                    }
                    if (!active || requestRevision !== revision) return
                    setProfile(data)
                    setProviderStatus(status)
                } catch {
                    if (active && requestRevision === revision) setAuthError("We could not load your account details. Check your connection and try again. Your saved account has not been deleted.")
                } finally {
                    if (active && requestRevision === revision) setLoading(false)
                }
            }, 0)
            timers.add(timer)
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => applySession(nextSession))
        const initialRevision = revision
        void supabase.auth.getSession().then(({ data, error }) => {
            if (!active || revision !== initialRevision) return
            if (error) throw error
            applySession(data.session)
        }).catch(() => {
            if (!active || revision !== initialRevision) return
            setAuthError("We could not reconnect to your account. Check your connection and try again.")
            setLoading(false)
        })
        const reconnect = () => setAttempt(value => value + 1)
        window.addEventListener("online", reconnect)
        return () => {
            active = false
            revision++
            subscription.unsubscribe()
            timers.forEach(timer => clearTimeout(timer))
            window.removeEventListener("online", reconnect)
        }
    }, [attempt])

    return <AuthContext.Provider value={{
        user, session, profile, providerStatus, loading, authError,
        retryAuth: () => setAttempt(value => value + 1),
        isAuthenticated: !!user, isLandlord: profile?.role === "landlord",
        isTenant: profile?.role === "tenant", isProvider: profile?.role === "service_provider",
        isVerified: profile?.is_verified ?? false,
    }}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue { return useContext(AuthContext) }
