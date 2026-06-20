"use client"

/**
 * contexts/auth-context.tsx
 *
 * SINGLETON auth context for PRMS.
 *
 * ROOT CAUSE of the "Lock broken by another request with the 'steal' option" error:
 *  - Supabase uses an IndexedDB mutex (navigator.locks) to serialize auth operations.
 *  - When 44+ components each call supabase.auth.getUser() on mount simultaneously,
 *    they race for the lock. Each new request steals it from the previous one, causing
 *    the AbortError cascade.
 *
 * FIX:
 *  - Call supabase.auth.getUser() EXACTLY ONCE here in the context provider.
 *  - Subscribe to onAuthStateChange once. All components read from context — zero direct calls.
 *  - The in-flight promise is memoised so even if the provider re-renders it only fetches once.
 */

import {
    createContext,
    useContext,
    useEffect,
    useState,
    useRef,
    ReactNode,
} from "react"
import { supabase } from "@/lib/supabase"
import type { User, Session } from "@supabase/supabase-js"

// ── Types ─────────────────────────────────────────────────────────────────────
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
    /** Raw Supabase user object */
    user:           User | null
    /** Current active session */
    session:        Session | null
    /** Fully loaded profile from the `profiles` table */
    profile:        AuthProfile | null
    /** Provider approval_status (service_provider role only) */
    providerStatus: string | null
    /** True while the initial auth + profile fetch is in progress */
    loading:        boolean
    /** Convenience shorthand */
    isAuthenticated: boolean
    isLandlord:     boolean
    isTenant:       boolean
    isProvider:     boolean
    isVerified:     boolean
}

const AuthContext = createContext<AuthContextValue>({
    user:            null,
    session:         null,
    profile:         null,
    providerStatus:  null,
    loading:         true,
    isAuthenticated: false,
    isLandlord:      false,
    isTenant:        false,
    isProvider:      false,
    isVerified:      false,
})

// ── Single in-flight fetch promise (survives React Strict-Mode double-invoke) ─
let inflightFetch: Promise<void> | null = null

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user,           setUser]           = useState<User | null>(null)
    const [session,        setSession]        = useState<Session | null>(null)
    const [profile,        setProfile]        = useState<AuthProfile | null>(null)
    const [providerStatus, setProviderStatus] = useState<string | null>(null)
    const [loading,        setLoading]        = useState(true)
    const mounted = useRef(true)

    // ── Load profile for a given user ID ─────────────────────────────────────
    const loadProfile = async (userId: string) => {
        const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .maybeSingle()

        if (!mounted.current) return

        if (data) {
            setProfile(data)
            if (data.role === "service_provider") {
                const { data: sp } = await supabase
                    .from("service_providers")
                    .select("approval_status")
                    .eq("user_id", userId)
                    .maybeSingle()
                if (mounted.current) setProviderStatus(sp?.approval_status ?? null)
            }
        }
    }

    useEffect(() => {
        mounted.current = true

        // ── Step 1: One-time initial session read ─────────────────────────────
        // Use getSession() — it reads from localStorage synchronously (no lock needed).
        // Wrap in try-catch: if the token refresh network call fails ("Failed to fetch")
        // we treat the user as logged-out rather than hanging on loading=true.
        const init = async () => {
            try {
                const { data: { session: s }, error } = await supabase.auth.getSession()
                if (!mounted.current) return
                // If Supabase couldn't refresh the token (network error), sign out cleanly
                if (error) {
                    console.warn('[AuthProvider] getSession error — treating as logged out:', error.message)
                    await supabase.auth.signOut().catch(() => {})
                    if (mounted.current) setLoading(false)
                    return
                }
                setSession(s)
                setUser(s?.user ?? null)
                if (s?.user) await loadProfile(s.user.id)
            } catch (err: any) {
                // Network failure ("Failed to fetch") — Supabase unreachable
                // Don't throw; just resolve as unauthenticated
                if (mounted.current) {
                    console.warn('[AuthProvider] Network error during session init — offline?', err?.message)
                }
            } finally {
                if (mounted.current) setLoading(false)
            }
        }

        // Deduplicate: if another instance of this component is already fetching, wait for it
        if (!inflightFetch) {
            inflightFetch = init().finally(() => { inflightFetch = null })
        } else {
            inflightFetch.finally(() => { if (mounted.current) setLoading(false) })
        }

        // ── Step 2: Subscribe to auth state changes ───────────────────────────
        // onAuthStateChange is event-driven — it does NOT hold the lock.
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
                if (!mounted.current) return

                // TOKEN_REFRESH_FAILED = Supabase couldn't silently refresh the token.
                // This happens when: network is offline, refresh token is expired,
                // or the Supabase project is paused. Sign out cleanly.
                if ((event as string) === 'TOKEN_REFRESH_FAILED') {
                    setSession(null)
                    setUser(null)
                    setProfile(null)
                    setProviderStatus(null)
                    if (mounted.current) setLoading(false)
                    return
                }

                setSession(newSession)
                setUser(newSession?.user ?? null)

                if (newSession?.user) {
                    await loadProfile(newSession.user.id)
                } else {
                    setProfile(null)
                    setProviderStatus(null)
                }
                // Ensure loading is cleared after any auth event
                if (mounted.current) setLoading(false)
            }
        )

        return () => {
            mounted.current = false
            subscription.unsubscribe()
        }
    }, [])  

    const value: AuthContextValue = {
        user,
        session,
        profile,
        providerStatus,
        loading,
        isAuthenticated: !!user,
        isLandlord:      profile?.role === "landlord",
        isTenant:        profile?.role === "tenant",
        isProvider:      profile?.role === "service_provider",
        isVerified:      profile?.is_verified ?? false,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ── Consumer hook ─────────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
    return useContext(AuthContext)
}
