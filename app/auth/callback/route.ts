import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { safeAuthDestination } from "@/lib/auth-redirects"

export async function GET(request: Request) {
    const url = new URL(request.url)
    const code = url.searchParams.get("code")
    const tokenHash = url.searchParams.get("token_hash")
    const type = url.searchParams.get("type")
    const destination = type === "recovery" ? "/reset-password" : safeAuthDestination(url.searchParams.get("next"))
    try {
        const client = await createClient()
        const result = code
            ? await client.auth.exchangeCodeForSession(code)
            : tokenHash && (type === "signup" || type === "recovery" || type === "email" || type === "invite" || type === "email_change")
                ? await client.auth.verifyOtp({ token_hash: tokenHash, type })
                : null
        if (result && !result.error) {
            const response = NextResponse.redirect(new URL(destination, url.origin))
            response.headers.set("Cache-Control", "private, no-store")
            response.headers.set("Referrer-Policy", "no-referrer")
            return response
        }
    } catch {}
    const response = NextResponse.redirect(new URL("/auth/error", url.origin))
    response.headers.set("Cache-Control", "private, no-store")
    response.headers.set("Referrer-Policy", "no-referrer")
    return response
}
