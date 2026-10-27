import { NextResponse } from "next/server"
import { getCurrentUserWithRole } from "@/lib/supabase-server"

/**
 * Server-side authorization for every admin API route. Client-side role guards
 * only affect navigation; they must never be the authority for privileged data
 * or account actions.
 */
export async function requireAdmin() {
    const currentUser = await getCurrentUserWithRole()

    if (!currentUser) {
        return {
            currentUser: null,
            response: NextResponse.json({ error: "Authentication required" }, { status: 401 }),
        }
    }

    if (currentUser.role !== "admin") {
        return {
            currentUser: null,
            response: NextResponse.json({ error: "Administrator access required" }, { status: 403 }),
        }
    }

    if (!currentUser.user.email_confirmed_at) {
        return {
            currentUser: null,
            response: NextResponse.json({ error: "Confirmed email required" }, { status: 403 }),
        }
    }

    const supabase = await import("@/lib/supabase-server").then((mod) => mod.createClient())
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

    if (data?.currentLevel !== "aal2") {
        return {
            currentUser: null,
            response: NextResponse.json({ error: "Multi-factor authentication required" }, { status: 403 }),
        }
    }

    return { currentUser, response: null }
}
