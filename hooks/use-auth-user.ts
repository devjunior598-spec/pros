/**
 * hooks/use-auth-user.ts
 *
 * Drop-in replacement for the `await supabase.auth.getUser()` pattern used in
 * dashboard pages. Returns the same shape ({ user, profile, loading }) but
 * sources everything from the singleton AuthContext — zero direct Supabase
 * auth calls, zero lock contention.
 *
 * Usage (before):
 *   const { data: { user } } = await supabase.auth.getUser()
 *   const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id)...
 *
 * Usage (after):
 *   const { user, profile, loading } = useAuthUser()
 */

"use client"

import { useAuth } from "@/contexts/auth-context"
import type { AuthProfile } from "@/contexts/auth-context"
import type { User } from "@supabase/supabase-js"

export interface AuthUserResult {
    user:     User | null
    userId:   string | null
    profile:  AuthProfile | null
    loading:  boolean
    /** Convenience: user.user_metadata.full_name or profile.full_name */
    displayName: string
}

export function useAuthUser(): AuthUserResult {
    const { user, profile, loading } = useAuth()

    return {
        user,
        userId:  user?.id ?? null,
        profile,
        loading,
        displayName:
            profile?.full_name ||
            user?.user_metadata?.full_name ||
            user?.email?.split("@")[0] ||
            "User",
    }
}
